// src/app/api/workflow/resume/route.ts
import { NextResponse } from 'next/server';
import { flowHub } from '@/lib/flow-engine/singletons';
import Redis from 'ioredis';
import { redisConnection } from '@/lib/redis/config';

// Create a Redis publisher for cross-process communication
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
    if (err.message && !err.message.includes('ECONNRESET')) {
      console.error('[Resume API] Redis pub client error:', err.message);
    }
  });
}

export async function POST(request: Request) {
    try {
        const { pauseId, resumeData } = await request.json();

        if (!pauseId) {
            return NextResponse.json(
                { message: 'pauseId is required.' },
                { status: 400 }
            );
        }
        
        // Debug: Check active pauses before resume
        const activePauses = flowHub.getActivePauses();
        console.log(`[Resume API] Active pauses before resume:`, activePauses);
        console.log(`[Resume API] Looking for pauseId: ${pauseId}`);
        
        // First try local resume (for immediate execution mode)
        const success = flowHub.resume(pauseId, resumeData);
        console.log(`[Resume API] Local resume result for ${pauseId}: ${success}`);

        if (!success && pubClient) {
            // If local resume failed, try publishing to Redis for queued execution
            console.log(`[Resume API] Local resume failed for ${pauseId}, publishing to Redis`);
            
            await pubClient.publish('flowhub:resume', JSON.stringify({
                pauseId,
                resumeData
            }));
            
            return NextResponse.json({ 
                success: true, 
                message: `Resume request sent for pauseId '${pauseId}'.` 
            });
        }

        if (!success) {
            return NextResponse.json({ 
                success: false, 
                message: `Flow with pauseId '${pauseId}' not found or already resumed. Active pauses: ${JSON.stringify(activePauses)}`
            });
        }

        return NextResponse.json({ 
            success: true, 
            message: `Flow resumed for pauseId '${pauseId}'.` 
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}