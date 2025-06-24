/** @type {import('../../types/flow-types.jsdoc.js').NodeDefinition} */
export default {
    id: "logic.control.loop",
    version: "1.0.0",
    name: "Loop Controller",
    description: "Controls loop iterations based on various conditions. Use as the controller in FlowManager loop structures [[controller, ...actions]].",
    categories: ["Logic", "Control Flow"],
    tags: ["loop", "iterate", "while", "for", "repeat", "controller"],
    inputs: [
        { 
            name: "mode", 
            type: "string", 
            description: "Loop mode: 'count' for fixed iterations, 'condition' for conditional loops, 'array' for iterating over arrays", 
            required: true, 
            example: "count",
            enum: ["count", "condition", "array"]
        },
        { 
            name: "maxIterations", 
            type: "number", 
            description: "Maximum number of iterations (for 'count' mode or as safety limit)", 
            required: false, 
            example: 10,
            defaultValue: 100
        },
        { 
            name: "currentIndex", 
            type: "number", 
            description: "Current iteration index (automatically managed, starts at 0)", 
            required: false, 
            defaultValue: 0
        },
        { 
            name: "condition", 
            type: "any", 
            description: "For 'condition' mode: continue while this is truthy", 
            required: false, 
            example: true
        },
        { 
            name: "array", 
            type: "array", 
            description: "For 'array' mode: array to iterate over", 
            required: false, 
            example: ["item1", "item2", "item3"]
        },
        { 
            name: "loopData", 
            type: "any", 
            description: "Data from the previous iteration", 
            required: false
        }
    ],
    outputs: [
        { 
            name: "index", 
            type: "number", 
            description: "Current iteration index" 
        },
        { 
            name: "item", 
            type: "any", 
            description: "Current item (for array mode)" 
        },
        { 
            name: "remaining", 
            type: "number", 
            description: "Remaining iterations (for count mode)" 
        },
        { 
            name: "loopData", 
            type: "any", 
            description: "Data to pass to next iteration" 
        }
    ],
    edges: [
        { 
            name: "continue", 
            description: "Continue to next iteration", 
            outputType: "object" 
        },
        { 
            name: "exit", 
            description: "Exit the loop", 
            outputType: "object" 
        }
    ],
    implementation: async function(params) {
        const mode = params.mode || 'count';
        const maxIterations = Math.max(1, Math.min(params.maxIterations || 100, 1000)); // Cap at 1000
        let currentIndex = params.currentIndex || 0;
        
        // Get or initialize loop state
        const loopStateKey = `loop_${this.self?.id || 'controller'}_state`;
        let loopState = this.state.get(loopStateKey) || {
            index: 0,
            startTime: Date.now(),
            mode: mode
        };
        
        // Use input to determine current index for proper loop continuation
        if (this.input && typeof this.input === 'object' && typeof this.input.index === 'number') {
            currentIndex = this.input.index + 1; // Increment for next iteration
            loopState.index = currentIndex;
        } else if (currentIndex === 0 && loopState.index > 0) {
            // Resume from saved state if available
            currentIndex = loopState.index;
        }
        
        // Update state
        loopState.index = currentIndex;
        this.state.set(loopStateKey, loopState);
        
        let shouldContinue = false;
        let outputData = {
            index: currentIndex,
            loopData: params.loopData || this.input?.loopData
        };
        
        switch (mode) {
            case 'count':
                const targetCount = Math.min(maxIterations, 1000);
                shouldContinue = currentIndex < targetCount;
                outputData.remaining = Math.max(0, targetCount - currentIndex - 1);
                
                if (this.flowInstanceId) {
                    console.log(`[Flow ${this.flowInstanceId}] Loop iteration ${currentIndex + 1}/${targetCount}`);
                }
                break;
                
            case 'condition':
                // Evaluate condition - could be boolean or any truthy value
                shouldContinue = !!params.condition && currentIndex < maxIterations;
                
                if (this.flowInstanceId) {
                    console.log(`[Flow ${this.flowInstanceId}] Loop condition: ${shouldContinue} (iteration ${currentIndex + 1})`);
                }
                break;
                
            case 'array':
                const array = params.array || [];
                shouldContinue = Array.isArray(array) && currentIndex < array.length && currentIndex < maxIterations;
                
                if (shouldContinue) {
                    outputData.item = array[currentIndex];
                    outputData.remaining = array.length - currentIndex - 1;
                }
                
                if (this.flowInstanceId) {
                    console.log(`[Flow ${this.flowInstanceId}] Array loop: item ${currentIndex + 1}/${array.length}`);
                }
                break;
                
            default:
                console.warn(`[Loop Controller] Unknown mode: ${mode}, defaulting to exit`);
                shouldContinue = false;
        }
        
        // Clear loop state when exiting
        if (!shouldContinue) {
            this.state.set(loopStateKey, null);
            
            if (this.flowInstanceId) {
                console.log(`[Flow ${this.flowInstanceId}] Loop completed after ${currentIndex} iterations`);
            }
        }
        
        // Return appropriate edge
        return shouldContinue ? 
            { continue: () => outputData } : 
            { exit: () => ({ ...outputData, completed: true }) };
    },
    aiPromptHints: {
        toolName: "loop_controller",
        summary: "Controls loop iterations in workflows for repeating actions",
        useCase: "Use as the first node in a FlowManager loop structure [[controller, actions...]] to control iterations",
        expectedInputFormat: "Set 'mode' to 'count', 'condition', or 'array'. Provide relevant parameters based on mode.",
        outputDescription: "Returns 'continue' edge to proceed with loop actions or 'exit' edge to break the loop",
        examples: [
            "Loop 5 times with mode='count' and maxIterations=5",
            "Loop while condition=true (conditional loop)",
            "Iterate over array=['a','b','c'] with mode='array'",
            "Process items in batches using loop controller"
        ]
    }
};