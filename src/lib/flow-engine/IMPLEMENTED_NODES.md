# Implemented Flow Engine Nodes

## Logic Nodes

### 1. Conditional Branch (`logic.condition.if`)
- **Purpose**: Evaluates conditions and branches workflow execution
- **Location**: `/src/lib/flow-engine/nodes/logic/conditional.node.js`
- **Features**:
  - Multiple comparison operators: `==`, `!=`, `>`, `<`, `>=`, `<=`, `contains`, `startsWith`, `endsWith`, `isEmpty`, `isNotEmpty`
  - Returns `true` or `false` edges based on evaluation
  - Supports any data type for comparison
  - Stores result in state as `lastConditionResult`

### 2. Delay Execution (`logic.control.delay`)
- **Purpose**: Pauses workflow execution for specified duration
- **Location**: `/src/lib/flow-engine/nodes/logic/delay.node.js`
- **Features**:
  - Configurable delay duration (0-300000ms / 5 minutes max)
  - Pass-through data support
  - Returns actual duration waited
  - Stores delay info in state

### 3. Loop Controller (`logic.control.loop`)
- **Purpose**: Controls loop iterations in workflows
- **Location**: `/src/lib/flow-engine/nodes/logic/loop-controller.node.js`
- **Features**:
  - Three modes: `count` (fixed iterations), `condition` (while loop), `array` (foreach)
  - Safety limit of 1000 iterations max
  - Maintains loop state across iterations
  - Returns `continue` or `exit` edges

## Data Nodes

### 4. Data Transform (`data.transform.mapper`)
- **Purpose**: Transforms data using various operations
- **Location**: `/src/lib/flow-engine/nodes/data/transform.node.js`
- **Operations**:
  - `extract`: Extract value from object path
  - `map`: Transform array elements
  - `filter`: Filter array based on conditions
  - `reduce`: Reduce array to single value (sum, count, concat)
  - `custom`: Apply custom template transformations
- **Features**:
  - Path notation support (e.g., `user.profile.name`)
  - Array index support (e.g., `items[0].name`)
  - Simple expression evaluation for map/filter
  - Template-based transformations

### 5. Merge Data (`data.combine.merge`)
- **Purpose**: Merges multiple data sources
- **Location**: `/src/lib/flow-engine/nodes/data/merge.node.js`
- **Strategies**:
  - `shallow`: Simple object spread
  - `deep`: Recursive deep merge
  - `concat`: Array concatenation
  - `combine`: Structured output with named sources
- **Features**:
  - Conflict resolution options: `overwrite`, `preserve`, `array`, `error`
  - Support for multiple additional sources
  - Detailed merge information in output

## Integration Nodes

### 6. HTTP Request (`integration.http.request`)
- **Purpose**: Makes HTTP/HTTPS requests to external APIs and services
- **Location**: `/src/lib/flow-engine/nodes/integration/http-request.node.js`
- **Features**:
  - All HTTP methods: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
  - Automatic JSON serialization for request bodies
  - Query parameter support
  - Custom headers and authentication (Bearer, Basic, API Key)
  - Timeout control (up to 30 seconds)
  - Multiple response types: json, text, buffer, stream
  - Returns `success` edge for 2xx status, `error` edge for others

### 7. Webhook Trigger (`integration.webhook.trigger`)
- **Purpose**: Receives and processes incoming webhook requests
- **Location**: `/src/lib/flow-engine/nodes/integration/webhook-trigger.node.js`
- **Features**:
  - Validates incoming webhooks (method, token)
  - Extracts data from headers, body, and query parameters
  - Normalizes headers to lowercase
  - Configurable validation rules
  - Metadata collection (timestamp, IP, user agent)
  - Returns `valid`, `invalid`, or `error` edges

### 8. Webhook Response (`integration.webhook.response`)
- **Purpose**: Constructs HTTP responses for webhook requests
- **Location**: `/src/lib/flow-engine/nodes/integration/webhook-response.node.js`
- **Features**:
  - Configurable status codes (100-599)
  - Multiple response types: json, text, html, empty
  - Custom response headers
  - Optional response delay (up to 5 seconds)
  - Automatic Content-Type and Content-Length headers
  - Processing time tracking when used with webhook trigger

## AI Nodes

### 9. OpenAI Completion (`ai.openai.completion`)
- **Purpose**: Generates text completions using OpenAI's GPT models
- **Location**: `/src/lib/flow-engine/nodes/ai/openai-completion.node.js`
- **Features**:
  - Support for all GPT models (GPT-4, GPT-3.5-turbo)
  - System prompts for behavior control
  - Conversation history support
  - Temperature and max tokens control
  - JSON response format option
  - Function calling support (tools)
  - Returns `success` or `error` edges

### 10. Anthropic Claude (`ai.anthropic.claude`)
- **Purpose**: Generates text using Anthropic's Claude AI models
- **Location**: `/src/lib/flow-engine/nodes/ai/anthropic-claude.node.js`
- **Features**:
  - Support for all Claude models (Opus, Sonnet, Haiku)
  - System prompts for context setting
  - Conversation memory
  - Temperature control (0-1)
  - Stop sequences support
  - Metadata tracking
  - Returns `success` or `error` edges

### 11. AI Response Parser (`ai.response.parser`)
- **Purpose**: Extracts structured data from AI responses
- **Location**: `/src/lib/flow-engine/nodes/ai/ai-response-parser.node.js`
- **Parse Modes**:
  - `json`: Extract JSON from text
  - `sentiment`: Analyze sentiment (positive/negative/neutral)
  - `entities`: Extract entities (person, location, date, etc.)
  - `classification`: Classify content by categories
  - `structured`: Extract based on schema
  - `custom`: Custom regex patterns
- **Features**:
  - Fallback value support
  - Strict mode option
  - Returns `success`, `partial`, or `error` edges

## Usage Examples

### Conditional Branching
```javascript
const workflow = [
    { "logic.condition.if": { 
        value: "${temperature}", 
        operator: ">", 
        compareValue: 30 
    }},
    {
        "true": processHighTemperature,
        "false": processNormalTemperature
    }
];
```

### Loop with Counter
```javascript
const workflow = [
    [[
        { "logic.control.loop": { mode: "count", maxIterations: 5 }},
        processItem
    ]]
];
```

### Data Transformation
```javascript
const workflow = [
    { "data.transform.mapper": {
        data: "${users}",
        operation: "map",
        config: { path: "email" }
    }}
];
```

### Data Merging
```javascript
const workflow = [
    { "data.combine.merge": {
        source1: "${userProfile}",
        source2: "${userSettings}",
        strategy: "deep",
        conflictResolution: "overwrite"
    }}
];
```

### Delayed Execution
```javascript
const workflow = [
    { "logic.control.delay": { 
        duration: 2000,
        passThrough: { status: "waiting" }
    }}
];
```

### HTTP Request
```javascript
const workflow = [
    { "integration.http.request": {
        url: "https://api.example.com/users",
        method: "POST",
        headers: { "Authorization": "Bearer ${api_token}" },
        body: { name: "John", email: "john@example.com" }
    }},
    {
        "success": processResponse,
        "error": handleError
    }
];
```

### Webhook Processing
```javascript
const workflow = [
    { "integration.webhook.trigger": {
        webhookData: "${incoming_webhook}",
        validationConfig: {
            requireToken: true,
            tokenLocation: "header",
            tokenField: "X-Webhook-Secret",
            expectedToken: "${webhook_secret}"
        }
    }},
    {
        "valid": [
            processWebhookData,
            { "integration.webhook.response": {
                statusCode: 200,
                body: { status: "processed", id: "${processedId}" }
            }}
        ],
        "invalid": { "integration.webhook.response": {
            statusCode: 401,
            body: { error: "Invalid webhook token" }
        }}
    }
];
```

### OpenAI Text Generation
```javascript
const workflow = [
    { "ai.openai.completion": {
        apiKey: "${openai_api_key}",
        prompt: "Explain quantum computing in simple terms",
        systemPrompt: "You are a helpful teacher who explains complex topics simply",
        model: "gpt-4",
        temperature: 0.7,
        maxTokens: 500
    }},
    {
        "success": function() {
            console.log("AI Response:", this.input.response);
            console.log("Tokens used:", this.input.usage.totalTokens);
            return this.input.response;
        },
        "error": handleAIError
    }
];
```

### Claude Analysis with Response Parsing
```javascript
const workflow = [
    // Get Claude to analyze data
    { "ai.anthropic.claude": {
        apiKey: "${anthropic_api_key}",
        prompt: "Analyze this customer feedback and provide a JSON summary",
        systemPrompt: "You are a data analyst. Always return analysis as valid JSON.",
        model: "claude-3-opus-20240229",
        maxTokens: 1000
    }},
    {
        "success": [
            // Parse the JSON from Claude's response
            { "ai.response.parser": {
                aiResponse: "${response}",
                parseMode: "json",
                fallbackValue: { error: "Failed to parse" }
            }},
            {
                "success": processAnalysis,
                "partial": handlePartialData
            }
        ]
    }
];
```

### AI-Powered Content Classification
```javascript
const workflow = [
    // Set content to analyze
    function() {
        this.state.set('content', 'Your article text here...');
        return this.state.get('content');
    },
    // Get AI to analyze
    { "ai.openai.completion": {
        apiKey: "${openai_api_key}",
        prompt: "Classify this content and identify key entities: ${content}",
        model: "gpt-3.5-turbo"
    }},
    // Parse multiple aspects of the response
    {
        "success": [
            // Extract entities
            { "ai.response.parser": {
                aiResponse: "${response}",
                parseMode: "entities",
                config: { entityTypes: ["person", "organization", "location"] }
            }},
            function() {
                this.state.set('entities', this.input.parsed.entities);
                return this.state.get('response');
            },
            // Analyze sentiment
            { "ai.response.parser": {
                aiResponse: "${response}",
                parseMode: "sentiment"
            }},
            function() {
                this.state.set('sentiment', this.input.parsed.sentiment);
                return {
                    entities: this.state.get('entities'),
                    sentiment: this.input.parsed
                };
            }
        ]
    }
];
```

## Key Design Principles

1. **FlowManager Compatible**: All nodes follow the implementation pattern expected by FlowManager
2. **Edge-Based Flow Control**: Nodes return edges that determine workflow branching
3. **State Integration**: Nodes can read/write to workflow state using `this.state`
4. **Input Propagation**: Nodes receive previous node's output via `this.input`
5. **AI-Friendly**: Comprehensive metadata and hints for AI discovery and usage
6. **Error Handling**: Graceful error handling with error edges when appropriate
7. **Parameterized Calls**: Support for state placeholders using `${path.to.value}` notation

## Testing

Run the test file to see all nodes in action:
```bash
node src/lib/flow-engine/examples/test-new-nodes.js
```

## Utility Nodes

### 12. Send Email (`utility.email.send`)
- **Purpose**: Sends emails using the Resend API
- **Location**: `/src/lib/flow-engine/nodes/utility/email-send.node.js`
- **Features**:
  - HTML and plain text content support
  - Multiple recipients (to, cc, bcc)
  - File attachments (base64 encoded)
  - Custom headers and tags
  - Reply-to address configuration
  - Detailed send confirmation
  - Returns `sent` or `error` edges

### 13. Database Query (`utility.database.query`)
- **Purpose**: Executes PostgreSQL queries with full feature support
- **Location**: `/src/lib/flow-engine/nodes/utility/database-query.node.js`
- **Features**:
  - All query types: SELECT, INSERT, UPDATE, DELETE, raw SQL
  - Parameterized queries for SQL injection prevention
  - Transaction support with automatic rollback
  - Connection pooling configuration
  - Query timeout control
  - Returns rows, rowCount, fields metadata
  - PostgreSQL error code handling
  - Returns `success` or `error` edges

### 14. Enhanced Debug (`utility.debug.enhanced`)
- **Purpose**: Advanced debugging with multiple modes and features
- **Location**: `/src/lib/flow-engine/nodes/utility/debug.node.js`
- **Debug Modes**:
  - `log`: Standard logging with formatting
  - `inspect`: Deep object inspection
  - `breakpoint`: Simulated breakpoints
  - `trace`: Stack trace capture
  - `performance`: Execution timing
  - `memory`: Memory usage stats
- **Features**:
  - Conditional debugging based on state values
  - Multiple output formats (pretty, json, compact, table)
  - State snapshot capture
  - Debug history tracking
  - Context information inclusion
  - Returns `continue` or `break` edges

## Usage Examples

### Email Sending
```javascript
const workflow = [
    { "utility.email.send": {
        apiKey: "${resend_api_key}",
        from: "noreply@example.com",
        to: ["user@example.com", "admin@example.com"],
        subject: "Order Confirmation",
        html: "<h1>Thank you for your order!</h1>",
        text: "Thank you for your order!",
        attachments: [{
            filename: "invoice.pdf",
            content: "base64_encoded_pdf_content"
        }]
    }},
    {
        "sent": handleEmailSent,
        "error": handleEmailError
    }
];
```

### Database Operations
```javascript
const workflow = [
    // Transaction with multiple queries
    { "utility.database.query": {
        connectionString: "${database_url}",
        query: "INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING id",
        params: [userId, orderTotal],
        queryType: "insert",
        transaction: true
    }},
    {
        "success": function() {
            const orderId = this.input.insertedId;
            this.state.set('orderId', orderId);
            return orderId;
        }
    },
    // Query with joins
    { "utility.database.query": {
        connectionString: "${database_url}",
        query: `
            SELECT u.name, u.email, COUNT(o.id) as order_count
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            WHERE u.created_at > $1
            GROUP BY u.id
            HAVING COUNT(o.id) > $2
        `,
        params: [startDate, minOrders],
        queryType: "select"
    }}
];
```

### Advanced Debugging
```javascript
const workflow = [
    // Conditional debug for specific users
    { "utility.debug.enhanced": {
        data: "${userData}",
        label: "Premium User Activity",
        mode: "inspect",
        conditions: { 
            path: "userData.subscription", 
            operator: "==", 
            value: "premium" 
        },
        capture: ["userData.id", "userData.lastActivity"],
        includeContext: true
    }},
    // Performance monitoring
    { "utility.debug.enhanced": {
        label: "API Call Performance",
        mode: "performance",
        data: { endpoint: "/api/users", responseTime: 234 }
    }},
    // Breakpoint for debugging
    { "utility.debug.enhanced": {
        data: "${criticalState}",
        label: "Before Critical Operation",
        mode: "breakpoint",
        level: "warn"
    }},
    {
        "break": pauseForInspection,
        "continue": proceedWithOperation
    }
];
```

## Testing

Run the test files to see nodes in action:
```bash
# Test logic and data nodes
node src/lib/flow-engine/examples/test-new-nodes.js

# Test integration nodes
node src/lib/flow-engine/examples/test-integration-nodes.js

# Test AI nodes
node src/lib/flow-engine/examples/test-ai-nodes.js

# Test utility nodes
node src/lib/flow-engine/examples/test-utility-nodes.js
```

## Next Steps

Additional nodes to implement:
- More data transformation nodes (JSONPath, regex, etc.)
- Advanced integration nodes (GraphQL, WebSocket, SSE)
- Storage nodes (file system, cloud storage)
- Notification nodes (SMS, push notifications)
- Workflow control nodes (parallel execution, dynamic routing)