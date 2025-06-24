/**
 * FlowManager-compatible workflow types
 * 
 * FlowManager workflows are simple JSON structures where nodes are arranged
 * in an array and executed sequentially with branching and looping support.
 */

/**
 * A node in the workflow can be:
 * - A string: Reference to a node by ID or name (e.g., "http.request.get" or "Send Email")
 * - A parameterized call: Object with node ID/name as key and params as value
 * - A sub-flow: Array of nodes
 * - A loop: Double array with controller and actions
 * - A branch: Object with edge names as keys and nodes as values
 * 
 * Note: Nodes can be invoked by their ID (e.g., "http.request.get") or by a human-readable
 * name (e.g., "Send Email"). FlowManager will resolve both through the scope.
 */
export type FlowNode = 
  | string // Simple node reference: "node.id"
  | ParameterizedNode // Parameterized call: { "node.id": { param: value } }
  | FlowNode[] // Sub-flow: [node1, node2, ...]
  | [FlowNode[]] // Loop: [[controller, action1, action2]]
  | BranchNode; // Branch: { "success": node1, "error": node2 }

/**
 * Parameterized node call
 */
export type ParameterizedNode = {
  [nodeId: string]: Record<string, any>;
};

/**
 * Branch node - executes different paths based on previous node's edges
 */
export type BranchNode = {
  [edgeName: string]: FlowNode;
};

/**
 * Main workflow structure for FlowManager
 */
export interface FlowManagerWorkflow {
  // Core fields
  name: string;
  description?: string;
  
  // The actual workflow - array of nodes
  nodes: FlowNode[];
  
  // Initial state for the workflow (accessible via ${path.to.value} in node parameters)
  // State can be accessed/modified in nodes via:
  // - ${state.someValue} in parameters
  // - this.state.get('path.to.value') in node implementations
  // - this.state.set('path.to.value', newValue) in node implementations
  initialState?: Record<string, any>;
  
  // These are for UI/storage, not used by FlowManager
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
}

/**
 * Workflow validation result
 */
export interface FlowManagerValidationResult {
  valid: boolean;
  errors: FlowManagerValidationError[];
  warnings?: FlowManagerValidationWarning[];
}

/**
 * Validation error
 */
export interface FlowManagerValidationError {
  type: 'syntax' | 'unknown_node' | 'invalid_structure' | 'circular_reference' | 'invalid_params';
  message: string;
  path?: string;
  nodeIndex?: number;
}

/**
 * Validation warning
 */
export interface FlowManagerValidationWarning {
  type: 'deprecated_node' | 'unused_variable' | 'performance';
  message: string;
  path?: string;
}

/**
 * Workflow execution status (for database storage)
 */
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
  logs?: string;
  mode?: 'immediate' | 'queued';
  metadata?: Record<string, any>;
}

/**
 * Helper type guards
 */
export function isParameterizedNode(node: FlowNode): node is ParameterizedNode {
  return typeof node === 'object' && 
         !Array.isArray(node) && 
         Object.keys(node).length === 1 &&
         typeof Object.values(node)[0] === 'object';
}

export function isSubFlow(node: FlowNode): node is FlowNode[] {
  return Array.isArray(node) && 
         node.length > 0 && 
         !Array.isArray(node[0]);
}

export function isLoop(node: FlowNode): node is [FlowNode[]] {
  return Array.isArray(node) && 
         node.length === 1 && 
         Array.isArray(node[0]);
}

export function isBranchNode(node: FlowNode): node is BranchNode {
  return typeof node === 'object' && 
         !Array.isArray(node) && 
         !isParameterizedNode(node);
}

export function isStringNode(node: FlowNode): node is string {
  return typeof node === 'string';
}