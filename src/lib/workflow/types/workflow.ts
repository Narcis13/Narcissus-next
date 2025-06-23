import { WorkflowStatus, Metadata } from "./base";
import { WorkflowNode } from "./node";
import { Connection } from "./connection";

/**
 * Main workflow definition interface
 */
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  metadata: Metadata;
  
  // Workflow components
  nodes: WorkflowNode[];
  connections: Connection[];
  
  // Configuration
  config: WorkflowConfig;
  
  // Variables and inputs
  variables?: WorkflowVariable[];
  inputs?: WorkflowInput[];
  outputs?: WorkflowOutput[];
  
  // Triggers
  triggers?: WorkflowTrigger[];
}

/**
 * Workflow configuration
 */
export interface WorkflowConfig {
  retryPolicy?: RetryPolicy;
  timeout?: number; // milliseconds
  maxConcurrentNodes?: number;
  errorHandling?: ErrorHandlingStrategy;
  logging?: LoggingConfig;
  scheduling?: SchedulingConfig;
}

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  enabled: boolean;
  maxAttempts: number;
  backoffType: "fixed" | "exponential" | "linear";
  initialDelay: number; // milliseconds
  maxDelay?: number; // milliseconds
  retryableErrors?: string[]; // Error codes to retry
}

/**
 * Error handling strategy
 */
export type ErrorHandlingStrategy = 
  | "fail-fast" // Stop on first error
  | "continue" // Continue with other branches
  | "retry" // Retry failed nodes
  | "fallback"; // Use fallback values

/**
 * Logging configuration
 */
export interface LoggingConfig {
  level: "debug" | "info" | "warn" | "error";
  includeNodeInputs: boolean;
  includeNodeOutputs: boolean;
  includeState: boolean;
}

/**
 * Scheduling configuration
 */
export interface SchedulingConfig {
  cron?: string;
  timezone?: string;
  enabled: boolean;
}

/**
 * Workflow variable definition
 */
export interface WorkflowVariable {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  defaultValue?: any;
  description?: string;
  scope: "global" | "local";
  mutable: boolean;
}

/**
 * Workflow input definition
 */
export interface WorkflowInput {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  default?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
  };
}

/**
 * Workflow output definition
 */
export interface WorkflowOutput {
  name: string;
  type: string;
  description?: string;
  source: string; // Node ID or expression
}

/**
 * Workflow trigger definition
 */
export interface WorkflowTrigger {
  id: string;
  type: TriggerType;
  enabled: boolean;
  config: Record<string, any>;
  conditions?: TriggerCondition[];
}

/**
 * Trigger types
 */
export type TriggerType = 
  | "manual"
  | "schedule"
  | "webhook"
  | "email"
  | "file"
  | "database"
  | "event";

/**
 * Trigger condition
 */
export interface TriggerCondition {
  field: string;
  operator: string;
  value: any;
}

/**
 * Workflow validation result
 */
export interface WorkflowValidationResult {
  valid: boolean;
  errors: WorkflowValidationError[];
  warnings: WorkflowValidationWarning[];
}

/**
 * Workflow validation error
 */
export interface WorkflowValidationError {
  type: string;
  message: string;
  path?: string;
  nodeId?: string;
  connectionId?: string;
}

/**
 * Workflow validation warning
 */
export interface WorkflowValidationWarning {
  type: string;
  message: string;
  path?: string;
  nodeId?: string;
}

/**
 * Workflow execution instance
 */
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersion: string;
  status: WorkflowStatus;
  startedAt: Date;
  completedAt?: Date;
  
  // Execution data
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  state: Record<string, any>;
  
  // Error information
  error?: {
    code: string;
    message: string;
    nodeId?: string;
    stack?: string;
  };
  
  // Execution metadata
  metadata: {
    triggeredBy: string; // User ID or trigger ID
    triggerType: string;
    duration?: number;
    nodesExecuted: number;
    nodesFailed: number;
  };
}

/**
 * Workflow template for quick starts
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  workflow: Partial<Workflow>;
  preview?: string; // Preview image URL
  examples?: WorkflowExample[];
}

/**
 * Workflow example
 */
export interface WorkflowExample {
  name: string;
  description: string;
  inputs: Record<string, any>;
  expectedOutputs: Record<string, any>;
}