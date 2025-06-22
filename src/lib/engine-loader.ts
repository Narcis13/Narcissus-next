// src/lib/engine-loader.ts
// This module's purpose is to trigger the flow engine initialization and WebSocket server.
// It should only be imported for its side effects, once, in the root layout.

import { initializeFlowEngine } from '@/lib/flow-engine/init';
import { setupWebSocket } from './websocket';

// Use a global flag to prevent multiple initializations
const GlobalInit = Symbol.for('nextjs.engine.initialized');

interface Global {
  [GlobalInit]: boolean;
}

// Only initialize once
if (typeof window === 'undefined' && !(global as unknown as Global)[GlobalInit]) {
  // The top-level await here is fine in modern bundlers.
  // This promise is created and executed only when this module is first imported.
  initializeFlowEngine();
  
  // Start WebSocket server alongside the flow engine
  setupWebSocket();
  
  // Mark as initialized
  (global as unknown as Global)[GlobalInit] = true;
}