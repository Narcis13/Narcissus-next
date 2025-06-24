/** @type {import('../../types/flow-types.jsdoc.js').NodeDefinition} */
export default {
    id: "data.transform.mapper",
    version: "1.0.0",
    name: "Data Transform",
    description: "Transforms data using JavaScript expressions or simple mappings. Supports object property extraction, array operations, and basic transformations.",
    categories: ["Data", "Transform"],
    tags: ["transform", "map", "extract", "modify", "data", "mapper"],
    inputs: [
        { 
            name: "data", 
            type: "any", 
            description: "Input data to transform", 
            required: true, 
            example: { "user": { "name": "John", "age": 30 }, "items": [1, 2, 3] }
        },
        { 
            name: "operation", 
            type: "string", 
            description: "Transform operation type", 
            required: true, 
            example: "extract",
            enum: ["extract", "map", "filter", "reduce", "custom"]
        },
        { 
            name: "config", 
            type: "object", 
            description: "Configuration for the transform operation", 
            required: true, 
            example: { "path": "user.name" }
        }
    ],
    outputs: [
        { 
            name: "result", 
            type: "any", 
            description: "Transformed data" 
        },
        { 
            name: "original", 
            type: "any", 
            description: "Original input data for reference" 
        }
    ],
    edges: [
        { 
            name: "success", 
            description: "Transform completed successfully", 
            outputType: "object" 
        },
        { 
            name: "error", 
            description: "Transform failed", 
            outputType: "object" 
        }
    ],
    implementation: async function(params) {
        const { data, operation, config } = params;
        
        try {
            let result;
            
            switch (operation) {
                case 'extract':
                    // Extract value from object path
                    result = extractPath(data, config.path || '');
                    break;
                    
                case 'map':
                    // Map array elements
                    if (!Array.isArray(data)) {
                        throw new Error('Map operation requires array input');
                    }
                    result = data.map((item, index) => {
                        if (config.expression) {
                            // Simple expression evaluation (limited for safety)
                            return evaluateSimpleExpression(config.expression, { item, index });
                        }
                        return extractPath(item, config.path || '');
                    });
                    break;
                    
                case 'filter':
                    // Filter array elements
                    if (!Array.isArray(data)) {
                        throw new Error('Filter operation requires array input');
                    }
                    result = data.filter((item, index) => {
                        if (config.expression) {
                            return evaluateSimpleExpression(config.expression, { item, index });
                        }
                        // Default: filter out null/undefined
                        return item != null;
                    });
                    break;
                    
                case 'reduce':
                    // Reduce array to single value
                    if (!Array.isArray(data)) {
                        throw new Error('Reduce operation requires array input');
                    }
                    const initialValue = config.initialValue !== undefined ? config.initialValue : 0;
                    result = data.reduce((acc, item, index) => {
                        if (config.operation === 'sum') {
                            return acc + (typeof item === 'number' ? item : 0);
                        } else if (config.operation === 'count') {
                            return acc + 1;
                        } else if (config.operation === 'concat') {
                            return acc + String(item);
                        }
                        return acc;
                    }, initialValue);
                    break;
                    
                case 'custom':
                    // Custom transformation using template
                    if (config.template) {
                        result = processTemplate(config.template, data);
                    } else {
                        throw new Error('Custom operation requires template in config');
                    }
                    break;
                    
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }
            
            // Store transform result in state
            this.state.set('lastTransform', {
                operation,
                timestamp: Date.now(),
                inputType: Array.isArray(data) ? 'array' : typeof data,
                resultType: Array.isArray(result) ? 'array' : typeof result
            });
            
            return {
                success: () => ({
                    result,
                    original: data
                })
            };
            
        } catch (error) {
            console.error(`[Transform Node] Error: ${error.message}`);
            
            return {
                error: () => ({
                    error: error.message,
                    operation,
                    original: data
                })
            };
        }
        
        // Helper function to extract value from object path
        function extractPath(obj, path) {
            if (!path) return obj;
            
            const parts = path.split('.');
            let current = obj;
            
            for (const part of parts) {
                if (current == null) return undefined;
                
                // Handle array index notation
                const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
                if (arrayMatch) {
                    current = current[arrayMatch[1]];
                    if (Array.isArray(current)) {
                        current = current[parseInt(arrayMatch[2])];
                    }
                } else {
                    current = current[part];
                }
            }
            
            return current;
        }
        
        // Helper function for simple expression evaluation
        function evaluateSimpleExpression(expr, context) {
            // Very basic expression evaluation for safety
            // Only supports simple comparisons and property access
            try {
                // Replace item references
                let processed = expr.replace(/\bitem\b/g, 'context.item');
                processed = processed.replace(/\bindex\b/g, 'context.index');
                
                // Only allow safe operations
                if (!/^[a-zA-Z0-9\s\.\[\]<>=!&|()'"]+$/.test(processed)) {
                    throw new Error('Expression contains unsafe characters');
                }
                
                // Use Function constructor for evaluation (safer than eval)
                const func = new Function('context', `return ${processed}`);
                return func(context);
            } catch (e) {
                return false;
            }
        }
        
        // Helper function to process templates
        function processTemplate(template, data) {
            if (typeof template === 'string') {
                // Simple string interpolation
                return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
                    return extractPath(data, path) || '';
                });
            } else if (typeof template === 'object' && template !== null) {
                // Object template
                const result = {};
                for (const [key, value] of Object.entries(template)) {
                    if (typeof value === 'string' && value.startsWith('$.')) {
                        // Path reference
                        result[key] = extractPath(data, value.substring(2));
                    } else if (typeof value === 'object') {
                        // Nested template
                        result[key] = processTemplate(value, data);
                    } else {
                        // Static value
                        result[key] = value;
                    }
                }
                return result;
            }
            return template;
        }
    },
    aiPromptHints: {
        toolName: "data_transformer",
        summary: "Transforms data through extraction, mapping, filtering, or custom operations",
        useCase: "Use to reshape data, extract specific fields, filter arrays, or apply transformations",
        expectedInputFormat: "Provide 'data' (any type), 'operation' (extract/map/filter/reduce/custom), and 'config' object with operation-specific settings",
        outputDescription: "Returns transformed data via 'success' edge or error details via 'error' edge",
        examples: [
            "Extract user.name with operation='extract' and config.path='user.name'",
            "Map array to names with operation='map' and config.path='name'",
            "Filter items > 10 with operation='filter' and config.expression='item > 10'",
            "Sum array with operation='reduce' and config.operation='sum'",
            "Custom template with operation='custom' and config.template"
        ]
    }
};