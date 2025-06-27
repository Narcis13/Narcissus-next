import { 
  ExecutionContext, 
  ExecutionResult, 
  ExecutionOptions 
} from "./types";
import { BaseExecutionStrategy } from "./base-strategy";
import { ExecutionPersistence } from "./persistence";
import { QueueService } from "@/lib/services/queue-service";
import { flowHub } from "@/lib/flow-engine/singletons";
import { ExecutionCache } from "./redis-cache";

export class QueuedExecutionStrategy extends BaseExecutionStrategy {
  async execute(
    workflow: any,
    context: ExecutionContext,
    options?: ExecutionOptions
  ): Promise<ExecutionResult> {
    console.log('[QueuedStrategy] Starting execution for workflow:', workflow.id);
    
    try {
      // Create execution record
      const execution = await ExecutionPersistence.createExecution({
        workflowId: workflow.id,
        status: "pending",
        executionMode: "queued",
        metadata: context.metadata,
      });

    const executionId = execution.id;
    context.executionId = executionId;
    
    console.log('[QueuedStrategy] Created execution with ID:', executionId);

    // Cache execution in Redis for cross-process access
    await ExecutionCache.set(executionId, {
      executionId,
      status: "pending",
      steps: [],
    });

    // Wait a moment to ensure the database write is visible
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Add job to queue
      const { jobId } = await QueueService.addFlowExecution({
        flowId: workflow.id,
        userId: context.userId,
        executionId: executionId,
        flowData: {
          workflow,
          context,
          options,
        },
        triggerData: context.metadata?.triggerData,
      });

      // Store job mapping
      this.activeExecutions.set(executionId, { jobId, workflow, context });

      // Return pending result
      return {
        executionId,
        status: "pending",
        steps: [],
      };
    } catch (error: any) {
      await ExecutionPersistence.markExecutionAsFailed(
        executionId,
        error.message || "Failed to queue execution"
      );

      return {
        executionId,
        status: "failed",
        error: error.message || "Failed to queue execution",
        completedAt: new Date(),
      };
    }
    } catch (error: any) {
      console.error('[QueuedStrategy] Failed to create execution:', error);
      return {
        executionId: "",
        status: "failed",
        error: error.message || "Failed to create execution record",
        completedAt: new Date(),
      };
    }
  }

  async getStatus(executionId: string): Promise<ExecutionResult> {
    // Check Redis cache first
    const cached = await ExecutionCache.get(executionId);
    if (cached) {
      console.log('[QueuedStrategy] Found execution in Redis cache');
      return cached as ExecutionResult;
    }

    // Always get fresh data from database
    const execution = await ExecutionPersistence.getExecution(executionId);
    if (!execution) {
      // Try one more time with a small delay
      await new Promise(resolve => setTimeout(resolve, 100));
      const retryExecution = await ExecutionPersistence.getExecution(executionId);
      if (!retryExecution) {
        throw new Error(`Execution ${executionId} not found`);
      }
      return {
        executionId: retryExecution.id,
        status: retryExecution.status,
        output: retryExecution.result?.output,
        error: retryExecution.error || undefined,
        completedAt: retryExecution.completedAt || undefined,
        steps: retryExecution.result?.steps || [],
      };
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
    if (!active?.jobId) {
      throw new Error(`No active job found for execution ${executionId}`);
    }

    // Cancel the queue job
    const job = await QueueService.getJobStatus(active.jobId);
    if (job && ["waiting", "active", "delayed"].includes(job.state)) {
      // Remove job from queue
      // Note: BullMQ doesn't have a direct cancel method, so we'll mark it as failed
      await ExecutionPersistence.markExecutionAsCancelled(executionId);
    }

    this.activeExecutions.delete(executionId);
  }

  async pause(executionId: string): Promise<void> {
    // Emit pause event via FlowHub
    flowHub._emitEvent("pauseFlow", { flowInstanceId: executionId });
  }

  async resume(executionId: string): Promise<void> {
    // Emit resume event via FlowHub
    flowHub._emitEvent("resumeFlow", { flowInstanceId: executionId });
  }
}