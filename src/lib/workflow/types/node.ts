import { DataType, NodeCategory, NodeStatus } from "./base";

/**
 * Node input parameter definition
 */
export interface NodeInput {
  name: string;
  type: DataType;
  description: string;
  required: boolean;
  default?: any;
  example?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
    custom?: (value: any) => boolean | string;
  };
}

/**
 * Node output definition
 */
export interface NodeOutput {
  name: string;
  type: DataType;
  description: string;
  example?: any;
}

/**
 * Edge definition for conditional branching
 */
export interface NodeEdge {
  name: string;
  description: string;
  outputType: DataType;
  condition?: string; // Expression to evaluate
}

/**
 * AI hints for better node discovery and usage
 */
export interface AIPromptHints {
  toolName: string;
  summary: string;
  useCase: string;
  expectedInputFormat: string;
  outputDescription: string;
  examples?: string[];
}

/**
 * Node definition interface
 */
export interface NodeDefinition {
  id: string; // Unique identifier like "logic.condition.if"
  version: string;
  name: string;
  description: string;
  categories: NodeCategory[];
  tags: string[];
  inputs: NodeInput[];
  outputs: NodeOutput[];
  edges?: NodeEdge[];
  aiPromptHints?: AIPromptHints;
  
  // Runtime configuration
  config?: {
    retryable?: boolean;
    timeout?: number; // milliseconds
    maxRetries?: number;
    retryDelay?: number; // milliseconds
    requiresAuth?: boolean;
    cacheable?: boolean;
    cacheTime?: number; // seconds
  };
  
  // Implementation
  implementation: NodeImplementation;
}

/**
 * Node implementation function type
 */
export type NodeImplementation = (
  params: NodeExecutionParams
) => Promise<NodeExecutionResult>;

/**
 * Parameters passed to node implementation
 */
export interface NodeExecutionParams {
  inputs: Record<string, any>;
  state: Record<string, any>;
  context: NodeExecutionContext;
  config?: Record<string, any>;
}

/**
 * Context available during node execution
 */
export interface NodeExecutionContext {
  workflowId: string;
  executionId: string;
  nodeId: string;
  userId?: string;
  secrets?: Record<string, string>;
  
  // Utility functions
  log: (message: string, level?: "info" | "warn" | "error") => void;
  emit: (event: string, data?: any) => void;
  getState: (path: string) => any;
  setState: (path: string, value: any) => void;
  
  // Flow control
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  branch: (edgeName: string) => void;
}

/**
 * Result returned from node execution
 */
export interface NodeExecutionResult {
  outputs?: Record<string, any>;
  edge?: string; // For branching
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    duration?: number;
    retries?: number;
    cached?: boolean;
  };
}

/**
 * Node instance in a workflow
 */
export interface WorkflowNode {
  id: string; // Unique instance ID
  nodeId: string; // Reference to NodeDefinition.id
  name?: string; // Override display name
  inputs: Record<string, any | string>; // Values or references like "${state.value}"
  config?: Record<string, any>; // Override node config
  position?: {
    x: number;
    y: number;
  };
}

/**
 * Node execution record
 */
export interface NodeExecutionRecord {
  nodeInstanceId: string;
  nodeDefinitionId: string;
  status: NodeStatus;
  startedAt: Date;
  completedAt?: Date;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}