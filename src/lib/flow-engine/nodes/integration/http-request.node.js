/** @type {import('../../types/flow-types.jsdoc.js').NodeDefinition} */
export default {
    id: "integration.http.request",
    version: "1.0.0",
    name: "HTTP Request",
    description: "Makes HTTP/HTTPS requests to external APIs and services. Supports all common HTTP methods, headers, authentication, and request/response handling.",
    categories: ["Integration", "API", "Network"],
    tags: ["http", "https", "api", "rest", "request", "fetch", "webhook"],
    inputs: [
        { 
            name: "url", 
            type: "string", 
            description: "The URL to send the request to", 
            required: true, 
            example: "https://api.example.com/users"
        },
        { 
            name: "method", 
            type: "string", 
            description: "HTTP method", 
            required: false, 
            defaultValue: "GET",
            enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
            example: "POST"
        },
        { 
            name: "headers", 
            type: "object", 
            description: "HTTP headers to send with the request", 
            required: false, 
            example: { "Content-Type": "application/json", "Authorization": "Bearer token" }
        },
        { 
            name: "body", 
            type: "any", 
            description: "Request body (automatically JSON stringified for objects)", 
            required: false, 
            example: { "name": "John", "email": "john@example.com" }
        },
        { 
            name: "queryParams", 
            type: "object", 
            description: "Query parameters to append to the URL", 
            required: false, 
            example: { "page": 1, "limit": 10 }
        },
        { 
            name: "timeout", 
            type: "number", 
            description: "Request timeout in milliseconds", 
            required: false, 
            defaultValue: 30000,
            example: 5000
        },
        { 
            name: "responseType", 
            type: "string", 
            description: "Expected response type", 
            required: false, 
            defaultValue: "json",
            enum: ["json", "text", "buffer", "stream"],
            example: "json"
        },
        { 
            name: "auth", 
            type: "object", 
            description: "Authentication configuration", 
            required: false, 
            example: { "type": "bearer", "token": "${api_token}" }
        }
    ],
    outputs: [
        { 
            name: "response", 
            type: "any", 
            description: "Response body (parsed based on responseType)" 
        },
        { 
            name: "status", 
            type: "number", 
            description: "HTTP status code" 
        },
        { 
            name: "headers", 
            type: "object", 
            description: "Response headers" 
        },
        { 
            name: "request", 
            type: "object", 
            description: "Request details for debugging" 
        }
    ],
    edges: [
        { 
            name: "success", 
            description: "Request completed successfully (2xx status)", 
            outputType: "object" 
        },
        { 
            name: "error", 
            description: "Request failed or returned error status", 
            outputType: "object" 
        }
    ],
    implementation: async function(params) {
        const { 
            url, 
            method = 'GET', 
            headers = {}, 
            body, 
            queryParams, 
            timeout = 30000,
            responseType = 'json',
            auth
        } = params;
        
        try {
            // Build URL with query parameters
            let finalUrl = url;
            if (queryParams && Object.keys(queryParams).length > 0) {
                const urlObj = new URL(url);
                Object.entries(queryParams).forEach(([key, value]) => {
                    urlObj.searchParams.append(key, String(value));
                });
                finalUrl = urlObj.toString();
            }
            
            // Prepare headers
            const requestHeaders = { ...headers };
            
            // Add authentication headers if provided
            if (auth) {
                switch (auth.type) {
                    case 'bearer':
                        requestHeaders['Authorization'] = `Bearer ${auth.token}`;
                        break;
                    case 'basic':
                        const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
                        requestHeaders['Authorization'] = `Basic ${credentials}`;
                        break;
                    case 'apikey':
                        if (auth.headerName) {
                            requestHeaders[auth.headerName] = auth.key;
                        } else {
                            requestHeaders['X-API-Key'] = auth.key;
                        }
                        break;
                }
            }
            
            // Prepare body
            let requestBody = body;
            if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
                requestBody = JSON.stringify(body);
                if (!requestHeaders['Content-Type']) {
                    requestHeaders['Content-Type'] = 'application/json';
                }
            }
            
            // Create request options
            const requestOptions = {
                method,
                headers: requestHeaders
            };
            
            // Add body for methods that support it
            if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
                requestOptions.body = requestBody;
            }
            
            // Log request details
            const requestDetails = {
                url: finalUrl,
                method,
                headers: requestHeaders,
                hasBody: !!requestBody
            };
            
            if (this.flowInstanceId) {
                console.log(`[Flow ${this.flowInstanceId}] HTTP ${method} ${finalUrl}`);
            }
            
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            try {
                // Make the request
                const response = await fetch(finalUrl, {
                    ...requestOptions,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                // Get response headers as plain object
                const responseHeaders = {};
                response.headers.forEach((value, key) => {
                    responseHeaders[key] = value;
                });
                
                // Parse response based on type
                let responseData;
                switch (responseType) {
                    case 'json':
                        try {
                            responseData = await response.json();
                        } catch (e) {
                            // If JSON parsing fails, return as text
                            responseData = await response.text();
                        }
                        break;
                    case 'text':
                        responseData = await response.text();
                        break;
                    case 'buffer':
                        responseData = Buffer.from(await response.arrayBuffer());
                        break;
                    case 'stream':
                        // Return the response object itself for streaming
                        responseData = response;
                        break;
                    default:
                        responseData = await response.text();
                }
                
                // Store request info in state
                this.state.set('lastHttpRequest', {
                    url: finalUrl,
                    method,
                    status: response.status,
                    timestamp: Date.now()
                });
                
                // Determine success based on status code
                const isSuccess = response.status >= 200 && response.status < 300;
                
                const result = {
                    response: responseData,
                    status: response.status,
                    headers: responseHeaders,
                    request: requestDetails
                };
                
                if (isSuccess) {
                    return {
                        success: () => result
                    };
                } else {
                    return {
                        error: () => ({
                            ...result,
                            error: `HTTP ${response.status}: ${response.statusText}`
                        })
                    };
                }
                
            } catch (fetchError) {
                clearTimeout(timeoutId);
                
                // Handle timeout specifically
                if (fetchError.name === 'AbortError') {
                    throw new Error(`Request timeout after ${timeout}ms`);
                }
                throw fetchError;
            }
            
        } catch (error) {
            console.error(`[HTTP Request Node] Error: ${error.message}`);
            
            return {
                error: () => ({
                    error: error.message,
                    request: {
                        url,
                        method,
                        headers
                    }
                })
            };
        }
    },
    aiPromptHints: {
        toolName: "http_request",
        summary: "Makes HTTP requests to external APIs and web services",
        useCase: "Use for REST API calls, webhook requests, data fetching, or any HTTP-based integration",
        expectedInputFormat: "Provide 'url' (required), optional 'method', 'headers', 'body', 'queryParams', etc.",
        outputDescription: "Returns response data, status, headers via 'success' edge (2xx) or 'error' edge (non-2xx)",
        examples: [
            "GET request to fetch user data",
            "POST JSON data to an API endpoint",
            "PUT request with authentication headers",
            "DELETE with query parameters",
            "Webhook POST with custom headers"
        ]
    }
};