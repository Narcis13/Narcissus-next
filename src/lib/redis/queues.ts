import { Queue, Worker, QueueEvents } from "bullmq";
import redisConnection from "./config";

if (!redisConnection) {
  throw new Error("Redis connection is not available. Please configure REDIS_URL.");
}

const queueOptions = {
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
};

export const flowExecutionQueue = new Queue("flow-execution", queueOptions);

export const queueEvents = new QueueEvents("flow-execution", {
  connection: redisConnection,
});

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
  return new Worker("flow-execution", processor, {
    connection: redisConnection,
    concurrency: 5,
    autorun: true,
  });
};