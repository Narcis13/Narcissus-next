import { FlowManager } from '../core/FlowManager.js';
import { NodeRegistry } from '../core/NodeRegistry.js';
import allNodes from '../nodes/index.js';

// Register all nodes
allNodes.forEach(node => NodeRegistry.register(node));

// Get the scope for FlowManager
const scope = NodeRegistry.getScope();

// Note: These are example workflows. In production, you would use real API keys
// stored securely in environment variables or state.

async function testOpenAICompletion() {
    console.log('\n=== Testing OpenAI Completion Node ===');
    
    const workflow = [
        // Set up mock data (in real usage, API key would come from secure storage)
        function() {
            this.state.set('openai_api_key', 'mock-api-key-for-testing');
            this.state.set('user_question', 'What is the capital of France?');
            return { ready: true };
        },
        // Simulate OpenAI completion (mock response for testing)
        function() {
            // In production, this would be the actual OpenAI node
            console.log("OpenAI Request:");
            console.log("- Model: gpt-3.5-turbo");
            console.log("- Prompt:", this.state.get('user_question'));
            
            // Simulate response
            const mockResponse = "The capital of France is Paris. Paris is not only the capital but also the largest city in France, known for its iconic landmarks such as the Eiffel Tower, Louvre Museum, and Notre-Dame Cathedral.";
            
            this.state.set('ai_response', mockResponse);
            
            return {
                response: mockResponse,
                usage: { promptTokens: 10, completionTokens: 35, totalTokens: 45 },
                model: 'gpt-3.5-turbo',
                finishReason: 'stop'
            };
        },
        // Parse the response
        { "ai.response.parser": {
            aiResponse: "${ai_response}",
            parseMode: "entities",
            config: {
                entityTypes: ["location", "organization"]
            }
        }},
        // Handle parsed results
        function() {
            console.log("\nParsed entities:", this.input.parsed);
            return this.input;
        }
    ];
    
    const fm = FlowManager({ nodes: workflow, scope });
    const result = await fm.run();
}

async function testClaudeCompletion() {
    console.log('\n=== Testing Anthropic Claude Node ===');
    
    const workflow = [
        // Set up mock data
        function() {
            this.state.set('anthropic_api_key', 'mock-api-key-for-testing');
            this.state.set('code_to_analyze', `
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}
            `);
            return { ready: true };
        },
        // Simulate Claude completion
        function() {
            console.log("Claude Request:");
            console.log("- Model: claude-3-sonnet-20240229");
            console.log("- System: You are a code review assistant");
            console.log("- Prompt: Analyze this code and suggest improvements");
            
            // Simulate response
            const mockResponse = `
The fibonacci function uses recursion but has exponential time complexity O(2^n). Here's the analysis:

**Issues:**
1. Inefficient due to repeated calculations
2. No input validation
3. Stack overflow risk for large n

**Improved version:**
\`\`\`javascript
function fibonacci(n) {
    if (n < 0) throw new Error('Input must be non-negative');
    if (n <= 1) return n;
    
    let prev = 0, curr = 1;
    for (let i = 2; i <= n; i++) {
        [prev, curr] = [curr, prev + curr];
    }
    return curr;
}
\`\`\`

This iterative approach has O(n) time complexity and O(1) space complexity.`;
            
            this.state.set('claude_response', mockResponse);
            
            return {
                response: mockResponse,
                usage: { inputTokens: 50, outputTokens: 120, totalTokens: 170 },
                model: 'claude-3-sonnet-20240229',
                stopReason: 'end_turn'
            };
        },
        // Parse JSON from the response
        { "ai.response.parser": {
            aiResponse: "${claude_response}",
            parseMode: "custom",
            config: {
                customPattern: "```javascript([^`]+)```",
                customFlags: "g"
            }
        }},
        // Handle parsed code
        function() {
            console.log("\nExtracted code blocks:", this.input.parsed.matches.length);
            if (this.input.parsed.matches.length > 0) {
                console.log("Improved code:", this.input.parsed.matches[0].groups[0].trim());
            }
            return this.input;
        }
    ];
    
    const fm = FlowManager({ nodes: workflow, scope });
    const result = await fm.run();
}

async function testAIResponseParsing() {
    console.log('\n=== Testing AI Response Parser ===');
    
    const workflow = [
        // Test JSON parsing
        function() {
            const aiResponse = `
Based on the analysis, here's the data you requested:

\`\`\`json
{
  "sentiment": "positive",
  "score": 0.85,
  "categories": ["technology", "innovation"],
  "entities": [
    {"type": "company", "name": "OpenAI"},
    {"type": "product", "name": "GPT-4"}
  ]
}
\`\`\`

The overall sentiment is positive with high confidence.`;
            
            this.state.set('json_response', aiResponse);
            console.log("Testing JSON extraction from AI response...");
            return aiResponse;
        },
        { "ai.response.parser": {
            aiResponse: "${json_response}",
            parseMode: "json"
        }},
        function() {
            console.log("Extracted JSON:", JSON.stringify(this.input.parsed, null, 2));
            return this.input;
        },
        
        // Test sentiment parsing
        function() {
            const sentimentResponse = "After analyzing the customer feedback, the sentiment is clearly negative. The user expressed dissatisfaction with the service and mentioned several issues.";
            this.state.set('sentiment_response', sentimentResponse);
            console.log("\nTesting sentiment extraction...");
            return sentimentResponse;
        },
        { "ai.response.parser": {
            aiResponse: "${sentiment_response}",
            parseMode: "sentiment"
        }},
        function() {
            console.log("Detected sentiment:", this.input.parsed);
            return this.input;
        },
        
        // Test structured data parsing
        function() {
            const structuredResponse = `
User Profile Analysis:
name: John Doe
age: 28
location: San Francisco
interests: machine learning, robotics, AI
verified: true
`;
            this.state.set('structured_response', structuredResponse);
            console.log("\nTesting structured data extraction...");
            return structuredResponse;
        },
        { "ai.response.parser": {
            aiResponse: "${structured_response}",
            parseMode: "structured",
            config: {
                structuredSchema: {
                    name: "string",
                    age: "number",
                    location: "string",
                    interests: "array",
                    verified: "boolean"
                }
            }
        }},
        function() {
            console.log("Extracted structured data:", this.input.parsed);
            return this.input;
        }
    ];
    
    const fm = FlowManager({ nodes: workflow, scope });
    const result = await fm.run();
}

async function testAIWorkflowIntegration() {
    console.log('\n=== Testing Complete AI Workflow ===');
    
    const workflow = [
        // Initial setup
        function() {
            console.log("Simulating AI-powered content analysis workflow...\n");
            
            const userContent = "I just visited Paris and it was amazing! The Eiffel Tower at sunset was breathtaking. Definitely recommend visiting in Spring.";
            this.state.set('user_content', userContent);
            
            console.log("User content:", userContent);
            return userContent;
        },
        
        // Simulate AI analysis
        function() {
            // In production, this would call OpenAI or Claude
            const aiAnalysis = `
Analysis of the user's travel experience:

{
  "sentiment": "positive",
  "score": 0.92,
  "locations": ["Paris", "Eiffel Tower"],
  "season": "Spring",
  "recommendation": true,
  "keywords": ["amazing", "breathtaking", "recommend"]
}

The user had a highly positive experience in Paris, particularly enjoying the Eiffel Tower at sunset. They recommend visiting during Spring season.`;
            
            this.state.set('ai_analysis', aiAnalysis);
            console.log("\nAI Analysis complete");
            return aiAnalysis;
        },
        
        // Parse the AI response
        { "ai.response.parser": {
            aiResponse: "${ai_analysis}",
            parseMode: "json"
        }},
        
        // Process the parsed data
        function() {
            const analysis = this.input.parsed;
            console.log("\nExtracted analysis:");
            console.log("- Sentiment:", analysis.sentiment, `(${(analysis.score * 100).toFixed(0)}%)`);
            console.log("- Locations:", analysis.locations.join(", "));
            console.log("- Best season:", analysis.season);
            console.log("- Recommends:", analysis.recommendation ? "Yes" : "No");
            
            // Make decision based on sentiment
            if (analysis.score > 0.8) {
                this.state.set('action', 'share_positive_review');
                return "positive_flow";
            } else if (analysis.score < 0.3) {
                this.state.set('action', 'flag_for_support');
                return "negative_flow";
            } else {
                this.state.set('action', 'neutral_response');
                return "neutral_flow";
            }
        },
        
        // Branch based on sentiment
        {
            "positive_flow": function() {
                console.log("\n✅ Action: Share as positive testimonial");
                return { status: "shared", type: "testimonial" };
            },
            "negative_flow": function() {
                console.log("\n⚠️ Action: Flag for customer support");
                return { status: "flagged", type: "support" };
            },
            "neutral_flow": function() {
                console.log("\nℹ️ Action: Standard response");
                return { status: "processed", type: "standard" };
            }
        }
    ];
    
    const fm = FlowManager({ nodes: workflow, scope });
    const result = await fm.run();
}

// Run all tests
async function runTests() {
    await testOpenAICompletion();
    await testClaudeCompletion();
    await testAIResponseParsing();
    await testAIWorkflowIntegration();
    
    console.log('\n=== All AI node tests completed ===');
}

// Execute tests
runTests().catch(console.error);