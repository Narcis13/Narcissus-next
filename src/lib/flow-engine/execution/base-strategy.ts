import { FlowManager } from "@/lib/flow-engine/core/FlowManager.js";
import { nodeRegistry } from "@/lib/flow-engine/singletons";
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

    // Set up real-time event listeners for FlowHub
    // This is important for human-in-the-loop and real-time monitoring
    if (onStep && typeof window === 'undefined') {
      try {
        // Dynamically import flowHub only on server
        const { flowHub } = require("@/lib/flow-engine/singletons");
        if (typeof flowHub?.on === 'function') {
          // Listen for step events
          const stepHandler = (data: any) => {
            if (data.flowInstanceId === context.executionId) {
              console.log('[BaseStrategy] FlowHub step event for execution:', context.executionId, data);
              
              const stepData = data.stepData || {};
              const nodeInfo = stepData.node || {};
              
              // Extract node ID from the node object
              let nodeId = "unknown";
              if (typeof nodeInfo === 'string') {
                nodeId = nodeInfo;
              } else if (nodeInfo.id) {
                nodeId = nodeInfo.id;
              } else if (nodeInfo.type) {
                nodeId = nodeInfo.type;
              } else if (nodeInfo.implementation) {
                nodeId = nodeInfo.implementation;
              }
              
              const step: ExecutionStep = {
                nodeId: nodeId,
                status: "completed",
                startedAt: new Date(),
                completedAt: new Date(),
                input: stepData.input || data.currentState,
                output: stepData.output,
              };
              
              onStep(step);
            }
          };
          
          // Listen for pause events (human-in-the-loop)
          const pauseHandler = (data: any) => {
            if (data.flowInstanceId === context.executionId) {
              console.log('[BaseStrategy] FlowHub pause event for execution:', context.executionId, data);
              // Handle pause event - could update execution status
            }
          };
          
          // Listen for resume events
          const resumeHandler = (data: any) => {
            if (data.flowInstanceId === context.executionId) {
              console.log('[BaseStrategy] FlowHub resume event for execution:', context.executionId, data);
              // Handle resume event
            }
          };
          
          flowHub.on("flowManagerStep", stepHandler);
          flowHub.on("flowPaused", pauseHandler);
          flowHub.on("flowResumed", resumeHandler);
          
          console.log('[BaseStrategy] Registered FlowHub listeners for execution:', context.executionId);
          
          // Store handlers for cleanup
          (fm as any)._eventHandlers = {
            step: stepHandler,
            pause: pauseHandler,
            resume: resumeHandler,
            flowHub: flowHub
          };
        }
      } catch (error) {
        console.warn("FlowHub not available in this environment:", error);
      }
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
      
      // Get steps after execution
      let steps: ExecutionStep[] = [];
      if (fm.getSteps && typeof fm.getSteps === 'function') {
        const fmSteps = fm.getSteps();
        console.log('[BaseStrategy] Retrieved steps from FlowManager:', fmSteps);
        
        // Convert FlowManager steps to ExecutionStep format
        steps = fmSteps.map((step: any, index: number) => {
          let nodeId = `step-${index}`;
          
          // Extract node ID from various possible structures
          if (typeof step.node === 'string') {
            nodeId = step.node;
          } else if (step.node?.id) {
            nodeId = step.node.id;
          } else if (step.node?.type) {
            nodeId = step.node.type;
          } else if (step.node?.implementation) {
            nodeId = step.node.implementation;
          }
          
          return {
            nodeId,
            status: "completed" as const,
            startedAt: new Date(),
            completedAt: new Date(),
            input: step.input,
            output: step.output,
          };
        });
      }
      
      // Save result with steps
      const result = {
        executionId,
        status: "completed" as const,
        output,
        completedAt: new Date(),
        steps,
      };
      
      // Save execution result with steps
      await ExecutionPersistence.saveExecutionResult(result);
      
      return result;
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