/**
 * @typedef {import('../../types/flow-types.jsdoc.js').TriggerHandlerCallback} TriggerHandlerCallback
 * @typedef {typeof import('../../core/FlowHub.js').default} FlowHubType
 */

/**
 * Time-based Trigger Handler for scheduled workflows.
 * Supports cron-like scheduling and interval-based execution.
 * @type {import('../../types/flow-types.jsdoc.js').TriggerTypeHandler}
 */
const timeTriggerHandler = {
    /**
     * @param {object} triggerConfig - Config for this time trigger.
     * @param {number} [triggerConfig.intervalMs] - Interval in milliseconds for periodic execution.
     * @param {string} [triggerConfig.cronPattern] - Cron pattern for scheduled execution (simplified).
     * @param {Date} [triggerConfig.runAt] - Specific date/time to run once.
     * @param {number} [triggerConfig.maxRuns] - Maximum number of times to run (for interval triggers).
     * @param {TriggerHandlerCallback} callback - Function to call when the trigger fires.
     * @param {string} triggerId - The ID of the trigger being activated.
     * @param {FlowHubType} flowHub - Instance of FlowHub for emitting events.
     * @returns {Promise<{intervalId?: number, timeoutId?: number, runCount: number}>} Returns context for deactivation.
     */
    async activate(triggerConfig, callback, triggerId, flowHub) {
        const { intervalMs, cronPattern, runAt, maxRuns } = triggerConfig;
        let runCount = 0;
        const context = { runCount };

        console.log(`[TimeTriggerHandler:${triggerId}] Activating with config:`, triggerConfig);

        // One-time scheduled execution
        if (runAt) {
            const delay = new Date(runAt).getTime() - Date.now();
            if (delay > 0) {
                context.timeoutId = setTimeout(() => {
                    console.log(`[TimeTriggerHandler:${triggerId}] Scheduled time reached`);
                    flowHub._emitEvent('trigger:handler:event', {
                        triggerId,
                        handlerType: 'time',
                        message: 'Scheduled time reached',
                        timestamp: Date.now()
                    });
                    callback({ 
                        triggerType: 'scheduled',
                        scheduledTime: runAt,
                        executedAt: new Date().toISOString()
                    });
                }, delay);
            } else {
                console.warn(`[TimeTriggerHandler:${triggerId}] Scheduled time is in the past`);
            }
        }

        // Interval-based execution
        else if (intervalMs) {
            const executeInterval = () => {
                runCount++;
                context.runCount = runCount;

                const shouldContinue = !maxRuns || runCount <= maxRuns;
                
                if (shouldContinue) {
                    console.log(`[TimeTriggerHandler:${triggerId}] Interval fired (run ${runCount}${maxRuns ? `/${maxRuns}` : ''})`);
                    flowHub._emitEvent('trigger:handler:event', {
                        triggerId,
                        handlerType: 'time',
                        message: `Interval fired (run ${runCount})`,
                        runCount,
                        timestamp: Date.now()
                    });
                    callback({
                        triggerType: 'interval',
                        intervalMs,
                        runNumber: runCount,
                        timestamp: new Date().toISOString()
                    });
                }

                if (maxRuns && runCount >= maxRuns) {
                    clearInterval(context.intervalId);
                    console.log(`[TimeTriggerHandler:${triggerId}] Max runs (${maxRuns}) reached, stopping`);
                    flowHub._emitEvent('trigger:handler:event', {
                        triggerId,
                        handlerType: 'time',
                        message: 'Max runs reached',
                        finalRunCount: runCount,
                        timestamp: Date.now()
                    });
                }
            };

            context.intervalId = setInterval(executeInterval, intervalMs);
        }

        // Simple cron pattern support (for demonstration)
        else if (cronPattern) {
            // Simplified cron: "*/5 * * * *" means every 5 minutes
            const match = cronPattern.match(/^\*\/(\d+) \* \* \* \*$/);
            if (match) {
                const minutes = parseInt(match[1]);
                const intervalMs = minutes * 60 * 1000;
                
                context.intervalId = setInterval(() => {
                    runCount++;
                    context.runCount = runCount;
                    
                    console.log(`[TimeTriggerHandler:${triggerId}] Cron pattern fired (every ${minutes} minutes)`);
                    flowHub._emitEvent('trigger:handler:event', {
                        triggerId,
                        handlerType: 'time',
                        message: `Cron pattern fired`,
                        cronPattern,
                        timestamp: Date.now()
                    });
                    callback({
                        triggerType: 'cron',
                        cronPattern,
                        executedAt: new Date().toISOString()
                    });
                }, intervalMs);
            } else {
                console.error(`[TimeTriggerHandler:${triggerId}] Unsupported cron pattern: ${cronPattern}`);
            }
        }

        return context;
    },

    /**
     * @param {{intervalId?: number, timeoutId?: number, runCount: number}} activationContext - The context returned by activate.
     * @param {object} triggerConfig - The trigger's configuration.
     * @param {string} triggerId - The ID of the trigger being deactivated.
     * @param {FlowHubType} flowHub - Instance of FlowHub.
     * @returns {Promise<void>}
     */
    async deactivate(activationContext, triggerConfig, triggerId, flowHub) {
        if (activationContext) {
            if (activationContext.intervalId) {
                clearInterval(activationContext.intervalId);
                console.log(`[TimeTriggerHandler:${triggerId}] Deactivated interval timer`);
            }
            if (activationContext.timeoutId) {
                clearTimeout(activationContext.timeoutId);
                console.log(`[TimeTriggerHandler:${triggerId}] Deactivated scheduled timer`);
            }
            
            flowHub._emitEvent('trigger:handler:event', {
                triggerId,
                handlerType: 'time',
                message: 'Timer deactivated',
                finalRunCount: activationContext.runCount,
                timestamp: Date.now()
            });
        }
    }
};

export default timeTriggerHandler;