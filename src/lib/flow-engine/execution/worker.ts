import { Worker, Job } from "bullmq";
import { FlowManager } from "@/lib/flow-engine/core/FlowManager.js";
import { nodeRegistry, flowHub } from "@/lib/flow-engine/singletons";
import { ExecutionPersistence } from "./persistence";
import { ExecutionStep } from "./types";
import { FlowExecutionJob } from "@/lib/redis/queues";
import redisConnection from "@/lib/redis/config";
import Redis from "ioredis";
import { ExecutionCache } from "./redis-cache";

// Create a separate Redis connection for pub/sub with proper configuration
const pubClient = redisConnection && process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  tls: {},
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
}) : null;

// Handle pub client errors gracefully
if (pubClient) {
  pubClient.on('error', (err) => {
    // Only log meaningful errors, not connection resets
    if (err.message && !err.message.includes('ECONNRESET')) {
      console.error('[Worker] Redis pub client error:', err.message);
    }
  });
  
  pubClient.on('connect', () => {
    console.log('[Worker] Redis pub client connected');
  });
}

// Use a global symbol to prevent multiple Redis subscribers
const GlobalSubscriber = Symbol.for('nextjs.flow.subscriber');

interface GlobalSub {
  [GlobalSubscriber]: Redis | null;
}

// Only create subscriber once globally
let subClient = (global as unknown as GlobalSub)[GlobalSubscriber];

if (!subClient && redisConnection && process.env.REDIS_URL) {
  subClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    tls: {},
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (err) => {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  });
  
  // Store subscriber globally
  (global as unknown as GlobalSub)[GlobalSubscriber] = subClient;

  // Set up resume event listener
  subClient.on('error', (err) => {
    if (err.message && !err.message.includes('ECONNRESET')) {
      console.error('[Worker] Redis sub client error:', err.message);
    }
  });
  
  subClient.on('ready', () => {
    subClient!.subscribe('flowhub:resume', (err) => {
      if (err) {
        console.error('[Worker] Failed to subscribe to flowhub:resume:', err);
      } else {
        console.log('[Worker] Subscribed to flowhub:resume channel');
      }
    });
  });
  
  subClient.on('message', (channel, message) => {
    if (channel === 'flowhub:resume') {
      try {
        const { pauseId, resumeData } = JSON.parse(message);
        console.log(`[Worker] Received resume request for pauseId: ${pauseId}`);
        
        // Resume the workflow using the local flowHub instance
        const success = flowHub.resume(pauseId, resumeData);
        
        if (success) {
          console.log(`[Worker] Successfully resumed workflow with pauseId: ${pauseId}`);
        } else {
          console.log(`[Worker] Failed to resume workflow with pauseId: ${pauseId} - not found in this worker`);
        }
      } catch (error) {
        console.error('[Worker] Failed to process resume message:', error);
      }
    }
  });
}

export function createFlowExecutionWorker() {
  if (!redisConnection) {
    throw new Error("Cannot create worker without Redis connection");
  }
  
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
        await ExecutionCache.update(executionId, { status: "running" });

        // Convert workflow to FlowManager format
        const nodes = convertWorkflowToFlowNodes(workflow);
        
        // Get the base scope from node registry
        const baseScope = nodeRegistry.getScope();
        
        // Add simple utility functions to scope
        try {
          const simpleFunctions = require('@/lib/flow-engine/utils/simple-functions.js').default;
          Object.assign(baseScope, simpleFunctions);
        } catch (error) {
          console.warn('[Worker] Could not load simple functions:', error);
        }
        
        // Create FlowManager instance
        const fm = FlowManager({
          nodes,
          initialState: context.input || {},
          instanceId: executionId,
          scope: baseScope,
        });

        // Track steps
        const steps: ExecutionStep[] = [];
        let stepCount = 0;

        // Emit flow start event via Redis pub/sub
        if (pubClient) {
          await pubClient.publish('flowhub:events', JSON.stringify({
            type: 'flowStart',
            payload: {
              flowInstanceId: executionId,
              timestamp: new Date().toISOString(),
            }
          }));
        }

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
          
          // Emit step event via Redis pub/sub
          if (pubClient) {
            await pubClient.publish('flowhub:events', JSON.stringify({
              type: 'flowManagerStep',
              payload: {
                flowInstanceId: executionId,
                nodeId: step.nodeId,
                timestamp: new Date().toISOString(),
                stepData: {
                  node: { id: step.nodeId },
                  input: step.input,
                  output: step.output,
                }
              }
            }));
          }
        });

        try {
          // Run the flow
          await job.updateProgress({ status: "executing" });
          const output = await fm.run();

          // Get steps from FlowManager if available
          if (fm.getSteps && typeof fm.getSteps === 'function') {
            const fmSteps = fm.getSteps();
            steps.length = 0; // Clear array
            fmSteps.forEach((step: any, index: number) => {
              let nodeId = `step-${index}`;
              if (typeof step.node === 'string') {
                nodeId = step.node;
              } else if (step.node?.id) {
                nodeId = step.node.id;
              } else if (step.node?.type) {
                nodeId = step.node.type;
              }
              
              steps.push({
                nodeId,
                status: "completed" as const,
                startedAt: new Date(),
                completedAt: new Date(),
                input: step.input,
                output: step.output,
              });
            });
          }

          // Save execution result with steps
          const result = {
            executionId,
            status: "completed" as const,
            output,
            completedAt: new Date(),
            steps,
          };
          
          await ExecutionPersistence.saveExecutionResult(result);
          await ExecutionCache.set(executionId, result);

          // Ensure the execution status is saved
          console.log(`[Worker] Execution ${executionId} completed and saved`);

          // Emit flow end event via Redis pub/sub
          if (pubClient) {
            await pubClient.publish('flowhub:events', JSON.stringify({
              type: 'flowEnd',
              payload: {
                flowInstanceId: executionId,
                timestamp: new Date().toISOString(),
                output,
              }
            }));
          }

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

function setupFlowEventListeners(
  executionId: string,
  onStep: (step: ExecutionStep) => Promise<void>
): () => void {
  const handleStep = async (data: any) => {
    if (data.flowInstanceId !== executionId) return;

    const stepData = data.stepData || {};
    const nodeInfo = stepData.node || {};
    
    // Extract node ID from various possible structures
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

    await onStep(step);
  };

  const handlePause = async (data: any) => {
    if (data.flowInstanceId !== executionId) return;
    
    // Emit pause event via Redis pub/sub
    if (pubClient) {
      await pubClient.publish('flowhub:events', JSON.stringify({
        type: 'flowPaused',
        payload: data
      }));
    }
  };
  
  const handleResume = async (data: any) => {
    if (data.flowInstanceId !== executionId) return;
    
    // Emit resume event via Redis pub/sub
    if (pubClient) {
      await pubClient.publish('flowhub:events', JSON.stringify({
        type: 'flowResumed',
        payload: data
      }));
    }
  };

  flowHub.addEventListener("flowManagerStep", handleStep);
  flowHub.addEventListener("flowPaused", handlePause);
  flowHub.addEventListener("flowResumed", handleResume);

  // Return cleanup function
  return () => {
    flowHub.removeEventListener("flowManagerStep", handleStep);
    flowHub.removeEventListener("flowPaused", handlePause);
    flowHub.removeEventListener("flowResumed", handleResume);
  };
}

// Use a global symbol to prevent multiple worker instances
const GlobalWorker = Symbol.for('nextjs.flow.worker');

interface Global {
  [GlobalWorker]: Worker | null;
}

// Function to start the worker
export const startWorker = () => {
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
    // Check if worker already exists globally
    const existingWorker = (global as unknown as Global)[GlobalWorker];
    if (existingWorker) {
      console.log("Flow execution worker already running (reusing existing instance)");
      return existingWorker;
    }
    
    if (redisConnection) {
      try {
        const worker = createFlowExecutionWorker();
        // Store worker globally to prevent multiple instances
        (global as unknown as Global)[GlobalWorker] = worker;
        console.log("Flow execution worker started");
        return worker;
      } catch (error) {
        console.error("Failed to start flow execution worker:", error);
      }
    } else {
      console.warn("Redis connection not available, worker not started");
    }
  }
  return null;
};

// Function to stop the worker
export const stopWorker = async () => {
  const worker = (global as unknown as Global)[GlobalWorker];
  if (worker) {
    await worker.close();
    (global as unknown as Global)[GlobalWorker] = null;
    console.log("Flow execution worker stopped");
  }
};