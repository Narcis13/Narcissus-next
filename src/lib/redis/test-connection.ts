import { config } from "dotenv";
import path from "path";

config({ path: path.join(process.cwd(), ".env.local") });

import redisConnection from "./config";
import { QueueService } from "../services/queue-service";
import { createFlowExecutionWorker } from "./queues";

async function testRedisConnection() {
  console.log("Testing Redis connection...");

  try {
    if (!redisConnection) {
      throw new Error("Redis connection is not configured");
    }
    
    await redisConnection.ping();
    console.log("✅ Redis connection successful!");

    console.log("\nTesting BullMQ queue...");
    
    const testJob = await QueueService.addFlowExecution({
      flowId: "test-flow",
      userId: 1,
      flowData: {
        name: "Test Flow",
        nodes: [],
        edges: [],
      },
      triggerData: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    });

    console.log("✅ Job added to queue:", testJob);

    const metrics = await QueueService.getQueueMetrics();
    console.log("\n📊 Queue metrics:", metrics);

    const jobStatus = await QueueService.getJobStatus(testJob.jobId!);
    console.log("\n📋 Job status:", jobStatus);

    const worker = createFlowExecutionWorker(async (job) => {
      console.log(`\n🔧 Processing job ${job.id}...`);
      console.log("Job data:", job.data);
      
      await job.updateProgress(50);
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      await job.updateProgress(100);
      
      return {
        success: true,
        processedAt: new Date().toISOString(),
        executionId: job.data.executionId,
      };
    });

    QueueService.listenToEvents({
      onCompleted: (jobId, result) => {
        console.log(`\n✅ Job ${jobId} completed:`, result);
      },
      onFailed: (jobId, error) => {
        console.error(`\n❌ Job ${jobId} failed:`, error);
      },
      onProgress: (jobId, progress) => {
        console.log(`\n📈 Job ${jobId} progress:`, progress);
      },
    });

    console.log("\n⏳ Waiting for job processing...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await worker.close();
    await redisConnection.quit();
    
    console.log("\n✅ All tests completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  testRedisConnection();
}