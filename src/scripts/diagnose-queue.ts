import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Redis from 'ioredis';
import { Queue } from 'bullmq';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

async function diagnoseQueue() {
  console.log('🔍 Queue Diagnostics');
  console.log('==================\n');

  // 1. Check Redis URL
  console.log('1. Checking Redis configuration...');
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('❌ REDIS_URL environment variable is not set!');
    console.log('   Please set REDIS_URL in your .env.local file');
    return;
  }
  console.log('✅ REDIS_URL is configured');
  console.log(`   URL: ${redisUrl.substring(0, 30)}...`);

  // 2. Test Redis connection
  console.log('\n2. Testing Redis connection...');
  let redis: Redis | null = null;
  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      tls: {},
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    await new Promise<void>((resolve, reject) => {
      redis!.on('connect', () => {
        console.log('✅ Successfully connected to Redis');
        resolve();
      });
      redis!.on('error', (err) => {
        console.error('❌ Redis connection error:', err.message);
        reject(err);
      });
      
      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    // Test basic operations
    await redis.ping();
    console.log('✅ Redis PING successful');

  } catch (error: any) {
    console.error('❌ Failed to connect to Redis:', error.message);
    return;
  }

  // 3. Check BullMQ queue
  console.log('\n3. Checking BullMQ queue...');
  try {
    const queue = new Queue('flow-execution', {
      connection: redis!,
    });

    // Get queue metrics
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused(),
    ]);

    console.log('✅ Queue metrics:');
    console.log(`   - Waiting jobs: ${waiting}`);
    console.log(`   - Active jobs: ${active}`);
    console.log(`   - Completed jobs: ${completed}`);
    console.log(`   - Failed jobs: ${failed}`);
    console.log(`   - Delayed jobs: ${delayed}`);
    console.log(`   - Queue paused: ${paused}`);

    // Get recent jobs
    const jobs = await queue.getJobs(['waiting', 'active', 'completed', 'failed'], 0, 5);
    if (jobs.length > 0) {
      console.log('\n   Recent jobs:');
      for (const job of jobs) {
        const state = await job.getState();
        console.log(`   - Job ${job.id}: ${state} (created: ${new Date(job.timestamp).toLocaleString()})`);
      }
    }

    await queue.close();
  } catch (error: any) {
    console.error('❌ Failed to check queue:', error.message);
  }

  // 4. Test job creation
  console.log('\n4. Testing job creation...');
  try {
    const queue = new Queue('flow-execution', {
      connection: redis!,
    });

    const testJob = await queue.add('test-job', {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'This is a diagnostic test job',
    });

    console.log(`✅ Successfully created test job with ID: ${testJob.id}`);
    
    // Check job state
    const state = await testJob.getState();
    console.log(`   Job state: ${state}`);

    // Remove test job
    await testJob.remove();
    console.log('   Test job removed');

    await queue.close();
  } catch (error: any) {
    console.error('❌ Failed to create test job:', error.message);
  }

  // 5. Check worker status
  console.log('\n5. Worker status...');
  console.log('   Note: Workers must be started separately');
  console.log('   - In development: Worker auto-starts with `npm run dev`');
  console.log('   - In production: Run `npm run worker` in a separate process');
  console.log('   - Or use `npm run start-worker` for standalone testing');

  // Close Redis connection
  if (redis) {
    await redis.quit();
  }

  console.log('\n==================');
  console.log('Diagnostics complete!\n');

  // Recommendations
  console.log('📋 Recommendations:');
  console.log('1. Ensure REDIS_URL points to a valid Upstash Redis instance');
  console.log('2. Make sure the worker process is running');
  console.log('3. Check the worker logs for any errors');
  console.log('4. Verify workflow JSON structure matches FlowManager format');
  console.log('5. Use the test-execution-modes page to debug further');
}

// Run diagnostics
diagnoseQueue().catch(console.error);