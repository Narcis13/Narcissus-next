import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createFlowExecutionWorker } from '../lib/flow-engine/execution/worker.js';
import redisConnection from '../lib/redis/config.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

async function testWorker() {
  console.log('🔧 Testing Queue Worker');
  console.log('=====================\n');

  if (!redisConnection) {
    console.error('❌ Redis connection not available. Check REDIS_URL environment variable.');
    process.exit(1);
  }

  console.log('✅ Redis connection available');
  console.log('Starting worker...\n');

  try {
    const worker = createFlowExecutionWorker();
    
    if (!worker) {
      console.error('❌ Failed to create worker');
      process.exit(1);
    }

    console.log('✅ Worker created successfully');
    console.log('Worker is now listening for jobs...');
    console.log('Press Ctrl+C to stop\n');

    // Log worker events
    worker.on('completed', (job) => {
      console.log(`✅ Job completed: ${job.id}`);
      console.log(`   Result:`, job.returnvalue);
    });

    worker.on('failed', (job, err) => {
      console.error(`❌ Job failed: ${job?.id}`);
      console.error(`   Error:`, err.message);
    });

    worker.on('active', (job) => {
      console.log(`🚀 Job started: ${job.id}`);
      console.log(`   Data:`, job.data);
    });

    worker.on('progress', (job, progress) => {
      console.log(`📊 Job progress: ${job.id}`);
      console.log(`   Progress:`, progress);
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\nShutting down worker...');
      await worker.close();
      await redisConnection?.quit();
      console.log('Worker stopped');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n\nShutting down worker...');
      await worker.close();
      await redisConnection?.quit();
      console.log('Worker stopped');
      process.exit(0);
    });

  } catch (error: any) {
    console.error('❌ Error starting worker:', error.message);
    process.exit(1);
  }
}

// Start the test worker
testWorker();