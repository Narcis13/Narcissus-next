// src/lib/flow-engine/init.ts

import { nodeRegistry, triggerManager } from './singletons';

// --- 1. Statically import all nodes and triggers from our index files ---
import allNodes from './nodes/index.js';
import allTriggers from './automations/index.js';

// --- 2. Statically import trigger handlers ---
import emailTriggerHandler from './triggers/types/emailTriggerHandler.js';
import eventTriggerHandler from './triggers/types/eventTriggerHandler.js';

let isInitialized = false;

export const initializeFlowEngine = async () => {
    // This check ensures the logic runs only once per server instance.
    if (isInitialized) {
        return;
    }

    console.log('[Flow Engine] Initializing...');

    // --- 1. Register all Nodes ---
    for (const nodeModule of allNodes) {
        if (nodeModule) {
            nodeRegistry.register(nodeModule);
        }
    }
    console.log(`[Flow Engine] Registered ${nodeRegistry.getAll().length} nodes.`);

    // --- 2. Register Trigger Handlers ---
    triggerManager.addTriggerTypeHandler('email', emailTriggerHandler);
    triggerManager.addTriggerTypeHandler('event', eventTriggerHandler);
    console.log('[Flow Engine] Registered trigger handlers.');

    // --- 3. Register and Activate Triggers ---
    for (const triggerModule of allTriggers) {
        if (triggerModule) {
            triggerManager.register(triggerModule);
            // Automatically activate registered triggers on startup
            // Note: You might want to control this more granularly later.
          //  await triggerManager.activate(triggerModule.triggerId);
        }
    }
    console.log(`[Flow Engine] Registered and activated ${triggerManager.getActiveTriggerIds().length} triggers.`);

    console.log('[Flow Engine] Initialization complete.');
    isInitialized = true;
};