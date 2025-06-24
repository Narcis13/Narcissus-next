import { Worker, Job } from "bullmq";
import { FlowManager } from "@/lib/flow-engine/core/FlowManager.js";
import { nodeRegistry, flowHub } from "@/lib/flow-engine/singletons";
import { ExecutionPersistence } from "./persistence";
import { ExecutionStep } from "./types";
import { FlowExecutionJob } from "@/lib/redis/queues";
import redisConnection from "@/lib/redis/config";

export function createFlowExecutionWorker() {
  const worker = new Worker<FlowExecutionJob>(
    "flow-execution",
    async (job: Job<FlowExecutionJob>) => {
      const { flowData } = job.data;
      const { workflow, context, options } = flowData;
      const executionId = context.executionId;

      try {
        // Update job progress
        await job.updateProgress({ status: "initializing" });

        // Mark execution as running
        await ExecutionPersistence.markExecutionAsRunning(executionId);

        // Convert workflow to FlowManager format
        const nodes = convertWorkflowToFlowNodes(workflow);
        
        // Create FlowManager instance
        const fm = FlowManager({
          nodes,
          initialState: context.input || {},
          instanceId: executionId,
          scope: nodeRegistry.getScope(),
        });

        // Track steps
        const steps: ExecutionStep[] = [];
        let stepCount = 0;

        // Listen to flow events
        const cleanup = setupFlowEventListeners(executionId, async (step) => {
          steps.push(step);
          stepCount++;
          
          // Update job progress
          await job.updateProgress({
            status: "running",
            currentStep: step.nodeId,
            completedSteps: stepCount,
            totalSteps: workflow.nodes.length,
            progress: (stepCount / workflow.nodes.length) * 100,
          });

          // Save step to database
          await ExecutionPersistence.saveExecutionStep(executionId, step);
        });

        try {
          // Run the flow
          await job.updateProgress({ status: "executing" });
          const output = await fm.run();

          // Mark as completed
          await ExecutionPersistence.markExecutionAsCompleted(executionId, output);

          // Clean up event listeners
          cleanup();

          return {
            executionId,
            status: "completed",
            output,
            steps,
          };
        } catch (error: any) {
          // Clean up event listeners
          cleanup();

          // Mark as failed
          await ExecutionPersistence.markExecutionAsFailed(
            executionId,
            error.message || "Execution failed"
          );

          throw error;
        }
      } catch (error: any) {
        console.error(`Flow execution failed for ${executionId}:`, error);
        
        // Re-throw to mark job as failed
        throw new Error(error.message || "Flow execution failed");
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
      autorun: true,
    }
  );

  // Handle worker events
  worker.on("completed", (job) => {
    console.log(`Flow execution completed: ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Flow execution failed: ${job?.id}`, err);
  });

  worker.on("progress", (job, progress) => {
    console.log(`Flow execution progress: ${job.id}`, progress);
  });

  return worker;
}

function convertWorkflowToFlowNodes(workflow: any): any[] {
  const nodes: any[] = [];
  
  for (const node of workflow.nodes) {
    const flowNode = {
      id: node.id,
      type: node.nodeId,
      inputs: node.inputs,
      config: node.config,
    };
    
    nodes.push(flowNode);
  }

  return nodes;
}

function setupFlowEventListeners(
  executionId: string,
  onStep: (step: ExecutionStep) => Promise<void>
): () => void {
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

    await onStep(step);
  };

  flowHub.on("flowManagerStep", handleStep);

  // Return cleanup function
  return () => {
    flowHub.off("flowManagerStep", handleStep);
  };
}

// Start worker if running in Node.js environment
if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
  let worker: Worker | null = null;

  // Function to start the worker
  export const startWorker = () => {
    if (!worker) {
      worker = createFlowExecutionWorker();
      console.log("Flow execution worker started");
    }
    return worker;
  };

  // Function to stop the worker
  export const stopWorker = async () => {
    if (worker) {
      await worker.close();
      worker = null;
      console.log("Flow execution worker stopped");
    }
  };
}