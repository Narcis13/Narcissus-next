import { flowExecutionQueue, queueEvents, FlowExecutionJob } from "../redis/queues";

export class QueueService {
  static async addFlowExecution(job: FlowExecutionJob) {
    if (!flowExecutionQueue) {
      throw new Error("Queue not available - Redis connection required");
    }

    const queueJob = await flowExecutionQueue.add(
      `flow-${job.flowId}-${job.executionId}`,
      job,
      {
        priority: 1,
      }
    );

    return {
      jobId: queueJob.id,
      executionId: job.executionId,
    };
  }

  static async getJobStatus(jobId: string) {
    if (!flowExecutionQueue) {
      throw new Error("Queue not available - Redis connection required");
    }
    
    const job = await flowExecutionQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress;

    return {
      id: job.id,
      state,
      progress,
      data: job.data,
      failedReason: job.failedReason,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
    };
  }

  static async pauseQueue() {
    await flowExecutionQueue.pause();
  }

  static async resumeQueue() {
    await flowExecutionQueue.resume();
  }

  static async cleanQueue() {
    await flowExecutionQueue.obliterate({ force: true });
  }

  static async getQueueMetrics() {
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      flowExecutionQueue.getWaitingCount(),
      flowExecutionQueue.getActiveCount(),
      flowExecutionQueue.getCompletedCount(),
      flowExecutionQueue.getFailedCount(),
      flowExecutionQueue.getDelayedCount(),
      flowExecutionQueue.isPaused(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
    };
  }

  static listenToEvents(callbacks: {
    onCompleted?: (jobId: string, result: any) => void;
    onFailed?: (jobId: string, error: Error) => void;
    onProgress?: (jobId: string, progress: number | object) => void;
  }) {
    if (callbacks.onCompleted) {
      queueEvents.on("completed", ({ jobId, returnvalue }) => {
        callbacks.onCompleted!(jobId, returnvalue);
      });
    }

    if (callbacks.onFailed) {
      queueEvents.on("failed", ({ jobId, failedReason }) => {
        callbacks.onFailed!(jobId, new Error(failedReason));
      });
    }

    if (callbacks.onProgress) {
      queueEvents.on("progress", ({ jobId, data }) => {
        callbacks.onProgress!(jobId, data);
      });
    }

    return () => {
      queueEvents.removeAllListeners();
    };
  }
}