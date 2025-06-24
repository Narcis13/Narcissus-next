/** @type {import('../../types/flow-types.jsdoc.js').NodeDefinition} */
export default {
    id: "ai.openai.completion",
    version: "1.0.0",
    name: "OpenAI Completion",
    description: "Generates text completions using OpenAI's GPT models. Supports chat completions, system prompts, and various model parameters.",
    categories: ["AI", "Text Generation", "LLM"],
    tags: ["openai", "gpt", "chatgpt", "completion", "ai", "llm", "text"],
    inputs: [
        { 
            name: "apiKey", 
            type: "string", 
            description: "OpenAI API key (use state variable for security)", 
            required: true, 
            example: "${openai_api_key}"
        },
        { 
            name: "prompt", 
            type: "string", 
            description: "The user prompt or question", 
            required: true, 
            example: "Explain quantum computing in simple terms"
        },
        { 
            name: "systemPrompt", 
            type: "string", 
            description: "System message to set the assistant's behavior", 
            required: false, 
            example: "You are a helpful assistant that explains complex topics simply."
        },
        { 
            name: "model", 
            type: "string", 
            description: "OpenAI model to use", 
            required: false, 
            defaultValue: "gpt-3.5-turbo",
            enum: ["gpt-4", "gpt-4-turbo-preview", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"],
            example: "gpt-4"
        },
        { 
            name: "temperature", 
            type: "number", 
            description: "Controls randomness (0-2). Lower is more focused, higher is more creative", 
            required: false, 
            defaultValue: 0.7,
            example: 0.7,
            validation: {
                min: 0,
                max: 2
            }
        },
        { 
            name: "maxTokens", 
            type: "number", 
            description: "Maximum tokens in the response", 
            required: false, 
            defaultValue: 1000,
            example: 500
        },
        { 
            name: "messages", 
            type: "array", 
            description: "Previous conversation messages for context", 
            required: false, 
            example: [
                { "role": "user", "content": "Hello" },
                { "role": "assistant", "content": "Hi! How can I help?" }
            ]
        },
        { 
            name: "responseFormat", 
            type: "object", 
            description: "Specify response format (e.g., JSON mode)", 
            required: false, 
            example: { "type": "json_object" }
        },
        { 
            name: "tools", 
            type: "array", 
            description: "Function calling tools (for compatible models)", 
            required: false
        }
    ],
    outputs: [
        { 
            name: "response", 
            type: "string", 
            description: "The AI-generated response text" 
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
            name: "finishReason", 
            type: "string", 
            description: "Reason the completion finished" 
        },
        { 
            name: "toolCalls", 
            type: "array", 
            description: "Function calls made by the model (if any)" 
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
            model = 'gpt-3.5-turbo',
            temperature = 0.7,
            maxTokens = 1000,
            messages = [],
            responseFormat,
            tools
        } = params;
        
        try {
            // Validate API key
            if (!apiKey || apiKey.trim() === '') {
                throw new Error('OpenAI API key is required');
            }
            
            // Build messages array
            const allMessages = [];
            
            // Add system prompt if provided
            if (systemPrompt) {
                allMessages.push({
                    role: 'system',
                    content: systemPrompt
                });
            }
            
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
                temperature,
                max_tokens: maxTokens
            };
            
            // Add optional parameters
            if (responseFormat) {
                requestBody.response_format = responseFormat;
            }
            
            if (tools && tools.length > 0) {
                requestBody.tools = tools;
                requestBody.tool_choice = 'auto';
            }
            
            // Log request details (without API key)
            if (this.flowInstanceId) {
                console.log(`[Flow ${this.flowInstanceId}] OpenAI request: model=${model}, messages=${allMessages.length}`);
            }
            
            // Make request to OpenAI API
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            // Check response status
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }
            
            // Parse response
            const data = await response.json();
            
            // Extract completion data
            const choice = data.choices[0];
            const responseText = choice.message.content;
            const finishReason = choice.finish_reason;
            const toolCalls = choice.message.tool_calls;
            
            // Store completion info in state
            this.state.set('lastOpenAICompletion', {
                model: data.model,
                timestamp: Date.now(),
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens
            });
            
            // Log completion
            if (this.flowInstanceId) {
                console.log(`[Flow ${this.flowInstanceId}] OpenAI completion: ${data.usage.total_tokens} tokens used`);
            }
            
            return {
                success: () => ({
                    response: responseText,
                    usage: {
                        promptTokens: data.usage.prompt_tokens,
                        completionTokens: data.usage.completion_tokens,
                        totalTokens: data.usage.total_tokens
                    },
                    model: data.model,
                    finishReason,
                    toolCalls: toolCalls || []
                })
            };
            
        } catch (error) {
            console.error(`[OpenAI Completion Node] Error: ${error.message}`);
            
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
        toolName: "openai_completion",
        summary: "Generates text using OpenAI's GPT models",
        useCase: "Use for text generation, question answering, content creation, code generation, or any task requiring AI language understanding",
        expectedInputFormat: "Provide 'apiKey' (required), 'prompt' (required), optional 'systemPrompt', 'model', 'temperature', etc.",
        outputDescription: "Returns generated text response, token usage, and model info via 'success' edge",
        examples: [
            "Generate blog post content",
            "Answer customer questions",
            "Summarize long documents",
            "Generate code snippets",
            "Creative writing assistance",
            "Language translation"
        ]
    }
};