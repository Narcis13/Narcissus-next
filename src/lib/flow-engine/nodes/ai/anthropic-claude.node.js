/** @type {import('../../types/flow-types.jsdoc.js').NodeDefinition} */
export default {
    id: "ai.anthropic.claude",
    version: "1.0.0",
    name: "Anthropic Claude",
    description: "Generates text completions using Anthropic's Claude AI models. Supports conversations, system prompts, and advanced reasoning tasks.",
    categories: ["AI", "Text Generation", "LLM"],
    tags: ["anthropic", "claude", "ai", "llm", "text", "reasoning", "analysis"],
    inputs: [
        { 
            name: "apiKey", 
            type: "string", 
            description: "Anthropic API key (use state variable for security)", 
            required: true, 
            example: "${anthropic_api_key}"
        },
        { 
            name: "prompt", 
            type: "string", 
            description: "The user prompt or question", 
            required: true, 
            example: "Analyze this code and suggest improvements"
        },
        { 
            name: "systemPrompt", 
            type: "string", 
            description: "System message to set Claude's behavior and context", 
            required: false, 
            example: "You are a helpful coding assistant focused on best practices and clean code."
        },
        { 
            name: "model", 
            type: "string", 
            description: "Claude model to use", 
            required: false, 
            defaultValue: "claude-3-sonnet-20240229",
            enum: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307", "claude-2.1", "claude-instant-1.2"],
            example: "claude-3-opus-20240229"
        },
        { 
            name: "maxTokens", 
            type: "number", 
            description: "Maximum tokens in the response", 
            required: false, 
            defaultValue: 1000,
            example: 2000,
            validation: {
                min: 1,
                max: 4096
            }
        },
        { 
            name: "temperature", 
            type: "number", 
            description: "Controls randomness (0-1). Lower is more focused, higher is more creative", 
            required: false, 
            defaultValue: 0.7,
            example: 0.5,
            validation: {
                min: 0,
                max: 1
            }
        },
        { 
            name: "messages", 
            type: "array", 
            description: "Previous conversation messages for context", 
            required: false, 
            example: [
                { "role": "user", "content": "What is recursion?" },
                { "role": "assistant", "content": "Recursion is a programming technique where a function calls itself..." }
            ]
        },
        { 
            name: "stopSequences", 
            type: "array", 
            description: "Sequences where the API will stop generating", 
            required: false, 
            example: ["\n\nHuman:", "\n\nAssistant:"]
        },
        { 
            name: "metadata", 
            type: "object", 
            description: "Additional metadata for the request", 
            required: false, 
            example: { "user_id": "12345" }
        }
    ],
    outputs: [
        { 
            name: "response", 
            type: "string", 
            description: "Claude's generated response text" 
        },
        { 
            name: "usage", 
            type: "object", 
            description: "Token usage information" 
        },
        { 
            name: "model", 
            type: "string", 
            description: "Model used for the completion" 
        },
        { 
            name: "stopReason", 
            type: "string", 
            description: "Reason the completion stopped" 
        },
        { 
            name: "messageId", 
            type: "string", 
            description: "Unique ID for this message" 
        }
    ],
    edges: [
        { 
            name: "success", 
            description: "Completion generated successfully", 
            outputType: "object" 
        },
        { 
            name: "error", 
            description: "Failed to generate completion", 
            outputType: "object" 
        }
    ],
    implementation: async function(params) {
        const { 
            apiKey, 
            prompt, 
            systemPrompt, 
            model = 'claude-3-sonnet-20240229',
            maxTokens = 1000,
            temperature = 0.7,
            messages = [],
            stopSequences,
            metadata
        } = params;
        
        try {
            // Validate API key
            if (!apiKey || apiKey.trim() === '') {
                throw new Error('Anthropic API key is required');
            }
            
            // Build messages array
            const allMessages = [];
            
            // Add previous messages if provided
            if (messages && messages.length > 0) {
                allMessages.push(...messages);
            }
            
            // Add current prompt
            allMessages.push({
                role: 'user',
                content: prompt
            });
            
            // Build request body
            const requestBody = {
                model,
                messages: allMessages,
                max_tokens: maxTokens,
                temperature
            };
            
            // Add system prompt if provided
            if (systemPrompt) {
                requestBody.system = systemPrompt;
            }
            
            // Add optional parameters
            if (stopSequences && stopSequences.length > 0) {
                requestBody.stop_sequences = stopSequences;
            }
            
            if (metadata) {
                requestBody.metadata = metadata;
            }
            
            // Log request details (without API key)
            if (this.flowInstanceId) {
                console.log(`[Flow ${this.flowInstanceId}] Anthropic request: model=${model}, messages=${allMessages.length}`);
            }
            
            // Make request to Anthropic API
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            // Check response status
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Anthropic API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }
            
            // Parse response
            const data = await response.json();
            
            // Extract response text
            let responseText = '';
            if (data.content && data.content.length > 0) {
                // Claude returns content as an array of content blocks
                responseText = data.content
                    .filter(block => block.type === 'text')
                    .map(block => block.text)
                    .join('\n');
            }
            
            // Store completion info in state
            this.state.set('lastClaudeCompletion', {
                model: data.model,
                messageId: data.id,
                timestamp: Date.now(),
                inputTokens: data.usage?.input_tokens || 0,
                outputTokens: data.usage?.output_tokens || 0
            });
            
            // Log completion
            if (this.flowInstanceId) {
                const totalTokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
                console.log(`[Flow ${this.flowInstanceId}] Claude completion: ${totalTokens} tokens used`);
            }
            
            return {
                success: () => ({
                    response: responseText,
                    usage: {
                        inputTokens: data.usage?.input_tokens || 0,
                        outputTokens: data.usage?.output_tokens || 0,
                        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
                    },
                    model: data.model,
                    stopReason: data.stop_reason,
                    messageId: data.id
                })
            };
            
        } catch (error) {
            console.error(`[Anthropic Claude Node] Error: ${error.message}`);
            
            return {
                error: () => ({
                    error: error.message,
                    model,
                    prompt: prompt.substring(0, 100) + '...' // Truncated for logging
                })
            };
        }
    },
    aiPromptHints: {
        toolName: "anthropic_claude",
        summary: "Generates text using Anthropic's Claude AI models",
        useCase: "Use for complex reasoning, code analysis, long-form content, detailed explanations, or tasks requiring nuanced understanding",
        expectedInputFormat: "Provide 'apiKey' (required), 'prompt' (required), optional 'systemPrompt', 'model', 'temperature', etc.",
        outputDescription: "Returns Claude's response text, token usage, and completion metadata via 'success' edge",
        examples: [
            "Analyze complex code structures",
            "Write detailed technical documentation",
            "Solve multi-step reasoning problems",
            "Generate comprehensive reports",
            "Provide nuanced explanations",
            "Review and critique content"
        ]
    }
};