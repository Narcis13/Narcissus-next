// src/lib/engine-loader.ts
// This module's purpose is to trigger the flow engine initialization and WebSocket server.
// It should only be imported for its side effects, once, in the root layout.

import { initializeFlowEngine } from '@/lib/flow-engine/init';
import { setupWebSocket } from './websocket';
import { startWorker } from '@/lib/flow-engine/execution/worker';

// Use a global flag to prevent multiple initializations
const GlobalInit = Symbol.for('nextjs.engine.initialized');

interface Global {
  [GlobalInit]: boolean;
}

// Only initialize once
if (typeof window === 'undefined' && !(global as unknown as Global)[GlobalInit]) {
  console.log('[Engine Loader] Initializing flow engine and WebSocket...');
  
  // The top-level await here is fine in modern bundlers.
  // This promise is created and executed only when this module is first imported.
  initializeFlowEngine();
  
  // Start WebSocket server alongside the flow engine
  // Wrap in try-catch to prevent initialization failures from breaking the app
  try {
    setupWebSocket();
  } catch (error) {
    console.error('[Engine Loader] Failed to setup WebSocket:', error);
  }
  
  // Start queue worker in development mode if Redis is available
  if (process.env.REDIS_URL && process.env.NODE_ENV === 'development') {
    try {
      startWorker();
      console.log('[Engine Loader] Queue worker started in development mode');
    } catch (error) {
      console.error('[Engine Loader] Failed to start queue worker:', error);
    }
  }
  
  // Mark as initialized
  (global as unknown as Global)[GlobalInit] = true;
  console.log('[Engine Loader] Initialization complete');
}