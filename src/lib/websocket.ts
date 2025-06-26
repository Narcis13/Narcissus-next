// src/lib/websocket.ts
import { WebSocketServer, WebSocket } from 'ws';
import { globalEventEmitter } from './flow-engine/singletons';
import Redis from 'ioredis';
import { redisConnection } from './redis/config';

// Use a global symbol to store the WSS instance.
// This prevents hot-reloading from creating multiple instances in development.
const GlobalWSS = Symbol.for('nextjs.wss');

interface Global {
  [GlobalWSS]: WebSocketServer;
}

export const setupWebSocket = () => {
  if (process.env.NODE_ENV === 'development' && (global as unknown as Global)[GlobalWSS]) {
    console.log('[WebSocket] Server already running in dev mode.');
    return;
  }
  
  console.log('[WebSocket] Server initializing...');

  try {
    const wss = new WebSocketServer({ port: 8089 });
  
  console.log('[WebSocket] WebSocketServer created, setting up event listeners...');

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] Client connected.');
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to workflow WebSocket server'
    }));
    
    ws.on('close', () => console.log('[WebSocket] Client disconnected.'));
    ws.on('error', console.error);
  });

  const broadcast = (data: object) => {
    const message = JSON.stringify(data);
   // console.log('[WebSocket] Broadcasting message:', data);
    wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  //console.log('[WebSocket] Setting up global event listeners...');

  // Listen to global event emitter for cross-context events
  globalEventEmitter.on('flowPaused', (eventData: any) => {
  //  console.log('[WebSocket] Global flowPaused event received:', eventData);
    broadcast({ type: 'flowPaused', payload: eventData });
  });

  globalEventEmitter.on('flowResumed', (eventData: any) => {
   // console.log('[WebSocket] Global flowResumed event received:', eventData);
    broadcast({ type: 'flowResumed', payload: eventData });
  });

  globalEventEmitter.on('flowManagerStep', (eventData: any) => {
  //  console.log('[WebSocket] Global flowManagerStep event received:', eventData);
    broadcast({ type: 'flowStep', payload: eventData });
  });

  globalEventEmitter.on('flowManagerStart', (eventData: any) => {
  // console.log('[WebSocket] Global flowManagerStart event received:', eventData);
    broadcast({ type: 'flowStart', payload: eventData });
  });

  globalEventEmitter.on('flowManagerEnd', (eventData: any) => {
  //  console.log('[WebSocket] Global flowManagerEnd event received:', eventData);
    broadcast({ type: 'flowEnd', payload: eventData });
  });

  globalEventEmitter.on('flowManagerNodeEvent', (eventData: any) => {
  //  console.log('[WebSocket] Global flowManagerNodeEvent event received:', eventData);
    broadcast({ type: 'customNodeEvent', payload: eventData });
  });

  // Set up Redis pub/sub for queued execution events
  if (redisConnection && process.env.REDIS_URL) {
    console.log('[WebSocket] Setting up Redis pub/sub for queued execution events...');
    
    // Create a dedicated subscriber connection
    const subscriber = new Redis(process.env.REDIS_URL);
    
    subscriber.subscribe('flowhub:events', (err) => {
      if (err) {
        console.error('[WebSocket] Failed to subscribe to Redis channel:', err);
      } else {
        console.log('[WebSocket] Subscribed to flowhub:events channel');
      }
    });
    
    subscriber.on('message', (channel, message) => {
      if (channel === 'flowhub:events') {
        try {
          const event = JSON.parse(message);
          console.log('[WebSocket] Received Redis pub/sub event:', event.type);
          
          // Forward the event to all connected WebSocket clients
          broadcast(event);
          
          // Also emit to globalEventEmitter for local listeners
          if (event.type && event.payload) {
            globalEventEmitter.emit(event.type, event.payload);
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse Redis message:', error);
        }
      }
    });
    
    subscriber.on('error', (err) => {
      console.error('[WebSocket] Redis subscriber error:', err);
    });
  }

 // console.log('[WebSocket] Global event listeners attached for broadcasting.');

  if (process.env.NODE_ENV === 'development') {
    (global as unknown as Global)[GlobalWSS] = wss;
  }
  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
      console.log('[WebSocket] Port 8089 already in use, skipping initialization.');
    } else {
      console.error('[WebSocket] Failed to initialize:', error);
    }
  }
};