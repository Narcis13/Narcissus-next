
const eventTriggerHandler = {
    async activate(triggerConfig, callback, triggerId, flowHub) {
        const { eventName = 'start_the_flow' } = triggerConfig;
        
        console.log(`[EVENT TriggerHandler:${triggerId}] Listening for event: ${eventName}`);
        
        // Create event listener
        const listener = (event) => {
            console.log(`[EVENT TriggerHandler:${triggerId}] Event '${eventName}' received:`, event);
            flowHub._emitEvent('trigger:handler:event', {
                triggerId,
                handlerType: 'event',
                message: `Event '${eventName}' detected`,
                eventData: event,
                timestamp: Date.now()
            });
            callback(event); // Pass the event data to the TriggerManager
        };
        
        // Add listener
        flowHub.addEventListener(eventName, listener);
        
        // Return listener reference for deactivation
        return { eventName, listener };
    },

    async deactivate(activationContext, triggerConfig, triggerId, flowHub) {
        if (activationContext && activationContext.listener) {
            flowHub.removeEventListener(activationContext.eventName, activationContext.listener);
            console.log(`[EVENT TriggerHandler:${triggerId}] Stopped listening for event: ${activationContext.eventName}`);
            
            flowHub._emitEvent('trigger:handler:event', {
                triggerId,
                handlerType: 'event',
                message: `Stopped listening for '${activationContext.eventName}'`,
                timestamp: Date.now()
            });
        }
    }
};

export default eventTriggerHandler;