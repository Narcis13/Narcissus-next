import { DataType } from "./base";

/**
 * Connection between two nodes in a workflow
 */
export interface Connection {
  id: string; // Unique connection ID
  source: ConnectionEndpoint;
  target: ConnectionEndpoint;
  type?: ConnectionType;
  condition?: ConnectionCondition;
  metadata?: {
    label?: string;
    description?: string;
    color?: string;
  };
}

/**
 * Connection endpoint (source or target)
 */
export interface ConnectionEndpoint {
  nodeId: string; // ID of the workflow node instance
  port?: string; // Output port name for source, input port name for target
  edge?: string; // Edge name for conditional branching
}

/**
 * Connection types
 */
export type ConnectionType = 
  | "data" // Normal data flow
  | "control" // Control flow (e.g., after completion)
  | "conditional" // Conditional branching
  | "loop" // Loop connections
  | "error"; // Error handling connections

/**
 * Condition for conditional connections
 */
export interface ConnectionCondition {
  type: "expression" | "value" | "custom";
  expression?: string; // JavaScript expression
  value?: any; // Direct value comparison
  operator?: "eq" | "ne" | "gt" | "lt" | "gte" | "lte" | "contains" | "regex";
  custom?: (value: any, context: any) => boolean;
}

/**
 * Connection validation result
 */
export interface ConnectionValidationResult {
  valid: boolean;
  errors?: ConnectionValidationError[];
  warnings?: ConnectionValidationWarning[];
}

/**
 * Connection validation error
 */
export interface ConnectionValidationError {
  type: ConnectionErrorType;
  message: string;
  connectionId?: string;
  details?: Record<string, any>;
}

/**
 * Connection validation warning
 */
export interface ConnectionValidationWarning {
  type: ConnectionWarningType;
  message: string;
  connectionId?: string;
  details?: Record<string, any>;
}

/**
 * Types of connection errors
 */
export type ConnectionErrorType = 
  | "missing_source"
  | "missing_target"
  | "invalid_source_port"
  | "invalid_target_port"
  | "type_mismatch"
  | "circular_dependency"
  | "duplicate_connection"
  | "invalid_condition";

/**
 * Types of connection warnings
 */
export type ConnectionWarningType = 
  | "unused_output"
  | "multiple_inputs"
  | "type_coercion"
  | "deprecated_connection";

/**
 * Port definition for nodes
 */
export interface Port {
  name: string;
  type: DataType;
  multiple?: boolean; // Can accept multiple connections
  required?: boolean;
  description?: string;
}

/**
 * Connection rules for validation
 */
export interface ConnectionRules {
  allowMultipleInputs?: boolean;
  allowSelfConnection?: boolean;
  allowCircularDependencies?: boolean;
  typeStrictness?: "strict" | "loose" | "none";
  requiredConnections?: {
    nodeId: string;
    ports: string[];
  }[];
}