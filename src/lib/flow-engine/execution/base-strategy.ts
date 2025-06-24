import { FlowManager } from "@/lib/flow-engine/core/FlowManager.js";
import { nodeRegistry, flowHub } from "@/lib/flow-engine/singletons";
import { 
  ExecutionContext, 
  ExecutionResult, 
  ExecutionStep,
  ExecutionProgress,
  ExecutionStrategy,
  ExecutionOptions 
} from "./types";
import { ExecutionPersistence } from "./persistence";

export abstract class BaseExecutionStrategy implements ExecutionStrategy {
  protected activeExecutions = new Map<string, any>();

  abstract execute(
    workflow: any,
    context: ExecutionContext,
    options?: ExecutionOptions
  ): Promise<ExecutionResult>;

  abstract getStatus(executionId: string): Promise<ExecutionResult>;
  
  abstract cancel(executionId: string): Promise<void>;
  
  abstract pause(executionId: string): Promise<void>;
  
  abstract resume(executionId: string): Promise<void>;

  async getProgress(executionId: string): Promise<ExecutionProgress> {
    const execution = await ExecutionPersistence.getExecution(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const steps = (execution.result?.steps || []) as ExecutionStep[];
    const completedSteps = steps.filter(s => s.status === "completed").length;
    const totalSteps = steps.length;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return {
      executionId,
      status: execution.status,
      currentStep: steps.find(s => s.status === "running")?.nodeId,
      completedSteps,
      totalSteps,
      progress,
      message: execution.error || undefined,
    };
  }

  protected createFlowManager(
    workflow: any,
    context: ExecutionContext,
    onStep?: (step: ExecutionStep) => void
  ) {
    // Convert workflow to FlowManager nodes format
    const nodes = this.convertWorkflowToFlowNodes(workflow);
    
    const fm = FlowManager({
      nodes,
      initialState: workflow.initialState || context.input || {},
      instanceId: context.executionId,
      scope: nodeRegistry.getScope(),
      initialInput: context.input
    });

    // Listen to flow events
    if (onStep) {
      flowHub.on("flowManagerStep", (data: any) => {
        if (data.flowInstanceId === context.executionId) {
          const step: ExecutionStep = {
            nodeId: data.nodeId || "unknown",
            status: "completed",
            startedAt: new Date(data.timestamp),
            completedAt: new Date(),
            input: data.input,
            output: data.output,
          };
          onStep(step);
        }
      });
    }

    return fm;
  }

  protected convertWorkflowToFlowNodes(workflow: any): any[] {
    // If workflow already has FlowManager-compatible nodes array, use it directly
    if (workflow.nodes && Array.isArray(workflow.nodes)) {
      // Check if it's already in FlowManager format
      const firstNode = workflow.nodes[0];
      if (typeof firstNode === 'string' || 
          (typeof firstNode === 'object' && !firstNode.id && !firstNode.nodeId) ||
          Array.isArray(firstNode)) {
        // Already in FlowManager format
        return workflow.nodes;
      }
      
      // Otherwise, try to convert from old format
      // This is for backward compatibility only
      const nodes: any[] = [];
      for (const node of workflow.nodes) {
        if (node.nodeId && node.inputs) {
          // Convert old format to parameterized node
          nodes.push({ [node.nodeId]: node.inputs });
        } else if (node.nodeId) {
          // Simple node reference
          nodes.push(node.nodeId);
        }
      }
      return nodes;
    }
    
    // Fallback to empty array
    return [];
  }

  protected async handleFlowExecution(
    fm: any,
    executionId: string
  ): Promise<ExecutionResult> {
    try {
      // Mark as running
      await ExecutionPersistence.markExecutionAsRunning(executionId);
      
      // Run the flow
      const output = await fm.run();
      
      // Mark as completed
      await ExecutionPersistence.markExecutionAsCompleted(executionId, output);
      
      return {
        executionId,
        status: "completed",
        output,
        completedAt: new Date(),
      };
    } catch (error: any) {
      // Mark as failed
      await ExecutionPersistence.markExecutionAsFailed(
        executionId,
        error.message || "Unknown error"
      );
      
      return {
        executionId,
        status: "failed",
        error: error.message || "Unknown error",
        completedAt: new Date(),
      };
    }
  }

  protected setupFlowEventListeners(
    executionId: string,
    onProgress?: (progress: ExecutionProgress) => void
  ) {
    const handleStep = async (data: any) => {
      if (data.flowInstanceId !== executionId) return;

      const step: ExecutionStep = {
        nodeId: data.nodeId || "unknown",
        status: "completed",
        startedAt: new Date(data.timestamp),
        completedAt: new Date(),
        input: data.input,
        output: data.output,
      };

      await ExecutionPersistence.saveExecutionStep(executionId, step);

      if (onProgress) {
        const progress = await this.getProgress(executionId);
        onProgress(progress);
      }
    };

    flowHub.on("flowManagerStep", handleStep);
    
    // Return cleanup function
    return () => {
      flowHub.off("flowManagerStep", handleStep);
    };
  }
}