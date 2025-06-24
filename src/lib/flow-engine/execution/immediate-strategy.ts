import { Workflow } from "@/lib/workflow/types";
import { 
  ExecutionContext, 
  ExecutionResult, 
  ExecutionOptions,
  ExecutionStep 
} from "./types";
import { BaseExecutionStrategy } from "./base-strategy";
import { ExecutionPersistence } from "./persistence";

export class ImmediateExecutionStrategy extends BaseExecutionStrategy {
  private executionTimeouts = new Map<string, NodeJS.Timeout>();

  async execute(
    workflow: Workflow,
    context: ExecutionContext,
    options?: ExecutionOptions
  ): Promise<ExecutionResult> {
    // Create execution record
    const execution = await ExecutionPersistence.createExecution({
      workflowId: workflow.id,
      status: "running",
      executionMode: "immediate",
      metadata: context.metadata,
    });

    const executionId = execution.id;
    context.executionId = executionId;

    try {
      // Set timeout if specified
      if (options?.timeout) {
        const timeoutId = setTimeout(async () => {
          await this.handleTimeout(executionId);
        }, options.timeout);
        this.executionTimeouts.set(executionId, timeoutId);
      }

      // Track execution steps
      const steps: ExecutionStep[] = [];
      
      // Create FlowManager with step tracking
      const fm = this.createFlowManager(workflow, context, async (step) => {
        steps.push(step);
        await ExecutionPersistence.saveExecutionStep(executionId, step);
      });

      // Store active execution
      this.activeExecutions.set(executionId, { fm, workflow, context });

      // Execute synchronously
      const result = await this.handleFlowExecution(fm, executionId);
      result.steps = steps;

      // Clear timeout if exists
      const timeoutId = this.executionTimeouts.get(executionId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.executionTimeouts.delete(executionId);
      }

      // Clean up
      this.activeExecutions.delete(executionId);

      return result;
    } catch (error: any) {
      // Clear timeout if exists
      const timeoutId = this.executionTimeouts.get(executionId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.executionTimeouts.delete(executionId);
      }

      // Clean up
      this.activeExecutions.delete(executionId);

      await ExecutionPersistence.markExecutionAsFailed(
        executionId,
        error.message || "Execution failed"
      );

      return {
        executionId,
        status: "failed",
        error: error.message || "Execution failed",
        completedAt: new Date(),
      };
    }
  }

  async getStatus(executionId: string): Promise<ExecutionResult> {
    const execution = await ExecutionPersistence.getExecution(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    return {
      executionId: execution.id,
      status: execution.status,
      output: execution.result?.output,
      error: execution.error || undefined,
      completedAt: execution.completedAt || undefined,
      steps: execution.result?.steps || [],
    };
  }

  async cancel(executionId: string): Promise<void> {
    const active = this.activeExecutions.get(executionId);
    if (!active) {
      throw new Error(`No active execution found for ${executionId}`);
    }

    // Clear timeout if exists
    const timeoutId = this.executionTimeouts.get(executionId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.executionTimeouts.delete(executionId);
    }

    // Stop the FlowManager execution
    if (active.fm && typeof active.fm.stop === "function") {
      active.fm.stop();
    }

    await ExecutionPersistence.markExecutionAsCancelled(executionId);
    this.activeExecutions.delete(executionId);
  }

  async pause(executionId: string): Promise<void> {
    const active = this.activeExecutions.get(executionId);
    if (!active) {
      throw new Error(`No active execution found for ${executionId}`);
    }

    // Pause the FlowManager
    if (active.fm && typeof active.fm.pause === "function") {
      active.fm.pause();
    }
  }

  async resume(executionId: string): Promise<void> {
    const active = this.activeExecutions.get(executionId);
    if (!active) {
      throw new Error(`No active execution found for ${executionId}`);
    }

    // Resume the FlowManager
    if (active.fm && typeof active.fm.resume === "function") {
      active.fm.resume();
    }
  }

  private async handleTimeout(executionId: string): Promise<void> {
    try {
      await this.cancel(executionId);
      await ExecutionPersistence.updateExecution(executionId, {
        status: "failed",
        error: "Execution timeout",
        completedAt: new Date(),
      });
    } catch (error) {
      console.error(`Failed to handle timeout for execution ${executionId}:`, error);
    }
  }
}