/**
 * FlowHub: A singleton manager for handling pause and resume operations
 * across all FlowManager instances. It allows workflows to request human intervention
 * and for an external UI layer (or any service) to respond and resume the flow.
 * This version uses a custom, environment-agnostic event bus and also handles
 * step events from FlowManager instances.
 */

// Store FlowHub state in global to persist across module reloads in development
if (typeof global !== 'undefined') {
    if (!global.__flowHubState) {
        global.__flowHubState = {
            pausedFlows: new Map(),
            listeners: {},
            pauseIdCounter: 0
        };
    }
}

const FlowHub = (function() {
    // Try to get globalEventEmitter if available
    let globalEventEmitter = null;
    try {
        // In Node.js environment
        if (typeof global !== 'undefined' && global.__flowEngineGlobalEmitter) {
            globalEventEmitter = global.__flowEngineGlobalEmitter;
        }
    } catch (e) {
        // Ignore errors in browser environment
    }
    
    // Use global state if available, otherwise create local state
    const state = (typeof global !== 'undefined' && global.__flowHubState) ? global.__flowHubState : {
        pausedFlows: new Map(),
        listeners: {},
        pauseIdCounter: 0
    };
    
    // _pausedFlows: Stores active pause states.
    // Key: pauseId (string)
    // Value: { resolve: Function (to resume the Promise), details: any, flowInstanceId: string }
    const _pausedFlows = state.pausedFlows;

    // _listeners: Stores event listeners for the custom event bus.
    // Key: eventName (string)
    // Value: Array of callback functions
    const _listeners = state.listeners;

    let _pauseIdCounter = state.pauseIdCounter; // Simple counter for generating unique parts of pause IDs.

    /**
     * Generates a unique ID for a pause request.
     * @param {string} [prefix='pause'] - A prefix for the ID, often related to the flow instance.
     * @returns {string} A unique pause ID.
     */
    function generatePauseId(prefix = 'pause') {
        _pauseIdCounter++;
        // Update global state if available
        if (typeof global !== 'undefined' && global.__flowHubState) {
            global.__flowHubState.pauseIdCounter = _pauseIdCounter;
        }
        return `${prefix}-${Date.now()}-${_pauseIdCounter}`;
    }

    return {
        /**
         * Emits an event to all registered listeners for that event type.
         * @param {string} eventName - The name of the event (e.g., 'flowPaused', 'flowManagerStep').
         * @param {object} eventData - The data to be passed to the listeners.
         */
        _emitEvent(eventName, eventData) {
            // Emit to local listeners
            if (_listeners[eventName]) {
                _listeners[eventName].forEach((callback, index) => {
                    try {
                        // Pass the eventData object directly to the callback
                        callback(eventData);
                    } catch (e) {
                        // Silently handle errors
                    }
                });
            }
            
            // Also emit to globalEventEmitter for cross-process communication
            if (globalEventEmitter) {
                try {
                    globalEventEmitter.emit(eventName, eventData);
                } catch (e) {
                    // Silently handle errors
                }
            }
        },

        /**
         * Adds an event listener for events.
         * @param {string} eventName - Event to listen for ('flowPaused', 'flowResumed', 'resumeFailed', 'flowManagerStep', 'flowManagerNodeEvent').
         * @param {Function} callback - The function to call when the event occurs. The callback will receive the eventData object.
         */
        addEventListener(eventName, callback) {
            if (typeof callback !== 'function') {
                return;
            }
            if (!_listeners[eventName]) {
                _listeners[eventName] = [];
            }
            _listeners[eventName].push(callback);
        },

        /**
         * Removes an event listener.
         * @param {string} eventName - The event name.
         * @param {Function} callback - The callback to remove.
         */
        removeEventListener(eventName, callback) {
            if (_listeners[eventName]) {
                _listeners[eventName] = _listeners[eventName].filter(cb => cb !== callback);
            }
        },

        /**
         * Called by a FlowManager node (via `this.humanInput`) to pause execution.
         * @param {object} options - Pause options.
         * @param {string} [options.pauseId] - A user-suggested ID for this pause. If not unique or provided, one is generated.
         * @param {any} [options.details] - Data/details about the pause, to be sent to the UI/service.
         * @param {string} options.flowInstanceId - The ID of the FlowManager instance initiating the pause.
         * @returns {Promise<any>} A promise that resolves with data when `resume()` is called for this pause.
         */
        requestPause({ pauseId: customPauseId, details, flowInstanceId }) {
            return new Promise((resolve) => {
                const pauseId = customPauseId && !_pausedFlows.has(customPauseId) ? customPauseId : generatePauseId(flowInstanceId || 'flow');

                if (_pausedFlows.has(pauseId)) {
                    console.log(`[FlowHub] Warning: pauseId ${pauseId} already exists, using generated ID`);
                }
                
                console.log(`[FlowHub] Creating pause with ID: ${pauseId} for flow: ${flowInstanceId}`);
                console.log(`[FlowHub] Current paused flows count: ${_pausedFlows.size}`);
                
                _pausedFlows.set(pauseId, { resolve, details, flowInstanceId });
                this._emitEvent('flowPaused', { pauseId, details, flowInstanceId });
            });
        },

        /**
         * Called by an external system (e.g., UI or another service) to resume a paused flow.
         * @param {string} pauseId - The ID of the pause to resume.
         * @param {any} resumeData - Data to be passed back to the awaiting `humanInput()` call in the flow.
         * @returns {boolean} True if resume was successful, false otherwise (e.g., pauseId not found).
         */
        resume(pauseId, resumeData) {
            if (_pausedFlows.has(pauseId)) {
                const { resolve, details, flowInstanceId } = _pausedFlows.get(pauseId);
                resolve(resumeData);
                _pausedFlows.delete(pauseId);
                this._emitEvent('flowResumed', { pauseId, resumeData, details, flowInstanceId });
                return true;
            } else {
                this._emitEvent('resumeFailed', { pauseId, reason: 'No active pause found' });
                return false;
            }
        },

        /**
         * Checks if a specific pause ID is currently active.
         * @param {string} pauseId - The pause ID to check.
         * @returns {boolean} True if the pauseId corresponds to an active pause.
         */
        isPaused(pauseId) {
            return _pausedFlows.has(pauseId);
        },

        /**
         * Gets details of all currently active pauses. Useful for a UI/service to display a list of pending actions.
         * @returns {Array<object>} An array of objects, each being { pauseId, details, flowInstanceId }.
         */
        getActivePauses() {
            const active = [];
            _pausedFlows.forEach(({ details, flowInstanceId }, pauseId) => {
                active.push({ pauseId, details, flowInstanceId });
            });
            return active;
        }
    };
})();

export default FlowHub;