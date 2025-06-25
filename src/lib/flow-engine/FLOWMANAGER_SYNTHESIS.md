# FlowManager System Synthesis

## Overview

The FlowManager is a powerful and flexible engine for orchestrating complex workflows, designed specifically for AI agentic systems. It executes workflows defined as serializable JSON-like structures, enabling dynamic generation, persistence, and execution of directed graphs of tasks and decisions.

## Core Components

### 1. FlowManager (`FlowManager.js`) file location: /src/lib/flow-engine/core/FlowManager.js
- **Purpose**: Main orchestration engine for workflow execution
- **Key Features**:
  - Executes nodes in sequence based on workflow definition
  - Manages state through StateManager
  - Provides execution context to each node
  - Handles complex control flow (loops, branches, sub-flows)
  - Emits events for monitoring and debugging

### 2. FlowHub (`FlowHub.js`) file location: /src/lib/flow-engine/core/FlowHub.js
- **Purpose**: Singleton event manager for cross-flow communication
- **Key Features**:
  - Handles pause/resume operations for human-in-the-loop workflows
  - Custom event bus for environment-agnostic operation
  - Manages flow events (start, step, end, pause, resume)
  - Enables cross-context communication between flows

### 3. NodeRegistry (`NodeRegistry.js`) file location: /src/lib/flow-engine/core/NodeRegistry.js
- **Purpose**: Central registry for all available node definitions
- **Key Features**:
  - Node registration and retrieval
  - Search functionality (by text, categories, tags, inputs/outputs)
  - Scope generation for FlowManager execution
  - AI-friendly discovery through search criteria

## Node System

### Node Definition Structure
```javascript
{
  id: "category.type.action",           // Unique identifier
  version: "1.0.0",                     // Semantic version
  name: "Human Readable Name",          // Display name
  description: "What this node does",   // Detailed description
  categories: ["Category1", "Category2"], // For organization
  tags: ["tag1", "tag2"],              // For search
  inputs: [                            // Input parameters
    {
      name: "paramName",
      type: "string|number|boolean|any",
      description: "Parameter description",
      required: true,
      example: "example value"
    }
  ],
  outputs: [                           // Output values
    {
      name: "outputName",
      type: "string|number|boolean|any",
      description: "Output description"
    }
  ],
  edges: [                             // Branching paths
    {
      name: "success",
      description: "When operation succeeds",
      outputType: "string"
    }
  ],
  implementation: async function(params) {
    // Node logic here
    // Access to: this.state, this.input, this.steps, etc.
    return { success: () => "result" }; // Return edges
  },
  aiPromptHints: {                     // AI discovery hints
    toolName: "tool_name",
    summary: "Brief summary",
    useCase: "When to use this",
    expectedInputFormat: "Input format",
    outputDescription: "Output format"
  }
}
```

### Node Implementation Function

The `implementation` function receives:
- **Parameters**: Input values as defined in `inputs`
- **Context (`this`)**: Execution context containing:
  - `state`: StateManager for workflow state
  - `input`: Output from previous node
  - `steps`: Execution history
  - `nodes`: All workflow nodes
  - `self`: Current node definition
  - `flowInstanceId`: Unique flow instance ID
  - `humanInput(details, customPauseId)`: Request human input
  - `emit(eventName, data)`: Emit custom events
  - `on(eventName, callback)`: Listen for events

### Return Value Patterns

1. **Simple String**: Edge name
   ```javascript
   return "success"; // -> { edges: ["success"], results: ["success"] }
   ```

2. **Object with Edge Functions**: Multiple edges with computed results
   ```javascript
   return {
     success: () => computedValue,
     error: () => errorDetails
   };
   // -> { edges: ["success", "error"], results: [computedValue, errorDetails] }
   ```

3. **Standard Output Format**: Direct edge and result specification
   ```javascript
   return {
     edges: ["success"],
     results: [{ data: processedData }]
   };
   ```

4. **Array or Object**: Wrapped as single result
   ```javascript
   return { data: "value" }; // -> { edges: ["pass"], results: [{ data: "value" }] }
   ```

## Flow Control Structures

### 1. Sequential Execution
```javascript
nodes: [
  "node1",
  "node2",
  "node3"
]
```

### 2. Loops
```javascript
nodes: [
  [[controller, action1, action2]] // Double array for loops
]
```
- Controller determines continuation (return "exit" to break)
- Actions execute after controller
- Max 100 iterations safety limit

### 3. Conditional Branching
```javascript
nodes: [
  nodeReturningEdges,
  {
    "success": successNode,
    "error": errorNode,
    "retry": retryNode
  }
]
```
- Previous node's edges determine which branch executes
- Only first matching edge is executed

### 4. Sub-flows
```javascript
nodes: [
  [subNode1, subNode2, subNode3] // Single array for sub-flow
]
```
- Executes as isolated FlowManager instance
- State changes propagate back to parent

### 5. Parameterized Calls
```javascript
nodes: [
  { "nodeName": { param1: "value1", param2: "${state.value}" } }
]
```
- Single key object with parameters
- Supports state placeholders `${path.to.value}`

## State Management

### StateManager Features
- **Get/Set**: Access and modify state by path
- **History**: Undo/redo support
- **Deep Paths**: Nested object support (`user.profile.name`)
- **State Placeholders**: `${state.path}` in node parameters
- **Array Access**: `${items[0].name}` notation

### State Operations
```javascript
this.state.set('key', value);        // Set value
this.state.get('key');               // Get value
this.state.set('nested.path', value); // Nested set
this.state.undo();                   // Undo last change
this.state.redo();                   // Redo change
this.state.getState();               // Get full state
```

## Event System

### FlowManager Events
- `flowManagerStart`: Flow execution begins
- `flowManagerStep`: Each node execution completes
- `flowManagerEnd`: Flow execution completes
- `flowManagerNodeEvent`: Custom node events

### Event Data Structure
```javascript
{
  flowInstanceId: "fm-123456-abc",
  stepIndex: 2,
  stepData: { /* step details */ },
  currentState: { /* state snapshot */ }
}
```

## Best Practices

### 1. Node Design
- Keep nodes focused on single responsibility
- Use descriptive IDs following pattern: `category.type.action`
- Provide comprehensive AI hints for discovery
- Always include examples in input/output definitions

### 2. Error Handling
- Return error edges for failure cases
- Include detailed error information in results
- Use try-catch in implementation functions

### 3. State Management
- Namespace state keys to avoid conflicts
- Use deep paths for complex data structures
- Consider state size for performance

### 4. Performance
- Avoid blocking operations in nodes
- Use async/await properly
- Be mindful of loop iteration limits

### 5. Testing
- Test nodes in isolation
- Test complex workflows with mock nodes
- Verify state changes and edge cases

## Integration with Existing System

### Current Implementation Details
- Uses CommonJS modules (not ES6)
- Node definitions use `.node.js` extension
- Auto-generated indexes via `generate-indexes.mjs`
- Supports both programmatic and JSON workflow definitions
- Compatible with serverless environments

### Key Differences from TypeScript Implementation
1. **Function Name**: `implementation` not `execute`
2. **Return Pattern**: Must return edges (string or object with edge functions)
3. **Context Access**: Via `this` in implementation function
4. **Node Registration**: Through NodeRegistry, not decorators
5. **Module System**: CommonJS exports, not ES6/TypeScript

## Example Node Implementation

```javascript
export default {
  id: "data.transform.uppercase",
  version: "1.0.0",
  name: "Uppercase Transform",
  description: "Converts text to uppercase",
  categories: ["Data", "Text"],
  tags: ["transform", "string", "text"],
  inputs: [
    {
      name: "text",
      type: "string",
      description: "Text to transform",
      required: true,
      example: "hello world"
    }
  ],
  outputs: [
    {
      name: "result",
      type: "string",
      description: "Uppercase text"
    }
  ],
  edges: [
    {
      name: "success",
      description: "Transformation successful",
      outputType: "string"
    }
  ],
  implementation: async function(params) {
    const result = (params.text || "").toUpperCase();
    this.state.set('lastTransformed', result);
    
    // Return edge function
    return {
      success: () => result
    };
  },
  aiPromptHints: {
    toolName: "uppercase_text",
    summary: "Converts text to all capitals",
    useCase: "Use when you need to standardize text to uppercase",
    expectedInputFormat: "Provide 'text' parameter as string",
    outputDescription: "Returns uppercase version via 'success' edge"
  }
};
```

## Summary

The FlowManager system provides a robust foundation for building AI-friendly workflows with:
- Flexible node-based architecture
- Rich execution context
- Complex flow control (loops, branches, sub-flows)
- State management with history
- Event-driven architecture
- Human-in-the-loop support
- AI-optimized node discovery

When implementing new nodes, follow the existing patterns and ensure compatibility with the FlowManager's execution model.