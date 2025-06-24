/** @type {import('../../types/flow-types.jsdoc.js').NodeDefinition} */
export default {
    id: "logic.control.delay",
    version: "1.0.0",
    name: "Delay Execution",
    description: "Pauses workflow execution for a specified duration. Useful for rate limiting, timing operations, or creating delays between actions.",
    categories: ["Logic", "Control Flow", "Utilities"],
    tags: ["delay", "wait", "pause", "sleep", "timeout", "timer"],
    inputs: [
        { 
            name: "duration", 
            type: "number", 
            description: "Delay duration in milliseconds", 
            required: true, 
            example: 1000,
            validation: {
                min: 0,
                max: 300000 // 5 minutes max
            }
        },
        { 
            name: "passThrough", 
            type: "any", 
            description: "Optional data to pass through after the delay", 
            required: false, 
            example: { "status": "waiting" }
        }
    ],
    outputs: [
        { 
            name: "duration", 
            type: "number", 
            description: "The actual duration waited in milliseconds" 
        },
        { 
            name: "passThrough", 
            type: "any", 
            description: "The data passed through unchanged" 
        }
    ],
    edges: [
        { 
            name: "completed", 
            description: "Execution continues after the delay", 
            outputType: "object" 
        }
    ],
    implementation: async function(params) {
        const duration = Math.max(0, Math.min(params.duration || 0, 300000)); // Clamp between 0 and 5 minutes
        const passThrough = params.passThrough;
        const startTime = Date.now();
        
        // Log the delay start
        if (this.flowInstanceId) {
            console.log(`[Flow ${this.flowInstanceId}] Starting delay for ${duration}ms`);
        }
        
        // Store delay info in state
        this.state.set('lastDelay', {
            startTime,
            duration,
            status: 'waiting'
        });
        
        // Perform the actual delay
        await new Promise(resolve => setTimeout(resolve, duration));
        
        const actualDuration = Date.now() - startTime;
        
        // Update state with completion
        this.state.set('lastDelay', {
            startTime,
            duration,
            actualDuration,
            status: 'completed'
        });
        
        // Log the delay completion
        if (this.flowInstanceId) {
            console.log(`[Flow ${this.flowInstanceId}] Delay completed after ${actualDuration}ms`);
        }
        
        // Return the result through the completed edge
        return {
            completed: () => ({
                duration: actualDuration,
                passThrough
            })
        };
    },
    aiPromptHints: {
        toolName: "delay_execution",
        summary: "Pauses the workflow for a specified time duration",
        useCase: "Use when you need to wait between operations, implement rate limiting, or create timed sequences",
        expectedInputFormat: "Provide 'duration' in milliseconds (0-300000). Optionally include 'passThrough' data.",
        outputDescription: "Returns via 'completed' edge with actual duration waited and any passThrough data",
        examples: [
            "Wait 1 second between API calls",
            "Delay 5000ms before retrying",
            "Pause for 2 seconds to allow processing",
            "Rate limit requests with 500ms delays"
        ]
    }
};