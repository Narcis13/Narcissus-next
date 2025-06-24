/** @type {import('../../types/flow-types.jsdoc.js').NodeDefinition} */
export default {
    id: "logic.condition.if",
    version: "1.0.0",
    name: "Conditional Branch",
    description: "Evaluates a condition and branches execution based on the result. Supports various comparison operators.",
    categories: ["Logic", "Control Flow"],
    tags: ["if", "condition", "branch", "compare", "decision"],
    inputs: [
        { 
            name: "value", 
            type: "any", 
            description: "The value to evaluate", 
            required: true, 
            example: 10 
        },
        { 
            name: "operator", 
            type: "string", 
            description: "Comparison operator", 
            required: true, 
            example: ">",
            enum: ["==", "!=", ">", "<", ">=", "<=", "contains", "startsWith", "endsWith", "isEmpty", "isNotEmpty"]
        },
        { 
            name: "compareValue", 
            type: "any", 
            description: "Value to compare against (not needed for isEmpty/isNotEmpty)", 
            required: false, 
            example: 5 
        }
    ],
    outputs: [
        { 
            name: "result", 
            type: "boolean", 
            description: "Result of the condition evaluation" 
        },
        { 
            name: "value", 
            type: "any", 
            description: "The original value passed through" 
        }
    ],
    edges: [
        { 
            name: "true", 
            description: "Branch taken when condition evaluates to true", 
            outputType: "object" 
        },
        { 
            name: "false", 
            description: "Branch taken when condition evaluates to false", 
            outputType: "object" 
        }
    ],
    implementation: async function(params) {
        const { value, operator, compareValue } = params;
        let result = false;
        
        try {
            switch (operator) {
                case '==':
                    result = value == compareValue;
                    break;
                case '!=':
                    result = value != compareValue;
                    break;
                case '>':
                    result = value > compareValue;
                    break;
                case '<':
                    result = value < compareValue;
                    break;
                case '>=':
                    result = value >= compareValue;
                    break;
                case '<=':
                    result = value <= compareValue;
                    break;
                case 'contains':
                    result = String(value).includes(String(compareValue));
                    break;
                case 'startsWith':
                    result = String(value).startsWith(String(compareValue));
                    break;
                case 'endsWith':
                    result = String(value).endsWith(String(compareValue));
                    break;
                case 'isEmpty':
                    result = value === null || value === undefined || value === '' || 
                            (Array.isArray(value) && value.length === 0) ||
                            (typeof value === 'object' && Object.keys(value).length === 0);
                    break;
                case 'isNotEmpty':
                    result = !(value === null || value === undefined || value === '' || 
                              (Array.isArray(value) && value.length === 0) ||
                              (typeof value === 'object' && Object.keys(value).length === 0));
                    break;
                default:
                    throw new Error(`Unknown operator: ${operator}`);
            }
            
            // Store the result in state for potential later use
            this.state.set('lastConditionResult', result);
            
            // Return edge functions that provide the evaluation result
            return {
                true: () => ({ result: true, value }),
                false: () => ({ result: false, value })
            };
            
        } catch (error) {
            // In case of error, return false branch with error details
            return {
                false: () => ({ 
                    result: false, 
                    value, 
                    error: error.message 
                })
            };
        }
    },
    aiPromptHints: {
        toolName: "conditional_branch",
        summary: "Evaluates conditions and directs workflow based on true/false results",
        useCase: "Use for decision-making in workflows, like 'if temperature > 30 then cooling_on else cooling_off'",
        expectedInputFormat: "Provide 'value' (any type), 'operator' (==, !=, >, <, etc.), and 'compareValue' (except for isEmpty/isNotEmpty)",
        outputDescription: "Branches to 'true' or 'false' edge based on condition result. Both edges return the result and original value.",
        examples: [
            "Check if temperature > 30",
            "Verify if status == 'completed'",
            "Test if message contains 'error'",
            "Check if array isEmpty",
            "Branch based on user.role != 'admin'"
        ]
    }
};