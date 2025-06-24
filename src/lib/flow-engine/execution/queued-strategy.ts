import { 
  ExecutionContext, 
  ExecutionResult, 
  ExecutionOptions 
} from "./types";
import { BaseExecutionStrategy } from "./base-strategy";
import { ExecutionPersistence } from "./persistence";
import { QueueService } from "@/lib/services/queue-service";
import { flowHub } from "@/lib/flow-engine/singletons";

export class QueuedExecutionStrategy extends BaseExecutionStrategy {
  async execute(
    workflow: any,
    context: ExecutionContext,
    options?: ExecutionOptions
  ): Promise<ExecutionResult> {
    // Create execution record
    const execution = await ExecutionPersistence.createExecution({
      workflowId: workflow.id,
      status: "pending",
      executionMode: "queued",
      metadata: context.metadata,
    });

    const executionId = execution.id;
    context.executionId = executionId;

    try {
      // Add job to queue
      const { jobId } = await QueueService.addFlowExecution({
        flowId: workflow.id,
        userId: context.userId,
        flowData: {
          workflow,
          context,
          options,
        },
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
  }

  async getStatus(executionId: string): Promise<ExecutionResult> {
    const execution = await ExecutionPersistence.getExecution(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    // Check queue job status if still active
    const active = this.activeExecutions.get(executionId);
    if (active?.jobId) {
      const jobStatus = await QueueService.getJobStatus(active.jobId);
      if (jobStatus) {
        // Map queue state to execution status
        let status = execution.status;
        if (jobStatus.state === "completed") status = "completed";
        else if (jobStatus.state === "failed") status = "failed";
        else if (jobStatus.state === "active") status = "running";
        
        if (status !== execution.status) {
          await ExecutionPersistence.updateExecution(executionId, { status });
        }
      }
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