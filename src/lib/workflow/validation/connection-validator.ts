import {
  Connection,
  ConnectionValidationResult,
  ConnectionValidationError,
  ConnectionValidationWarning,
  ConnectionRules,
  ConnectionErrorType,
  ConnectionWarningType,
} from "../types/connection";
import { WorkflowNode, NodeDefinition, NodeInput, NodeOutput } from "../types/node";
import { Workflow } from "../types/workflow";

/**
 * Validates connections in a workflow
 */
export class ConnectionValidator {
  private nodeDefinitions: Map<string, NodeDefinition>;
  private rules: ConnectionRules;

  constructor(
    nodeDefinitions: Map<string, NodeDefinition>,
    rules: ConnectionRules = {}
  ) {
    this.nodeDefinitions = nodeDefinitions;
    this.rules = {
      allowMultipleInputs: false,
      allowSelfConnection: false,
      allowCircularDependencies: false,
      typeStrictness: "strict",
      requiredConnections: [],
      ...rules,
    };
  }

  /**
   * Validate all connections in a workflow
   */
  validateWorkflow(workflow: Workflow): ConnectionValidationResult {
    const errors: ConnectionValidationError[] = [];
    const warnings: ConnectionValidationWarning[] = [];

    // Create node map for quick lookup
    const nodeMap = new Map(workflow.nodes.map((node) => [node.id, node]));

    // Validate individual connections
    for (const connection of workflow.connections) {
      const result = this.validateConnection(connection, nodeMap);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }

    // Check for circular dependencies
    if (!this.rules.allowCircularDependencies) {
      const circularErrors = this.detectCircularDependencies(workflow);
      errors.push(...circularErrors);
    }

    // Check for required connections
    const requiredErrors = this.checkRequiredConnections(workflow);
    errors.push(...requiredErrors);

    // Check for unused outputs
    const unusedWarnings = this.checkUnusedOutputs(workflow);
    warnings.push(...unusedWarnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a single connection
   */
  private validateConnection(
    connection: Connection,
    nodeMap: Map<string, WorkflowNode>
  ): { errors: ConnectionValidationError[]; warnings: ConnectionValidationWarning[] } {
    const errors: ConnectionValidationError[] = [];
    const warnings: ConnectionValidationWarning[] = [];

    // Check source node exists
    const sourceNode = nodeMap.get(connection.source.nodeId);
    if (!sourceNode) {
      errors.push({
        type: "missing_source",
        message: `Source node '${connection.source.nodeId}' not found`,
        connectionId: connection.id,
      });
      return { errors, warnings };
    }

    // Check target node exists
    const targetNode = nodeMap.get(connection.target.nodeId);
    if (!targetNode) {
      errors.push({
        type: "missing_target",
        message: `Target node '${connection.target.nodeId}' not found`,
        connectionId: connection.id,
      });
      return { errors, warnings };
    }

    // Check self-connection
    if (!this.rules.allowSelfConnection && sourceNode.id === targetNode.id) {
      errors.push({
        type: "invalid_source_port",
        message: "Self-connections are not allowed",
        connectionId: connection.id,
      });
    }

    // Get node definitions
    const sourceDef = this.nodeDefinitions.get(sourceNode.nodeId);
    const targetDef = this.nodeDefinitions.get(targetNode.nodeId);

    if (!sourceDef || !targetDef) {
      errors.push({
        type: "invalid_source_port",
        message: "Node definition not found",
        connectionId: connection.id,
      });
      return { errors, warnings };
    }

    // Validate ports
    if (connection.source.port) {
      const sourcePort = sourceDef.outputs.find(
        (output) => output.name === connection.source.port
      );
      if (!sourcePort) {
        errors.push({
          type: "invalid_source_port",
          message: `Output port '${connection.source.port}' not found on source node`,
          connectionId: connection.id,
        });
      }
    }

    if (connection.target.port) {
      const targetPort = targetDef.inputs.find(
        (input) => input.name === connection.target.port
      );
      if (!targetPort) {
        errors.push({
          type: "invalid_target_port",
          message: `Input port '${connection.target.port}' not found on target node`,
          connectionId: connection.id,
        });
      }
    }

    // Type checking
    if (this.rules.typeStrictness !== "none") {
      const typeResult = this.checkTypeCompatibility(
        connection,
        sourceDef,
        targetDef
      );
      if (!typeResult.compatible) {
        if (this.rules.typeStrictness === "strict") {
          errors.push({
            type: "type_mismatch",
            message: typeResult.message || "Type mismatch between source and target",
            connectionId: connection.id,
          });
        } else {
          warnings.push({
            type: "type_coercion",
            message: typeResult.message || "Type coercion may be required",
            connectionId: connection.id,
          });
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Check type compatibility between source and target
   */
  private checkTypeCompatibility(
    connection: Connection,
    sourceDef: NodeDefinition,
    targetDef: NodeDefinition
  ): { compatible: boolean; message?: string } {
    const sourcePort = connection.source.port
      ? sourceDef.outputs.find((o) => o.name === connection.source.port)
      : sourceDef.outputs[0];

    const targetPort = connection.target.port
      ? targetDef.inputs.find((i) => i.name === connection.target.port)
      : targetDef.inputs[0];

    if (!sourcePort || !targetPort) {
      return { compatible: false, message: "Port not found" };
    }

    // Check if types are compatible
    if (sourcePort.type === targetPort.type || targetPort.type === "any") {
      return { compatible: true };
    }

    // Check for compatible type conversions
    const compatibleConversions: Record<string, string[]> = {
      number: ["string"],
      string: ["number", "boolean"],
      boolean: ["string", "number"],
      array: ["string"],
      object: ["string"],
    };

    const allowedConversions = compatibleConversions[sourcePort.type] || [];
    if (allowedConversions.includes(targetPort.type)) {
      return {
        compatible: true,
        message: `Type conversion from ${sourcePort.type} to ${targetPort.type}`,
      };
    }

    return {
      compatible: false,
      message: `Cannot convert ${sourcePort.type} to ${targetPort.type}`,
    };
  }

  /**
   * Detect circular dependencies in the workflow
   */
  private detectCircularDependencies(
    workflow: Workflow
  ): ConnectionValidationError[] {
    const errors: ConnectionValidationError[] = [];
    const adjacencyList = this.buildAdjacencyList(workflow);
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const node of workflow.nodes) {
      if (!visited.has(node.id)) {
        const cycle = this.hasCycleDFS(
          node.id,
          adjacencyList,
          visited,
          recursionStack,
          []
        );
        if (cycle.length > 0) {
          errors.push({
            type: "circular_dependency",
            message: `Circular dependency detected: ${cycle.join(" -> ")}`,
            details: { cycle },
          });
        }
      }
    }

    return errors;
  }

  /**
   * Build adjacency list from connections
   */
  private buildAdjacencyList(workflow: Workflow): Map<string, string[]> {
    const adjacencyList = new Map<string, string[]>();

    // Initialize all nodes
    for (const node of workflow.nodes) {
      adjacencyList.set(node.id, []);
    }

    // Add connections
    for (const connection of workflow.connections) {
      const neighbors = adjacencyList.get(connection.source.nodeId) || [];
      neighbors.push(connection.target.nodeId);
      adjacencyList.set(connection.source.nodeId, neighbors);
    }

    return adjacencyList;
  }

  /**
   * DFS to detect cycles
   */
  private hasCycleDFS(
    nodeId: string,
    adjacencyList: Map<string, string[]>,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[]
  ): string[] {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const cycle = this.hasCycleDFS(
          neighbor,
          adjacencyList,
          visited,
          recursionStack,
          [...path]
        );
        if (cycle.length > 0) {
          return cycle;
        }
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        return [...path.slice(cycleStart), neighbor];
      }
    }

    recursionStack.delete(nodeId);
    return [];
  }

  /**
   * Check for required connections
   */
  private checkRequiredConnections(
    workflow: Workflow
  ): ConnectionValidationError[] {
    const errors: ConnectionValidationError[] = [];

    for (const requirement of this.rules.requiredConnections || []) {
      const node = workflow.nodes.find((n) => n.id === requirement.nodeId);
      if (!node) continue;

      const nodeDef = this.nodeDefinitions.get(node.nodeId);
      if (!nodeDef) continue;

      // Check required inputs are connected
      for (const requiredPort of requirement.ports) {
        const input = nodeDef.inputs.find((i) => i.name === requiredPort);
        if (!input?.required) continue;

        const hasConnection = workflow.connections.some(
          (c) =>
            c.target.nodeId === node.id && c.target.port === requiredPort
        );

        if (!hasConnection && !node.inputs[requiredPort]) {
          errors.push({
            type: "missing_target",
            message: `Required input '${requiredPort}' on node '${node.id}' is not connected`,
            details: { nodeId: node.id, port: requiredPort },
          });
        }
      }
    }

    return errors;
  }

  /**
   * Check for unused outputs
   */
  private checkUnusedOutputs(
    workflow: Workflow
  ): ConnectionValidationWarning[] {
    const warnings: ConnectionValidationWarning[] = [];
    const connectedOutputs = new Set<string>();

    // Track all connected outputs
    for (const connection of workflow.connections) {
      connectedOutputs.add(
        `${connection.source.nodeId}:${connection.source.port || "default"}`
      );
    }

    // Check for unused outputs
    for (const node of workflow.nodes) {
      const nodeDef = this.nodeDefinitions.get(node.nodeId);
      if (!nodeDef) continue;

      for (const output of nodeDef.outputs) {
        const outputKey = `${node.id}:${output.name}`;
        if (!connectedOutputs.has(outputKey)) {
          // Check if this is a workflow output
          const isWorkflowOutput = workflow.outputs?.some(
            (o) => o.source === `${node.id}.${output.name}`
          );

          if (!isWorkflowOutput) {
            warnings.push({
              type: "unused_output",
              message: `Output '${output.name}' on node '${node.id}' is not connected`,
              details: { nodeId: node.id, port: output.name },
            });
          }
        }
      }
    }

    return warnings;
  }
}