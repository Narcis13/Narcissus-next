/** @type {import('../../types/flow-types.jsdoc.js').NodeDefinition} */
export default {
    id: "ai.response.parser",
    version: "1.0.0",
    name: "AI Response Parser",
    description: "Parses and extracts structured data from AI responses. Handles JSON extraction, sentiment analysis, entity extraction, and content classification.",
    categories: ["AI", "Data", "Transform"],
    tags: ["parser", "ai", "extract", "json", "sentiment", "entity", "classification"],
    inputs: [
        { 
            name: "aiResponse", 
            type: "string", 
            description: "The AI-generated response to parse", 
            required: true, 
            example: "The sentiment is positive. Here's the JSON data: {\"score\": 0.8, \"confidence\": \"high\"}"
        },
        { 
            name: "parseMode", 
            type: "string", 
            description: "Type of parsing to perform", 
            required: true, 
            enum: ["json", "sentiment", "entities", "classification", "structured", "custom"],
            example: "json"
        },
        { 
            name: "config", 
            type: "object", 
            description: "Configuration for the selected parse mode", 
            required: false, 
            example: {
                jsonPath: "$.data",
                sentimentLabels: ["positive", "negative", "neutral"],
                entityTypes: ["person", "location", "organization"],
                classificationCategories: ["technical", "business", "general"],
                structuredSchema: {
                    name: "string",
                    age: "number",
                    items: "array"
                }
            }
        },
        { 
            name: "fallbackValue", 
            type: "any", 
            description: "Value to return if parsing fails", 
            required: false, 
            example: { error: "Failed to parse" }
        },
        { 
            name: "strict", 
            type: "boolean", 
            description: "Whether to fail on parsing errors (true) or use fallback (false)", 
            required: false, 
            defaultValue: false
        }
    ],
    outputs: [
        { 
            name: "parsed", 
            type: "any", 
            description: "The parsed/extracted data" 
        },
        { 
            name: "original", 
            type: "string", 
            description: "Original AI response for reference" 
        },
        { 
            name: "metadata", 
            type: "object", 
            description: "Parsing metadata and statistics" 
        }
    ],
    edges: [
        { 
            name: "success", 
            description: "Parsing completed successfully", 
            outputType: "object" 
        },
        { 
            name: "partial", 
            description: "Parsing partially successful with fallback", 
            outputType: "object" 
        },
        { 
            name: "error", 
            description: "Parsing failed", 
            outputType: "object" 
        }
    ],
    implementation: async function(params) {
        const { 
            aiResponse, 
            parseMode, 
            config = {}, 
            fallbackValue,
            strict = false
        } = params;
        
        try {
            let parsed;
            let metadata = {
                parseMode,
                timestamp: Date.now(),
                responseLength: aiResponse.length
            };
            
            switch (parseMode) {
                case 'json':
                    parsed = parseJSON(aiResponse, config, metadata);
                    break;
                    
                case 'sentiment':
                    parsed = parseSentiment(aiResponse, config, metadata);
                    break;
                    
                case 'entities':
                    parsed = parseEntities(aiResponse, config, metadata);
                    break;
                    
                case 'classification':
                    parsed = parseClassification(aiResponse, config, metadata);
                    break;
                    
                case 'structured':
                    parsed = parseStructured(aiResponse, config, metadata);
                    break;
                    
                case 'custom':
                    parsed = parseCustom(aiResponse, config, metadata);
                    break;
                    
                default:
                    throw new Error(`Unknown parse mode: ${parseMode}`);
            }
            
            // Store parsing info in state
            this.state.set('lastAIParsing', {
                mode: parseMode,
                success: true,
                timestamp: metadata.timestamp
            });
            
            // Log parsing
            if (this.flowInstanceId) {
                console.log(`[Flow ${this.flowInstanceId}] AI response parsed: mode=${parseMode}`);
            }
            
            return {
                success: () => ({
                    parsed,
                    original: aiResponse,
                    metadata
                })
            };
            
        } catch (error) {
            console.error(`[AI Response Parser Node] Error: ${error.message}`);
            
            // Handle strict mode vs fallback
            if (strict) {
                return {
                    error: () => ({
                        error: error.message,
                        parseMode,
                        originalLength: aiResponse.length
                    })
                };
            } else {
                // Use fallback value
                const fallback = fallbackValue !== undefined ? fallbackValue : null;
                
                return {
                    partial: () => ({
                        parsed: fallback,
                        original: aiResponse,
                        metadata: {
                            parseMode,
                            timestamp: Date.now(),
                            error: error.message,
                            usedFallback: true
                        }
                    })
                };
            }
        }
        
        // Helper function to parse JSON from text
        function parseJSON(text, config, metadata) {
            // Try to find JSON in the text
            const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            
            const jsonStr = jsonMatch[0];
            const parsed = JSON.parse(jsonStr);
            
            // Apply JSON path if specified
            if (config.jsonPath) {
                // Simple JSON path implementation
                const path = config.jsonPath.replace(/^\$\./, '').split('.');
                let result = parsed;
                for (const key of path) {
                    result = result[key];
                    if (result === undefined) {
                        throw new Error(`Path ${config.jsonPath} not found`);
                    }
                }
                metadata.jsonPath = config.jsonPath;
                return result;
            }
            
            return parsed;
        }
        
        // Helper function to parse sentiment
        function parseSentiment(text, config, metadata) {
            const labels = config.sentimentLabels || ['positive', 'negative', 'neutral'];
            const lowerText = text.toLowerCase();
            
            // Simple keyword-based sentiment detection
            const sentimentKeywords = {
                positive: ['positive', 'good', 'great', 'excellent', 'happy', 'satisfied', 'love'],
                negative: ['negative', 'bad', 'poor', 'terrible', 'unhappy', 'dissatisfied', 'hate'],
                neutral: ['neutral', 'okay', 'fine', 'average', 'moderate']
            };
            
            let detectedSentiment = 'neutral';
            let confidence = 0;
            
            for (const [sentiment, keywords] of Object.entries(sentimentKeywords)) {
                const matches = keywords.filter(kw => lowerText.includes(kw)).length;
                if (matches > confidence) {
                    confidence = matches;
                    detectedSentiment = sentiment;
                }
            }
            
            // Look for explicit sentiment mentions
            for (const label of labels) {
                if (lowerText.includes(label)) {
                    detectedSentiment = label;
                    confidence = 1;
                    break;
                }
            }
            
            metadata.detectedKeywords = confidence;
            
            return {
                sentiment: detectedSentiment,
                confidence: confidence > 0 ? 'high' : 'low',
                labels: labels
            };
        }
        
        // Helper function to parse entities
        function parseEntities(text, config, metadata) {
            const entityTypes = config.entityTypes || ['person', 'location', 'organization', 'date', 'number'];
            const entities = [];
            
            // Simple pattern-based entity extraction
            const patterns = {
                person: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
                location: /\b(?:in|at|from|to) ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
                organization: /\b[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*(?:\s+(?:Inc|Corp|LLC|Ltd|Company|Co\.))\b/g,
                date: /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/g,
                number: /\b\d+(?:\.\d+)?\b/g
            };
            
            for (const type of entityTypes) {
                if (patterns[type]) {
                    const matches = text.match(patterns[type]) || [];
                    matches.forEach(match => {
                        entities.push({
                            type,
                            value: match.trim(),
                            position: text.indexOf(match)
                        });
                    });
                }
            }
            
            metadata.entityCount = entities.length;
            metadata.entityTypes = entityTypes;
            
            return {
                entities,
                count: entities.length,
                types: [...new Set(entities.map(e => e.type))]
            };
        }
        
        // Helper function to parse classification
        function parseClassification(text, config, metadata) {
            const categories = config.classificationCategories || ['technical', 'business', 'general'];
            const lowerText = text.toLowerCase();
            
            // Simple keyword-based classification
            const categoryKeywords = {
                technical: ['code', 'api', 'function', 'algorithm', 'database', 'server', 'bug', 'error'],
                business: ['revenue', 'customer', 'market', 'strategy', 'profit', 'sales', 'roi'],
                general: ['information', 'description', 'summary', 'overview', 'details']
            };
            
            const scores = {};
            for (const category of categories) {
                const keywords = categoryKeywords[category] || [];
                scores[category] = keywords.filter(kw => lowerText.includes(kw)).length;
            }
            
            // Find category with highest score
            let primaryCategory = categories[0];
            let maxScore = 0;
            for (const [category, score] of Object.entries(scores)) {
                if (score > maxScore) {
                    maxScore = score;
                    primaryCategory = category;
                }
            }
            
            metadata.classificationScores = scores;
            
            return {
                category: primaryCategory,
                confidence: maxScore > 0 ? 'high' : 'low',
                scores,
                categories
            };
        }
        
        // Helper function to parse structured data
        function parseStructured(text, config, metadata) {
            if (!config.structuredSchema) {
                throw new Error('Structured schema is required for structured parsing');
            }
            
            const schema = config.structuredSchema;
            const result = {};
            
            // Try to extract values based on schema
            for (const [field, type] of Object.entries(schema)) {
                // Look for field mentions in text
                const fieldRegex = new RegExp(`${field}[:\\s]+([^,\\n]+)`, 'i');
                const match = text.match(fieldRegex);
                
                if (match) {
                    const value = match[1].trim();
                    
                    // Convert based on type
                    switch (type) {
                        case 'number':
                            result[field] = parseFloat(value) || 0;
                            break;
                        case 'boolean':
                            result[field] = ['true', 'yes', '1'].includes(value.toLowerCase());
                            break;
                        case 'array':
                            result[field] = value.split(/[,;]/).map(v => v.trim());
                            break;
                        default:
                            result[field] = value;
                    }
                } else {
                    // Set default based on type
                    switch (type) {
                        case 'number':
                            result[field] = 0;
                            break;
                        case 'boolean':
                            result[field] = false;
                            break;
                        case 'array':
                            result[field] = [];
                            break;
                        default:
                            result[field] = null;
                    }
                }
            }
            
            metadata.schemaFields = Object.keys(schema);
            metadata.extractedFields = Object.keys(result).filter(k => result[k] !== null);
            
            return result;
        }
        
        // Helper function for custom parsing
        function parseCustom(text, config, metadata) {
            if (!config.customPattern) {
                // Default: split into lines and clean up
                const lines = text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                
                metadata.lineCount = lines.length;
                
                return {
                    lines,
                    firstLine: lines[0] || '',
                    lastLine: lines[lines.length - 1] || ''
                };
            }
            
            // Use custom regex pattern
            const regex = new RegExp(config.customPattern, config.customFlags || 'g');
            const matches = [];
            let match;
            
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    match: match[0],
                    groups: match.slice(1),
                    index: match.index
                });
            }
            
            metadata.matchCount = matches.length;
            metadata.pattern = config.customPattern;
            
            return {
                matches,
                count: matches.length,
                hasMatches: matches.length > 0
            };
        }
    },
    aiPromptHints: {
        toolName: "ai_response_parser",
        summary: "Extracts structured data from AI-generated text responses",
        useCase: "Use after AI completion nodes to extract JSON, analyze sentiment, find entities, classify content, or parse structured information",
        expectedInputFormat: "Provide 'aiResponse' (required), 'parseMode' (required), optional 'config' for mode-specific settings",
        outputDescription: "Returns parsed data based on mode via 'success' edge, or fallback via 'partial' edge",
        examples: [
            "Extract JSON from ChatGPT response",
            "Analyze sentiment in AI-generated review",
            "Find entities in Claude's analysis",
            "Classify AI response by topic",
            "Parse structured data from AI output",
            "Custom pattern matching in responses"
        ]
    }
};