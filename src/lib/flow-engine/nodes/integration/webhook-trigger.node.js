/** @type {import('../../types/flow-types.jsdoc.js').NodeDefinition} */
export default {
    id: "integration.webhook.trigger",
    version: "1.0.0",
    name: "Webhook Trigger",
    description: "Receives and processes incoming webhook requests. Extracts data from headers, body, and query parameters for workflow processing.",
    categories: ["Integration", "Trigger", "Webhook"],
    tags: ["webhook", "trigger", "http", "endpoint", "receiver", "listener"],
    inputs: [
        { 
            name: "webhookData", 
            type: "object", 
            description: "The incoming webhook request data", 
            required: true, 
            example: {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: { "event": "user.created", "data": {} },
                query: { "token": "xyz" },
                path: "/webhook/user"
            }
        },
        { 
            name: "validationConfig", 
            type: "object", 
            description: "Configuration for validating incoming webhooks", 
            required: false, 
            example: {
                requireToken: true,
                tokenLocation: "header", // "header", "query", "body"
                tokenField: "X-Webhook-Token",
                expectedToken: "${webhook_secret}",
                allowedMethods: ["POST", "PUT"]
            }
        },
        { 
            name: "extractConfig", 
            type: "object", 
            description: "Configuration for extracting specific data from the webhook", 
            required: false, 
            example: {
                bodyPath: "data.user",
                headerFields: ["x-webhook-signature", "x-event-type"],
                queryFields: ["action", "id"]
            }
        }
    ],
    outputs: [
        { 
            name: "method", 
            type: "string", 
            description: "HTTP method of the webhook request" 
        },
        { 
            name: "headers", 
            type: "object", 
            description: "Request headers" 
        },
        { 
            name: "body", 
            type: "any", 
            description: "Request body (parsed if JSON)" 
        },
        { 
            name: "query", 
            type: "object", 
            description: "Query parameters" 
        },
        { 
            name: "path", 
            type: "string", 
            description: "Request path" 
        },
        { 
            name: "extracted", 
            type: "object", 
            description: "Extracted data based on extractConfig" 
        },
        { 
            name: "metadata", 
            type: "object", 
            description: "Additional webhook metadata" 
        }
    ],
    edges: [
        { 
            name: "valid", 
            description: "Webhook passed validation", 
            outputType: "object" 
        },
        { 
            name: "invalid", 
            description: "Webhook failed validation", 
            outputType: "object" 
        },
        { 
            name: "error", 
            description: "Error processing webhook", 
            outputType: "object" 
        }
    ],
    implementation: async function(params) {
        const { webhookData, validationConfig, extractConfig } = params;
        
        try {
            // Validate webhook data structure
            if (!webhookData || typeof webhookData !== 'object') {
                throw new Error('Invalid webhook data: must be an object');
            }
            
            const {
                method = 'POST',
                headers = {},
                body = {},
                query = {},
                path = '/webhook'
            } = webhookData;
            
            // Normalize headers to lowercase keys
            const normalizedHeaders = {};
            Object.entries(headers).forEach(([key, value]) => {
                normalizedHeaders[key.toLowerCase()] = value;
            });
            
            // Validation phase
            if (validationConfig) {
                // Check allowed methods
                if (validationConfig.allowedMethods && 
                    !validationConfig.allowedMethods.includes(method)) {
                    return {
                        invalid: () => ({
                            reason: 'Method not allowed',
                            allowedMethods: validationConfig.allowedMethods,
                            receivedMethod: method
                        })
                    };
                }
                
                // Check token validation
                if (validationConfig.requireToken) {
                    let receivedToken;
                    
                    switch (validationConfig.tokenLocation) {
                        case 'header':
                            const headerKey = (validationConfig.tokenField || 'x-webhook-token').toLowerCase();
                            receivedToken = normalizedHeaders[headerKey];
                            break;
                        case 'query':
                            receivedToken = query[validationConfig.tokenField || 'token'];
                            break;
                        case 'body':
                            receivedToken = extractPath(body, validationConfig.tokenField || 'token');
                            break;
                        default:
                            receivedToken = normalizedHeaders['x-webhook-token'] || query.token;
                    }
                    
                    if (!receivedToken || receivedToken !== validationConfig.expectedToken) {
                        return {
                            invalid: () => ({
                                reason: 'Invalid or missing token',
                                tokenLocation: validationConfig.tokenLocation,
                                tokenField: validationConfig.tokenField
                            })
                        };
                    }
                }
            }
            
            // Extract specific data if configured
            let extracted = {};
            if (extractConfig) {
                // Extract from body
                if (extractConfig.bodyPath) {
                    extracted.body = extractPath(body, extractConfig.bodyPath);
                }
                
                // Extract specific headers
                if (extractConfig.headerFields && Array.isArray(extractConfig.headerFields)) {
                    extracted.headers = {};
                    extractConfig.headerFields.forEach(field => {
                        const key = field.toLowerCase();
                        if (normalizedHeaders[key]) {
                            extracted.headers[field] = normalizedHeaders[key];
                        }
                    });
                }
                
                // Extract specific query params
                if (extractConfig.queryFields && Array.isArray(extractConfig.queryFields)) {
                    extracted.query = {};
                    extractConfig.queryFields.forEach(field => {
                        if (query[field] !== undefined) {
                            extracted.query[field] = query[field];
                        }
                    });
                }
            }
            
            // Create metadata
            const metadata = {
                receivedAt: Date.now(),
                contentType: normalizedHeaders['content-type'] || 'unknown',
                contentLength: normalizedHeaders['content-length'] || 0,
                userAgent: normalizedHeaders['user-agent'] || 'unknown',
                ip: normalizedHeaders['x-forwarded-for'] || 
                    normalizedHeaders['x-real-ip'] || 
                    'unknown'
            };
            
            // Store webhook info in state
            this.state.set('lastWebhook', {
                path,
                method,
                timestamp: metadata.receivedAt,
                eventType: extracted.headers?.['x-event-type'] || 
                          body.event || 
                          body.type || 
                          'unknown'
            });
            
            // Log webhook receipt
            if (this.flowInstanceId) {
                console.log(`[Flow ${this.flowInstanceId}] Webhook received: ${method} ${path}`);
            }
            
            return {
                valid: () => ({
                    method,
                    headers: normalizedHeaders,
                    body,
                    query,
                    path,
                    extracted,
                    metadata
                })
            };
            
        } catch (error) {
            console.error(`[Webhook Trigger Node] Error: ${error.message}`);
            
            return {
                error: () => ({
                    error: error.message,
                    webhookData: params.webhookData
                })
            };
        }
        
        // Helper function to extract value from object path
        function extractPath(obj, path) {
            if (!path || !obj) return obj;
            
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
    },
    aiPromptHints: {
        toolName: "webhook_trigger",
        summary: "Receives and processes incoming webhook requests",
        useCase: "Use as the entry point for workflows triggered by external webhooks (GitHub, Stripe, etc.)",
        expectedInputFormat: "Provide 'webhookData' with method, headers, body, query, path. Optional validation and extraction configs.",
        outputDescription: "Returns parsed webhook data via 'valid' edge or validation failure via 'invalid' edge",
        examples: [
            "GitHub webhook for push events",
            "Stripe payment webhook",
            "Custom API webhook with token validation",
            "Slack event subscription",
            "Form submission webhook"
        ]
    }
};