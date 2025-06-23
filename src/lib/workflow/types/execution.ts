import { WorkflowStatus, NodeStatus } from "./base";
import { NodeExecutionRecord } from "./node";

/**
 * Execution context passed to nodes and workflows
 */
export interface ExecutionContext {
  // Identifiers
  workflowId: string;
  executionId: string;
  userId?: string;
  organizationId?: string;
  
  // Execution info
  startedAt: Date;
  triggeredBy: string;
  triggerType: string;
  
  // Environment
  environment: ExecutionEnvironment;
  
  // State management
  state: ExecutionState;
  
  // Services
  services: ExecutionServices;
  
  // Configuration
  config: ExecutionConfig;
}

/**
 * Execution environment
 */
export interface ExecutionEnvironment {
  variables: Record<string, any>;
  secrets: Record<string, string>;
  features: Record<string, boolean>;
  limits: {
    maxExecutionTime: number;
    maxMemory: number;
    maxStateSize: number;
  };
}

/**
 * Execution state management
 */
export interface ExecutionState {
  // Global state
  global: Record<string, any>;
  
  // Node-specific state
  nodes: Record<string, NodeState>;
  
  // Workflow variables
  variables: Record<string, any>;
  
  // Execution history
  history: StateChange[];
}

/**
 * Node state
 */
export interface NodeState {
  status: NodeStatus;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  error?: any;
  metadata?: Record<string, any>;
  retries?: number;
}

/**
 * State change record
 */
export interface StateChange {
  timestamp: Date;
  type: "set" | "delete" | "update";
  path: string;
  previousValue?: any;
  newValue?: any;
  nodeId?: string;
}

/**
 * Execution services available to nodes
 */
export interface ExecutionServices {
  // Logging
  logger: Logger;
  
  // Events
  events: EventEmitter;
  
  // State management
  stateManager: StateManager;
  
  // Flow control
  flowControl: FlowControl;
  
  // Data store
  dataStore: DataStore;
  
  // Metrics
  metrics: MetricsCollector;
}

/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: any): void;
}

/**
 * Event emitter interface
 */
export interface EventEmitter {
  emit(event: string, data?: any): void;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
}

/**
 * State manager interface
 */
export interface StateManager {
  get(path: string): any;
  set(path: string, value: any): void;
  delete(path: string): void;
  update(path: string, updater: (value: any) => any): void;
  subscribe(path: string, callback: (value: any) => void): () => void;
}

/**
 * Flow control interface
 */
export interface FlowControl {
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  retry(nodeId: string): Promise<void>;
  skip(nodeId: string): Promise<void>;
  goto(nodeId: string): Promise<void>;
}

/**
 * Data store interface
 */
export interface DataStore {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

/**
 * Metrics collector interface
 */
export interface MetricsCollector {
  increment(metric: string, value?: number, tags?: Record<string, string>): void;
  gauge(metric: string, value: number, tags?: Record<string, string>): void;
  histogram(metric: string, value: number, tags?: Record<string, string>): void;
  timing(metric: string, duration: number, tags?: Record<string, string>): void;
}

/**
 * Execution configuration
 */
export interface ExecutionConfig {
  // Execution behavior
  continueOnError: boolean;
  parallelism: number;
  timeout: number;
  
  // State management
  persistState: boolean;
  stateStorageKey?: string;
  
  // Debugging
  debug: boolean;
  breakpoints?: string[]; // Node IDs to pause at
  
  // Resource limits
  maxRetries: number;
  maxLoopIterations: number;
  maxRecursionDepth: number;
}

/**
 * Execution result
 */
export interface ExecutionResult {
  executionId: string;
  status: WorkflowStatus;
  startedAt: Date;
  completedAt: Date;
  duration: number;
  
  // Results
  outputs?: Record<string, any>;
  error?: ExecutionError;
  
  // Execution details
  nodesExecuted: NodeExecutionRecord[];
  stateChanges: StateChange[];
  logs: LogEntry[];
  metrics: ExecutionMetrics;
}

/**
 * Execution error
 */
export interface ExecutionError {
  code: string;
  message: string;
  nodeId?: string;
  stack?: string;
  details?: Record<string, any>;
}

/**
 * Log entry
 */
export interface LogEntry {
  timestamp: Date;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  nodeId?: string;
  data?: any;
}

/**
 * Execution metrics
 */
export interface ExecutionMetrics {
  totalNodes: number;
  successfulNodes: number;
  failedNodes: number;
  skippedNodes: number;
  totalDuration: number;
  averageNodeDuration: number;
  memoryUsed: number;
  stateSize: number;
}