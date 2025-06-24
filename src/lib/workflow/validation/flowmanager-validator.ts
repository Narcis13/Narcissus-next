import { 
  FlowManagerWorkflow, 
  FlowNode, 
  FlowManagerValidationResult, 
  FlowManagerValidationError,
  FlowManagerValidationWarning,
  isParameterizedNode,
  isSubFlow,
  isLoop,
  isBranchNode,
  isStringNode
} from "../types/flowmanager-workflow";
import { NodeRegistry } from "@/lib/flow-engine/core/NodeRegistry";

/**
 * Validator for FlowManager workflows
 */
export class FlowManagerValidator {
  private nodeRegistry: typeof NodeRegistry;
  private availableNodes: Set<string>;

  constructor() {
    this.nodeRegistry = NodeRegistry;
    // Get all available node IDs
    this.availableNodes = new Set();
    const scope = this.nodeRegistry.getScope();
    Object.keys(scope).forEach(key => {
      // Extract node ID from "id:name" format
      const nodeId = key.split(':')[0];
      if (nodeId) {
        this.availableNodes.add(nodeId);
      }
    });
  }

  /**
   * Validate a FlowManager workflow
   */
  validate(workflow: FlowManagerWorkflow): FlowManagerValidationResult {
    const errors: FlowManagerValidationError[] = [];
    const warnings: FlowManagerValidationWarning[] = [];

    // Basic structure validation
    if (!workflow.name || workflow.name.trim() === '') {
      errors.push({
        type: 'invalid_structure',
        message: 'Workflow name is required'
      });
    }

    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      errors.push({
        type: 'invalid_structure',
        message: 'Workflow must have a nodes array'
      });
      return { valid: false, errors, warnings };
    }

    if (workflow.nodes.length === 0) {
      errors.push({
        type: 'invalid_structure',
        message: 'Workflow must have at least one node'
      });
      return { valid: false, errors, warnings };
    }

    // Validate each node
    const visitedNodes = new Set<string>();
    const nodeValidation = this.validateNodes(workflow.nodes, [], visitedNodes);
    errors.push(...nodeValidation.errors);
    warnings.push(...nodeValidation.warnings);


    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Recursively validate nodes
   */
  private validateNodes(
    nodes: FlowNode[], 
    path: (string | number)[],
    visitedNodes: Set<string>
  ): { errors: FlowManagerValidationError[], warnings: FlowManagerValidationWarning[] } {
    const errors: FlowManagerValidationError[] = [];
    const warnings: FlowManagerValidationWarning[] = [];

    nodes.forEach((node, index) => {
      const nodePath = [...path, index];
      const validation = this.validateNode(node, nodePath, visitedNodes);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);
    });

    return { errors, warnings };
  }

  /**
   * Validate a single node
   */
  private validateNode(
    node: FlowNode,
    path: (string | number)[],
    visitedNodes: Set<string>
  ): { errors: FlowManagerValidationError[], warnings: FlowManagerValidationWarning[] } {
    const errors: FlowManagerValidationError[] = [];
    const warnings: FlowManagerValidationWarning[] = [];
    const pathStr = path.join('.');

    // String node
    if (isStringNode(node)) {
      if (!this.isValidNodeId(node)) {
        errors.push({
          type: 'unknown_node',
          message: `Unknown node: "${node}"`,
          path: pathStr,
          nodeIndex: path[path.length - 1] as number
        });
      }
      // Check for circular references
      if (visitedNodes.has(node)) {
        warnings.push({
          type: 'performance',
          message: `Node "${node}" is used multiple times, consider using a sub-flow for better organization`,
          path: pathStr
        });
      }
      visitedNodes.add(node);
    }
    // Parameterized node
    else if (isParameterizedNode(node)) {
      const nodeId = Object.keys(node)[0];
      if (!this.isValidNodeId(nodeId)) {
        errors.push({
          type: 'unknown_node',
          message: `Unknown node: "${nodeId}"`,
          path: pathStr,
          nodeIndex: path[path.length - 1] as number
        });
      }
      
      const params = node[nodeId];
      if (typeof params !== 'object' || params === null) {
        errors.push({
          type: 'invalid_params',
          message: `Invalid parameters for node "${nodeId}": must be an object`,
          path: pathStr
        });
      }
    }
    // Sub-flow
    else if (isSubFlow(node)) {
      if (node.length === 0) {
        warnings.push({
          type: 'performance',
          message: 'Empty sub-flow detected',
          path: pathStr
        });
      } else {
        const subValidation = this.validateNodes(node, [...path, 'subflow'], visitedNodes);
        errors.push(...subValidation.errors);
        warnings.push(...subValidation.warnings);
      }
    }
    // Loop
    else if (isLoop(node)) {
      const loopNodes = node[0];
      if (loopNodes.length === 0) {
        errors.push({
          type: 'invalid_structure',
          message: 'Loop must have at least a controller node',
          path: pathStr
        });
      } else {
        const loopValidation = this.validateNodes(loopNodes, [...path, 'loop'], visitedNodes);
        errors.push(...loopValidation.errors);
        warnings.push(...loopValidation.warnings);
        
        // Check if first node is a valid loop controller
        const controller = loopNodes[0];
        if (isStringNode(controller) && controller.includes('loop')) {
          // Good - likely a loop controller
        } else {
          warnings.push({
            type: 'performance',
            message: 'First node in loop should be a loop controller',
            path: `${pathStr}.loop.0`
          });
        }
      }
    }
    // Branch node
    else if (isBranchNode(node)) {
      const edges = Object.keys(node);
      if (edges.length === 0) {
        errors.push({
          type: 'invalid_structure',
          message: 'Branch node must have at least one edge',
          path: pathStr
        });
      }
      
      edges.forEach(edge => {
        const branchNode = node[edge];
        const branchPath = [...path, edge];
        const branchValidation = this.validateNode(branchNode, branchPath, visitedNodes);
        errors.push(...branchValidation.errors);
        warnings.push(...branchValidation.warnings);
      });
    }
    // Unknown structure
    else {
      errors.push({
        type: 'invalid_structure',
        message: 'Invalid node structure',
        path: pathStr,
        nodeIndex: path[path.length - 1] as number
      });
    }

    return { errors, warnings };
  }

  /**
   * Check if a node ID is valid (exists in registry)
   */
  private isValidNodeId(nodeId: string): boolean {
    // First check exact match
    if (this.availableNodes.has(nodeId)) {
      return true;
    }
    
    // Also check if it's a valid function reference (for custom scope functions)
    // This allows for user-defined functions
    return /^[a-zA-Z_][a-zA-Z0-9._]*$/.test(nodeId);
  }


  /**
   * Format validation errors for display
   */
  formatErrors(errors: FlowManagerValidationError[]): string[] {
    return errors.map(error => {
      let message = error.message;
      if (error.path) {
        message += ` (at ${error.path})`;
      }
      return message;
    });
  }
}