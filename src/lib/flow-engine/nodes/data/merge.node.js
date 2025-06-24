/** @type {import('../../types/flow-types.jsdoc.js').NodeDefinition} */
export default {
    id: "data.combine.merge",
    version: "1.0.0",
    name: "Merge Data",
    description: "Merges multiple data sources into a single output. Supports object merging, array concatenation, and custom merge strategies.",
    categories: ["Data", "Transform"],
    tags: ["merge", "combine", "join", "concat", "aggregate"],
    inputs: [
        { 
            name: "source1", 
            type: "any", 
            description: "First data source", 
            required: true, 
            example: { "name": "John", "age": 30 }
        },
        { 
            name: "source2", 
            type: "any", 
            description: "Second data source", 
            required: true, 
            example: { "email": "john@example.com", "age": 31 }
        },
        { 
            name: "additionalSources", 
            type: "array", 
            description: "Additional data sources to merge", 
            required: false, 
            example: [{ "city": "New York" }]
        },
        { 
            name: "strategy", 
            type: "string", 
            description: "Merge strategy", 
            required: false, 
            defaultValue: "shallow",
            enum: ["shallow", "deep", "concat", "combine"],
            example: "deep"
        },
        { 
            name: "conflictResolution", 
            type: "string", 
            description: "How to handle conflicts when merging objects", 
            required: false, 
            defaultValue: "overwrite",
            enum: ["overwrite", "preserve", "array", "error"],
            example: "overwrite"
        }
    ],
    outputs: [
        { 
            name: "merged", 
            type: "any", 
            description: "Merged result" 
        },
        { 
            name: "sources", 
            type: "array", 
            description: "Original sources for reference" 
        },
        { 
            name: "mergeInfo", 
            type: "object", 
            description: "Information about the merge operation" 
        }
    ],
    edges: [
        { 
            name: "success", 
            description: "Merge completed successfully", 
            outputType: "object" 
        },
        { 
            name: "error", 
            description: "Merge failed", 
            outputType: "object" 
        }
    ],
    implementation: async function(params) {
        const { source1, source2, additionalSources, strategy = 'shallow', conflictResolution = 'overwrite' } = params;
        
        try {
            // Collect all sources
            const allSources = [source1, source2];
            if (Array.isArray(additionalSources)) {
                allSources.push(...additionalSources);
            }
            
            // Filter out null/undefined sources
            const validSources = allSources.filter(s => s != null);
            
            if (validSources.length === 0) {
                throw new Error('No valid sources to merge');
            }
            
            let merged;
            const mergeInfo = {
                strategy,
                sourceCount: validSources.length,
                conflicts: []
            };
            
            switch (strategy) {
                case 'shallow':
                    // Simple object spread
                    if (validSources.every(s => typeof s === 'object' && !Array.isArray(s))) {
                        merged = Object.assign({}, ...validSources);
                    } else {
                        throw new Error('Shallow merge requires all sources to be objects');
                    }
                    break;
                    
                case 'deep':
                    // Deep merge objects
                    if (validSources.every(s => typeof s === 'object' && !Array.isArray(s))) {
                        merged = deepMerge(validSources, conflictResolution, mergeInfo);
                    } else {
                        throw new Error('Deep merge requires all sources to be objects');
                    }
                    break;
                    
                case 'concat':
                    // Concatenate arrays or convert to array
                    if (validSources.every(s => Array.isArray(s))) {
                        merged = [].concat(...validSources);
                    } else {
                        // Convert non-arrays to arrays and concat
                        merged = validSources.reduce((acc, source) => {
                            if (Array.isArray(source)) {
                                return acc.concat(source);
                            } else {
                                return acc.concat([source]);
                            }
                        }, []);
                    }
                    break;
                    
                case 'combine':
                    // Combine into structured output
                    merged = {
                        source1: source1,
                        source2: source2
                    };
                    if (additionalSources && additionalSources.length > 0) {
                        additionalSources.forEach((source, index) => {
                            merged[`source${index + 3}`] = source;
                        });
                    }
                    break;
                    
                default:
                    throw new Error(`Unknown merge strategy: ${strategy}`);
            }
            
            // Store merge info in state
            this.state.set('lastMerge', {
                timestamp: Date.now(),
                strategy,
                sourceCount: validSources.length,
                resultType: Array.isArray(merged) ? 'array' : typeof merged
            });
            
            return {
                success: () => ({
                    merged,
                    sources: validSources,
                    mergeInfo
                })
            };
            
        } catch (error) {
            console.error(`[Merge Node] Error: ${error.message}`);
            
            return {
                error: () => ({
                    error: error.message,
                    sources: [source1, source2],
                    strategy
                })
            };
        }
        
        // Helper function for deep merge
        function deepMerge(sources, conflictRes, info) {
            const result = {};
            const processedKeys = new Set();
            
            for (const source of sources) {
                if (!source || typeof source !== 'object') continue;
                
                for (const [key, value] of Object.entries(source)) {
                    if (processedKeys.has(key)) {
                        // Handle conflict
                        const existingValue = result[key];
                        
                        switch (conflictRes) {
                            case 'overwrite':
                                result[key] = value;
                                info.conflicts.push({ key, resolution: 'overwritten' });
                                break;
                                
                            case 'preserve':
                                // Keep existing value
                                info.conflicts.push({ key, resolution: 'preserved' });
                                break;
                                
                            case 'array':
                                // Combine into array
                                if (Array.isArray(result[key])) {
                                    result[key].push(value);
                                } else {
                                    result[key] = [existingValue, value];
                                }
                                info.conflicts.push({ key, resolution: 'combined to array' });
                                break;
                                
                            case 'error':
                                throw new Error(`Conflict on key '${key}'`);
                                
                            default:
                                result[key] = value;
                        }
                    } else {
                        // No conflict
                        if (value && typeof value === 'object' && !Array.isArray(value)) {
                            // Recursively merge nested objects
                            const nestedSources = sources
                                .map(s => s[key])
                                .filter(v => v && typeof v === 'object' && !Array.isArray(v));
                            
                            if (nestedSources.length > 1) {
                                result[key] = deepMerge(nestedSources, conflictRes, info);
                            } else {
                                result[key] = JSON.parse(JSON.stringify(value)); // Deep copy
                            }
                        } else {
                            result[key] = value;
                        }
                        processedKeys.add(key);
                    }
                }
            }
            
            return result;
        }
    },
    aiPromptHints: {
        toolName: "data_merger",
        summary: "Merges multiple data sources using various strategies",
        useCase: "Use to combine objects, concatenate arrays, or aggregate data from multiple sources",
        expectedInputFormat: "Provide 'source1' and 'source2' (required), optional 'additionalSources' array, 'strategy' (shallow/deep/concat/combine), and 'conflictResolution'",
        outputDescription: "Returns merged data, original sources, and merge information via 'success' edge",
        examples: [
            "Merge user profiles with strategy='deep'",
            "Concatenate arrays with strategy='concat'",
            "Combine API responses with strategy='combine'",
            "Shallow merge configs with conflictResolution='preserve'"
        ]
    }
};