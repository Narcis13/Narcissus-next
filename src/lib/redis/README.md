# Redis Queue Service

This module provides BullMQ integration with Upstash Redis for managing workflow execution queues.

## Configuration

Make sure you have the following environment variables set in `.env.local`:

```
REDIS_URL=redis://default:<your-token>@<your-instance>.upstash.io:6379
```

## Usage

### Queue Service

```typescript
import { QueueService } from "@/lib/services/queue-service";

// Add a flow execution job
const job = await QueueService.addFlowExecution({
  flowId: "flow-123",
  userId: 1,
  flowData: flowObject,
  triggerData: { /* trigger data */ }
});

// Check job status
const status = await QueueService.getJobStatus(job.jobId);

// Get queue metrics
const metrics = await QueueService.getQueueMetrics();
```

### Worker Implementation

```typescript
import { createFlowExecutionWorker } from "@/lib/redis/queues";

const worker = createFlowExecutionWorker(async (job) => {
  const { flowId, userId, flowData, executionId } = job.data;
  
  // Update progress
  await job.updateProgress(50);
  
  // Process the flow
  // ... your flow execution logic here
  
  return { success: true, executionId };
});
```

### Event Listening

```typescript
QueueService.listenToEvents({
  onCompleted: (jobId, result) => {
    console.log(`Job ${jobId} completed:`, result);
  },
  onFailed: (jobId, error) => {
    console.error(`Job ${jobId} failed:`, error);
  },
  onProgress: (jobId, progress) => {
    console.log(`Job ${jobId} progress:`, progress);
  }
});
```

## API Endpoints

- `GET /api/queue/status` - Get current queue metrics and status

## Testing

Run the test script:

```bash
npx tsx src/lib/redis/test-connection.ts
```