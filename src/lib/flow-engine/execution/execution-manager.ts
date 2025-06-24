import { 
  ExecutionContext, 
  ExecutionResult, 
  ExecutionOptions,
  ExecutionStrategy,
  ExecutionProgress
} from "./types";
import { ImmediateExecutionStrategy } from "./immediate-strategy";
import { QueuedExecutionStrategy } from "./queued-strategy";
import { ComplexityAnalyzer } from "./complexity-analyzer";
import { ExecutionPersistence } from "./persistence";

export class ExecutionManager {
  private static instance: ExecutionManager;
  private immediateStrategy: ExecutionStrategy;
  private queuedStrategy: ExecutionStrategy;

  private constructor() {
    this.immediateStrategy = new ImmediateExecutionStrategy();
    this.queuedStrategy = new QueuedExecutionStrategy();
  }

  static getInstance(): ExecutionManager {
    if (!ExecutionManager.instance) {
      ExecutionManager.instance = new ExecutionManager();
    }
    return ExecutionManager.instance;
  }

  async execute(
    workflow: any,
    context: ExecutionContext,
    options?: ExecutionOptions
  ): Promise<ExecutionResult> {
    const strategy = this.selectStrategy(workflow, options);
    return strategy.execute(workflow, context, options);
  }

  async getStatus(executionId: string): Promise<ExecutionResult> {
    // Check which strategy was used by looking at the execution record
    const execution = await ExecutionPersistence.getExecution(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    // If status is pending, it's likely queued
    if (execution.status === "pending") {
      return this.queuedStrategy.getStatus(executionId);
    }

    // Otherwise, try immediate first
    try {
      return this.immediateStrategy.getStatus(executionId);
    } catch {
      return this.queuedStrategy.getStatus(executionId);
    }
  }

  async cancel(executionId: string): Promise<void> {
    // Try both strategies
    try {
      await this.immediateStrategy.cancel(executionId);
    } catch {
      await this.queuedStrategy.cancel(executionId);
    }
  }

  async pause(executionId: string): Promise<void> {
    // Try both strategies
    try {
      await this.immediateStrategy.pause(executionId);
    } catch {
      await this.queuedStrategy.pause(executionId);
    }
  }

  async resume(executionId: string): Promise<void> {
    // Try both strategies
    try {
      await this.immediateStrategy.resume(executionId);
    } catch {
      await this.queuedStrategy.resume(executionId);
    }
  }

  async getProgress(executionId: string): Promise<ExecutionProgress> {
    // Try both strategies
    try {
      return await this.immediateStrategy.getProgress(executionId);
    } catch {
      return await this.queuedStrategy.getProgress(executionId);
    }
  }

  private selectStrategy(
    workflow: any,
    options?: ExecutionOptions
  ): ExecutionStrategy {
    // If mode is explicitly specified, use it
    if (options?.mode === "immediate") {
      return this.immediateStrategy;
    }
    if (options?.mode === "queued") {
      return this.queuedStrategy;
    }

    // Auto mode: analyze workflow complexity
    const complexity = ComplexityAnalyzer.analyze(workflow);
    
    // Decision logic
    if (ComplexityAnalyzer.shouldUseQueue(complexity)) {
      console.log(`Using queued execution for workflow ${workflow.id} based on complexity:`, complexity);
      return this.queuedStrategy;
    }

    console.log(`Using immediate execution for workflow ${workflow.id} based on complexity:`, complexity);
    return this.immediateStrategy;
  }

  getWorkflowComplexity(workflow: any) {
    return ComplexityAnalyzer.analyze(workflow);
  }
}