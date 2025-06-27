import { Queue, Worker, QueueEvents } from "bullmq";
import redisConnection from "./config";

// Only create queues if Redis is available
const queueOptions = redisConnection ? {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600,
      count: 100,
    },
    removeOnFail: {
      age: 24 * 3600,
      count: 100,
    },
  },
} : null;

export const flowExecutionQueue = redisConnection && queueOptions ? new Queue("flow-execution", queueOptions) : null;

export const queueEvents = redisConnection ? new QueueEvents("flow-execution", {
  connection: redisConnection,
}) : null;

export interface FlowExecutionJob {
  flowId: string;
  userId: number;
  executionId: string;
  flowData: any;
  triggerData?: any;
}

export const createFlowExecutionWorker = (
  processor: (job: any) => Promise<any>
) => {
  if (!redisConnection) {
    console.warn("Redis connection not available, worker creation skipped");
    return null;
  }
  
  return new Worker("flow-execution", processor, {
    connection: redisConnection,
    concurrency: 5,
    autorun: true,
  });
};