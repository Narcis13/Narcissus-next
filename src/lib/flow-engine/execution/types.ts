import { Workflow, NodeDefinition, WorkflowExecutionStatus } from "@/lib/workflow/types";

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  userId: number;
  startedAt: Date;
  input?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ExecutionResult {
  executionId: string;
  status: WorkflowExecutionStatus;
  output?: any;
  error?: string;
  completedAt?: Date;
  steps?: ExecutionStep[];
}

export interface ExecutionStep {
  nodeId: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startedAt?: Date;
  completedAt?: Date;
  input?: any;
  output?: any;
  error?: string;
}

export interface ExecutionProgress {
  executionId: string;
  status: WorkflowExecutionStatus;
  currentStep?: string;
  completedSteps: number;
  totalSteps: number;
  progress: number; // 0-100
  message?: string;
}

export interface WorkflowComplexity {
  nodeCount: number;
  hasExternalCalls: boolean;
  hasLoops: boolean;
  hasParallelExecution: boolean;
  estimatedDuration: number; // milliseconds
  requiresHumanInput: boolean;
}

export interface ExecutionOptions {
  mode?: "immediate" | "queued" | "auto";
  priority?: number;
  timeout?: number;
  maxRetries?: number;
  tags?: string[];
}

export interface ExecutionStrategy {
  execute(
    workflow: Workflow,
    context: ExecutionContext,
    options?: ExecutionOptions
  ): Promise<ExecutionResult>;
  
  getStatus(executionId: string): Promise<ExecutionResult>;
  
  cancel(executionId: string): Promise<void>;
  
  pause(executionId: string): Promise<void>;
  
  resume(executionId: string): Promise<void>;
  
  getProgress(executionId: string): Promise<ExecutionProgress>;
}

export interface FlowManagerContext {
  state: any;
  steps: any[];
  nodes: any[];
  self: any;
  input: any;
  flowInstanceId: string;
  humanInput: (details: any, customPauseId?: string) => Promise<any>;
  emit: (eventName: string, data: any) => void;
  on: (eventName: string, callback: (data: any) => void) => void;
}