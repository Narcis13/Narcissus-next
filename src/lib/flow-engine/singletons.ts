import { NodeRegistry } from './core/NodeRegistry.js';
import { TriggerManager } from './core/TriggerManager.js';
import FlowHub from './core/FlowHub.js';
import { EventEmitter } from 'events';

// Global process-level event emitter for cross-context communication
declare global {
  var __flowEngineGlobalEmitter: EventEmitter | undefined;
  var __flowEngineNodeRegistry: any | undefined;
  var __flowEngineFlowHub: any | undefined;
  var __flowEngineTriggerManager: any | undefined;
}

// Initialize global event emitter
if (!global.__flowEngineGlobalEmitter) {
  global.__flowEngineGlobalEmitter = new EventEmitter();
  global.__flowEngineGlobalEmitter.setMaxListeners(0); // Unlimited listeners
  console.log('[Flow Engine] Global EventEmitter created');
}

// Initialize singletons
if (!global.__flowEngineNodeRegistry) {
  global.__flowEngineNodeRegistry = NodeRegistry;
  console.log('[Flow Engine] NodeRegistry singleton created');
}

if (!global.__flowEngineFlowHub) {
  global.__flowEngineFlowHub = FlowHub;
  console.log('[Flow Engine] FlowHub singleton created');
}

if (!global.__flowEngineTriggerManager) {
  global.__flowEngineTriggerManager = TriggerManager({ nodeRegistry: global.__flowEngineNodeRegistry });
  console.log('[Flow Engine] TriggerManager singleton created');
}

export const globalEventEmitter = global.__flowEngineGlobalEmitter;
export const nodeRegistry = global.__flowEngineNodeRegistry;
export const flowHub = global.__flowEngineFlowHub;
export const triggerManager = global.__flowEngineTriggerManager;

console.log('[Flow Engine] All singletons initialized.');