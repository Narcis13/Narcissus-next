import { 
  ExecutionContext, 
  ExecutionResult, 
  ExecutionOptions,
  ExecutionStep 
} from "./types";
import { BaseExecutionStrategy } from "./base-strategy";
import { ExecutionPersistence } from "./persistence";
import { flowHub } from "@/lib/flow-engine/singletons";

export class ImmediateExecutionStrategy extends BaseExecutionStrategy {
  private executionTimeouts = new Map<string, NodeJS.Timeout>();
  
  private cleanupExecution(executionId: string, fm: any): void {
    // Clear timeout if exists
    const timeoutId = this.executionTimeouts.get(executionId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.executionTimeouts.delete(executionId);
    }

    // Clean up all event listeners
    if ((fm as any)._eventHandlers) {
      const { step, pause, resume, flowHub } = (fm as any)._eventHandlers;
      if (flowHub && typeof flowHub.off === 'function') {
        flowHub.off("flowManagerStep", step);
        flowHub.off("flowPaused", pause);
        flowHub.off("flowResumed", resume);
        console.log('[ImmediateStrategy] Cleaned up all FlowHub listeners');
      }
    }

    // Clean up active execution
    this.activeExecutions.delete(executionId);
  }

  async execute(
    workflow: any,
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
      
      console.log('[ImmediateStrategy] Starting execution for workflow:', workflow.id);
      console.log('[ImmediateStrategy] Workflow nodes:', workflow.nodes);
      
      // Create FlowManager with step tracking
      const fm = this.createFlowManager(workflow, context, async (step) => {
        console.log('[ImmediateStrategy] Saving execution step:', step);
        steps.push(step);
        try {
          await ExecutionPersistence.saveExecutionStep(executionId, step);
          console.log('[ImmediateStrategy] Step saved successfully');
        } catch (error) {
          console.error('[ImmediateStrategy] Failed to save step:', error);
        }
      });

      // Store active execution
      this.activeExecutions.set(executionId, { fm, workflow, context });

      // Execute synchronously - this will get steps from FlowManager
      const result = await this.handleFlowExecution(fm, executionId);
      
      // Log the result for debugging
      console.log('[ImmediateStrategy] Execution completed. Steps count:', result.steps?.length || 0);

      // Check if there are active pauses for this execution
      const activePauses = flowHub.getActivePauses();
      const hasPauses = activePauses.some((pause: any) => pause.flowInstanceId === executionId);
      
      if (hasPauses) {
        console.log(`[ImmediateStrategy] Execution ${executionId} has active pauses, keeping execution context`);
        // Don't clean up if there are active pauses - wait for resume
        // Update the execution status to indicate it's paused
        await ExecutionPersistence.updateExecution(executionId, {
          status: "paused",
          metadata: {
            ...context.metadata,
            activePauses: activePauses.filter((p: any) => p.flowInstanceId === executionId)
          }
        });
        
        // Set up a listener for when the workflow actually completes
        const endHandler = async (data: any) => {
          if (data.flowInstanceId === executionId) {
            console.log(`[ImmediateStrategy] Flow ended for ${executionId}, finalizing execution`);
            // Remove listeners
            flowHub.removeEventListener("flowEnd", endHandler);
            flowHub.removeEventListener("flowManagerEnd", endHandler);
            
            try {
              // Get the final result from FlowManager
              const steps = fm.getSteps ? fm.getSteps() : [];
              const stateManager = fm.getStateManager ? fm.getStateManager() : null;
              const finalState = stateManager ? stateManager.getState() : {};
              
              const finalResult = {
                executionId,
                status: "completed" as const,
                output: finalState,
                completedAt: new Date(),
                steps: steps
              };
              
              // Now clean up
              this.cleanupExecution(executionId, fm);
              
              // Update the stored result
              await ExecutionPersistence.saveExecutionResult(finalResult);
            } catch (error) {
              console.error(`[ImmediateStrategy] Error completing execution ${executionId}:`, error);
              this.cleanupExecution(executionId, fm);
            }
          }
        };
        
        // Listen for both possible end events
        flowHub.addEventListener("flowEnd", endHandler);
        flowHub.addEventListener("flowManagerEnd", endHandler);
        
        return {
          ...result,
          status: "paused" as const,
          metadata: {
            ...result.metadata,
            message: "Workflow paused, waiting for human input"
          }
        };
      }

      // No pauses, clean up normally
      this.cleanupExecution(executionId, fm);

      return result;
    } catch (error: any) {
      // Clean up using the helper method
      this.cleanupExecution(executionId, fm);

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