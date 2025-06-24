/** @type {import('../../types/flow-types.jsdoc.js').NodeDefinition} */
export default {
    id: "integration.webhook.response",
    version: "1.0.0",
    name: "Webhook Response",
    description: "Constructs and sends a response to an incoming webhook request. Allows setting status codes, headers, and response body.",
    categories: ["Integration", "Webhook", "Response"],
    tags: ["webhook", "response", "http", "reply", "output"],
    inputs: [
        { 
            name: "statusCode", 
            type: "number", 
            description: "HTTP status code for the response", 
            required: false, 
            defaultValue: 200,
            example: 200,
            validation: {
                min: 100,
                max: 599
            }
        },
        { 
            name: "body", 
            type: "any", 
            description: "Response body (automatically JSON stringified for objects)", 
            required: false, 
            example: { "status": "success", "message": "Webhook processed", "id": "12345" }
        },
        { 
            name: "headers", 
            type: "object", 
            description: "Response headers to send", 
            required: false, 
            example: { 
                "Content-Type": "application/json",
                "X-Webhook-Received": "true",
                "Cache-Control": "no-cache"
            }
        },
        { 
            name: "responseType", 
            type: "string", 
            description: "Type of response to send", 
            required: false, 
            defaultValue: "json",
            enum: ["json", "text", "html", "empty"],
            example: "json"
        },
        { 
            name: "webhookContext", 
            type: "object", 
            description: "Original webhook context (from webhook trigger)", 
            required: false, 
            example: {
                path: "/webhook/user",
                method: "POST",
                metadata: { receivedAt: 1234567890 }
            }
        },
        { 
            name: "delay", 
            type: "number", 
            description: "Optional delay before sending response (milliseconds)", 
            required: false, 
            defaultValue: 0,
            example: 100,
            validation: {
                min: 0,
                max: 5000
            }
        }
    ],
    outputs: [
        { 
            name: "response", 
            type: "object", 
            description: "The complete response object that was sent" 
        },
        { 
            name: "timing", 
            type: "object", 
            description: "Timing information for the response" 
        }
    ],
    edges: [
        { 
            name: "sent", 
            description: "Response was successfully prepared", 
            outputType: "object" 
        },
        { 
            name: "error", 
            description: "Error preparing response", 
            outputType: "object" 
        }
    ],
    implementation: async function(params) {
        const { 
            statusCode = 200, 
            body, 
            headers = {}, 
            responseType = 'json',
            webhookContext,
            delay = 0
        } = params;
        
        try {
            // Validate status code
            if (statusCode < 100 || statusCode > 599) {
                throw new Error(`Invalid status code: ${statusCode}. Must be between 100-599.`);
            }
            
            // Apply delay if specified
            if (delay > 0) {
                if (this.flowInstanceId) {
                    console.log(`[Flow ${this.flowInstanceId}] Delaying webhook response by ${delay}ms`);
                }
                await new Promise(resolve => setTimeout(resolve, Math.min(delay, 5000)));
            }
            
            // Prepare response headers
            const responseHeaders = { ...headers };
            
            // Set default headers based on response type
            if (!responseHeaders['Content-Type']) {
                switch (responseType) {
                    case 'json':
                        responseHeaders['Content-Type'] = 'application/json';
                        break;
                    case 'text':
                        responseHeaders['Content-Type'] = 'text/plain';
                        break;
                    case 'html':
                        responseHeaders['Content-Type'] = 'text/html';
                        break;
                }
            }
            
            // Add webhook processing headers
            responseHeaders['X-Processed-By'] = 'flow-engine';
            if (webhookContext?.metadata?.receivedAt) {
                const processingTime = Date.now() - webhookContext.metadata.receivedAt;
                responseHeaders['X-Processing-Time'] = `${processingTime}ms`;
            }
            
            // Prepare response body
            let responseBody;
            let bodySize = 0;
            
            switch (responseType) {
                case 'json':
                    if (body !== undefined) {
                        responseBody = JSON.stringify(body, null, 2);
                        bodySize = Buffer.byteLength(responseBody);
                    } else {
                        responseBody = '{}';
                        bodySize = 2;
                    }
                    break;
                    
                case 'text':
                    responseBody = body ? String(body) : '';
                    bodySize = Buffer.byteLength(responseBody);
                    break;
                    
                case 'html':
                    responseBody = body ? String(body) : '<html><body>OK</body></html>';
                    bodySize = Buffer.byteLength(responseBody);
                    break;
                    
                case 'empty':
                    responseBody = '';
                    bodySize = 0;
                    break;
                    
                default:
                    responseBody = body ? String(body) : '';
                    bodySize = Buffer.byteLength(responseBody);
            }
            
            // Add content length header
            if (bodySize > 0 && !responseHeaders['Content-Length']) {
                responseHeaders['Content-Length'] = String(bodySize);
            }
            
            // Create the response object
            const response = {
                statusCode,
                headers: responseHeaders,
                body: responseBody,
                originalBody: body, // Keep original for reference
                responseType
            };
            
            // Create timing information
            const timing = {
                preparedAt: Date.now(),
                delay: delay
            };
            
            if (webhookContext?.metadata?.receivedAt) {
                timing.totalProcessingTime = timing.preparedAt - webhookContext.metadata.receivedAt;
                timing.receivedAt = webhookContext.metadata.receivedAt;
            }
            
            // Store response info in state
            this.state.set('lastWebhookResponse', {
                statusCode,
                responseType,
                hasBody: bodySize > 0,
                timestamp: timing.preparedAt,
                webhookPath: webhookContext?.path
            });
            
            // Log response preparation
            if (this.flowInstanceId) {
                console.log(`[Flow ${this.flowInstanceId}] Webhook response prepared: ${statusCode} ${responseType}`);
                if (webhookContext?.path) {
                    console.log(`[Flow ${this.flowInstanceId}] Response for webhook: ${webhookContext.path}`);
                }
            }
            
            // Note: In a real implementation, this response would be sent back through
            // the webhook handling infrastructure. The actual sending mechanism depends
            // on how webhooks are integrated with the flow engine (e.g., through an
            // HTTP server, serverless function, etc.)
            
            return {
                sent: () => ({
                    response,
                    timing
                })
            };
            
        } catch (error) {
            console.error(`[Webhook Response Node] Error: ${error.message}`);
            
            return {
                error: () => ({
                    error: error.message,
                    attemptedResponse: {
                        statusCode,
                        responseType,
                        hasBody: !!body
                    }
                })
            };
        }
    },
    aiPromptHints: {
        toolName: "webhook_response",
        summary: "Constructs HTTP responses for incoming webhooks",
        useCase: "Use after processing a webhook to send appropriate response back to the caller",
        expectedInputFormat: "Optional 'statusCode' (default 200), 'body', 'headers', 'responseType'. Include 'webhookContext' from trigger for timing info.",
        outputDescription: "Returns prepared response object via 'sent' edge with status, headers, and body",
        examples: [
            "Send 200 OK with JSON success message",
            "Return 202 Accepted for async processing",
            "Send 400 Bad Request with error details",
            "Return 204 No Content for successful deletion",
            "Custom headers with processing metadata"
        ]
    }
};