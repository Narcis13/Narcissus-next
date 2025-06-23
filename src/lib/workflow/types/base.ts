/**
 * Base types for the workflow system
 */

/**
 * Supported data types for node inputs and outputs
 */
export type DataType = 
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "array"
  | "any"
  | "file"
  | "date"
  | "json";

/**
 * Node categories for organization and discovery
 */
export type NodeCategory = 
  | "logic"
  | "data"
  | "integration"
  | "ai"
  | "utility"
  | "trigger"
  | "action"
  | "transform";

/**
 * Workflow execution status
 */
export type WorkflowStatus = 
  | "idle"
  | "running"
  | "completed"
  | "failed"
  | "paused"
  | "cancelled";

/**
 * Node execution status
 */
export type NodeStatus = 
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

/**
 * Edge types for conditional branching
 */
export type EdgeType = 
  | "default"
  | "success"
  | "error"
  | "condition"
  | "loop";

/**
 * Base metadata interface
 */
export interface Metadata {
  createdAt: Date;
  updatedAt: Date;
  version: string;
  author?: string;
  tags?: string[];
}

/**
 * Error details for failed executions
 */
export interface ExecutionError {
  code: string;
  message: string;
  nodeId?: string;
  timestamp: Date;
  stack?: string;
  details?: Record<string, any>;
}