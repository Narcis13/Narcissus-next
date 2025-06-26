# FlowHub Real-time Events Documentation

## Overview

FlowHub events work seamlessly in both **immediate** and **queued** execution modes, providing real-time updates for workflow monitoring and human-in-the-loop functionality.

## Architecture

### Immediate Mode (Default)
- Workflows execute synchronously in the Next.js server process
- FlowHub events are emitted directly to the `globalEventEmitter`
- WebSocket server listens to these events and broadcasts to connected clients
- Events flow: FlowManager → FlowHub → globalEventEmitter → WebSocket → Client

### Queued Mode (Redis/Upstash)
- Workflows execute asynchronously in a separate worker process
- Worker publishes FlowHub events to Redis pub/sub channel `flowhub:events`
- WebSocket server subscribes to this Redis channel
- Events are forwarded to both connected clients and local listeners
- Events flow: FlowManager → FlowHub → Redis Pub/Sub → WebSocket → Client

## Implementation Details

### 1. Worker Enhancement (`/src/lib/flow-engine/execution/worker.ts`)
The queue worker now:
- Creates a Redis pub/sub client
- Publishes `flowStart`, `flowManagerStep`, and `flowEnd` events to Redis
- Maintains FlowHub event listeners for `flowPaused` and `flowResumed`
- Retrieves steps from FlowManager after execution completes

### 2. WebSocket Server Enhancement (`/src/lib/websocket.ts`)
The WebSocket server now:
- Creates a Redis subscriber when `REDIS_URL` is available
- Subscribes to the `flowhub:events` channel
- Forwards received events to all connected WebSocket clients
- Also emits events to `globalEventEmitter` for local listeners

### 3. Event Types
All events maintain the same structure regardless of execution mode:

```typescript
{
  type: 'flowStart' | 'flowManagerStep' | 'flowEnd' | 'flowPaused' | 'flowResumed',
  payload: {
    flowInstanceId: string,
    timestamp: string,
    // Additional event-specific data
  }
}
```

## Testing

### Test Page (`/src/app/test-execution-modes/page.tsx`)
A dedicated test page allows you to:
1. Choose between immediate and queued execution modes
2. Execute a test workflow
3. Monitor real-time FlowHub events from both modes
4. Verify that events are properly delivered

### Running Tests
1. Ensure Redis/Upstash is configured (`REDIS_URL` in `.env.local`)
2. Start the development server: `npm run dev`
3. In development, the worker starts automatically
4. Navigate to `/test-execution-modes`
5. Test both execution modes and verify events appear

### Production Setup
For production, run the worker separately:
```bash
npm run worker
```

## Benefits

1. **Unified Event System**: Same event structure and handling for both execution modes
2. **Scalability**: Queued mode allows distributed execution across multiple workers
3. **Reliability**: Redis pub/sub ensures events are delivered even across process boundaries
4. **Human-in-the-Loop Ready**: Pause/resume events work in both modes
5. **Real-time Monitoring**: Live execution updates regardless of where workflows run

## Future Enhancements

1. **Event Persistence**: Store events in database for historical analysis
2. **Event Filtering**: Allow clients to subscribe to specific event types
3. **Metrics**: Track event delivery latency and reliability
4. **Clustering**: Support multiple WebSocket servers with Redis-based coordination