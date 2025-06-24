import { FlowManager } from '../core/FlowManager.js';
import { NodeRegistry } from '../core/NodeRegistry.js';
import allNodes from '../nodes/index.js';

// Register all nodes
allNodes.forEach(node => NodeRegistry.register(node));

// Get the scope for FlowManager
const scope = NodeRegistry.getScope();

async function testHTTPRequest() {
    console.log('\n=== Testing HTTP Request Node ===');
    
    const workflow = [
        // Make a simple GET request
        { "integration.http.request": {
            url: "https://jsonplaceholder.typicode.com/users/1",
            method: "GET",
            responseType: "json"
        }},
        // Handle the response
        {
            "success": function() {
                console.log("User data received:", this.input.response);
                console.log("Status code:", this.input.status);
                return this.input.response;
            },
            "error": function() {
                console.error("Request failed:", this.input.error);
                return null;
            }
        }
    ];
    
    const fm = FlowManager({ nodes: workflow, scope });
    const result = await fm.run();
    console.log('Request completed');
}

async function testWebhookFlow() {
    console.log('\n=== Testing Webhook Trigger and Response ===');
    
    // Simulate incoming webhook data
    const incomingWebhook = {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-webhook-secret": "my-secret-token",
            "x-event-type": "user.created"
        },
        body: {
            event: "user.created",
            data: {
                userId: "12345",
                email: "newuser@example.com",
                name: "New User"
            }
        },
        query: {
            source: "api"
        },
        path: "/webhook/user"
    };
    
    const workflow = [
        // Set up the webhook data
        function() {
            this.state.set('incoming_webhook', incomingWebhook);
            this.state.set('webhook_secret', 'my-secret-token');
            return incomingWebhook;
        },
        // Validate and process the webhook
        { "integration.webhook.trigger": {
            webhookData: "${incoming_webhook}",
            validationConfig: {
                requireToken: true,
                tokenLocation: "header",
                tokenField: "x-webhook-secret",
                expectedToken: "${webhook_secret}",
                allowedMethods: ["POST", "PUT"]
            },
            extractConfig: {
                bodyPath: "data",
                headerFields: ["x-event-type"],
                queryFields: ["source"]
            }
        }},
        // Branch based on validation
        {
            "valid": [
                function() {
                    console.log("Webhook validated successfully!");
                    console.log("Event type:", this.input.extracted.headers["x-event-type"]);
                    console.log("User data:", this.input.extracted.body);
                    console.log("Source:", this.input.extracted.query.source);
                    
                    // Process the webhook data
                    const userData = this.input.extracted.body;
                    this.state.set('processedId', userData.userId);
                    
                    return { processed: true, userId: userData.userId };
                },
                // Send success response
                { "integration.webhook.response": {
                    statusCode: 200,
                    body: { 
                        status: "success", 
                        message: "User created successfully",
                        userId: "${processedId}"
                    },
                    responseType: "json"
                }},
                function() {
                    console.log("Webhook response prepared:", this.input.response);
                    return this.input;
                }
            ],
            "invalid": [
                function() {
                    console.log("Webhook validation failed:", this.input.reason);
                    return this.input;
                },
                // Send error response
                { "integration.webhook.response": {
                    statusCode: 401,
                    body: { 
                        error: "Unauthorized", 
                        message: "Invalid webhook credentials"
                    },
                    responseType: "json"
                }}
            ]
        }
    ];
    
    const fm = FlowManager({ nodes: workflow, scope });
    const result = await fm.run();
}

async function testHTTPPostWithAuth() {
    console.log('\n=== Testing HTTP POST with Authentication ===');
    
    const workflow = [
        // Set up data
        function() {
            this.state.set('api_token', 'fake-bearer-token');
            this.state.set('new_post', {
                title: 'Test Post',
                body: 'This is a test post created by the flow engine',
                userId: 1
            });
            return this.state.get('new_post');
        },
        // Make POST request with auth
        { "integration.http.request": {
            url: "https://jsonplaceholder.typicode.com/posts",
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: "${new_post}",
            auth: {
                type: "bearer",
                token: "${api_token}"
            }
        }},
        // Handle response
        {
            "success": function() {
                console.log("Post created successfully!");
                console.log("Response:", this.input.response);
                console.log("Status:", this.input.status);
                return this.input.response;
            },
            "error": function() {
                console.error("Failed to create post:", this.input.error);
                return null;
            }
        }
    ];
    
    const fm = FlowManager({ nodes: workflow, scope });
    const result = await fm.run();
}

// Run all tests
async function runTests() {
    await testHTTPRequest();
    await testWebhookFlow();
    await testHTTPPostWithAuth();
    
    console.log('\n=== All integration tests completed ===');
}

// Execute tests
runTests().catch(console.error);