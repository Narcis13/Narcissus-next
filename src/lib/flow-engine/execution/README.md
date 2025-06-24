# Flow Execution Engine

This directory contains the dual-mode execution engine for workflows, supporting both immediate (synchronous) and queued (asynchronous) execution modes.

## Overview

The execution engine automatically determines the best execution mode based on workflow complexity, or allows explicit mode selection. This ensures simple workflows run immediately for better UX, while complex workflows are queued to avoid timeouts and resource constraints.

## Architecture

### Core Components

1. **ExecutionManager** - Main entry point that selects and delegates to the appropriate strategy
2. **ExecutionStrategy** - Interface defining execution operations
3. **ImmediateExecutionStrategy** - Runs workflows synchronously in the API handler
4. **QueuedExecutionStrategy** - Queues workflows for background processing via BullMQ
5. **ComplexityAnalyzer** - Analyzes workflows to determine optimal execution mode
6. **ExecutionPersistence** - Handles database operations for execution tracking

### Execution Modes

#### Immediate Mode
- Runs directly in the API handler/server action
- Suitable for simple workflows (< 10 nodes, < 30s execution)
- Provides instant feedback
- Works well with Vercel's serverless environment

#### Queued Mode
- Uses BullMQ with Redis for job processing
- Suitable for complex workflows
- Handles long-running tasks, external API calls, loops
- Supports retry logic and error recovery
- Requires running the worker process

## Usage

### Starting a Workflow

```typescript
// API endpoint: POST /api/workflow/run
const response = await fetch('/api/workflow/run', {
  method: 'POST',
  body: JSON.stringify({
    workflow: workflowDefinition,
    mode: 'auto', // 'immediate', 'queued', or 'auto' (default)
    options: {
      timeout: 60000, // 1 minute
      priority: 1,
      tags: ['user-triggered']
    }
  })
});

const { executionId, status, complexity, mode } = await response.json();
```

### Checking Execution Status

```typescript
// GET /api/workflow/execution/{executionId}
const status = await fetch(`/api/workflow/execution/${executionId}`);
const result = await status.json();
```

### Real-time Updates

```typescript
// SSE endpoint for live updates
const eventSource = new EventSource(`/api/workflow/execution/${executionId}/stream`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
};
```

### Control Operations

```typescript
// Pause execution
await fetch(`/api/workflow/execution/${executionId}/pause`, { method: 'POST' });

// Resume execution
await fetch(`/api/workflow/execution/${executionId}/resume`, { method: 'POST' });

// Cancel execution
await fetch(`/api/workflow/execution/${executionId}`, { method: 'DELETE' });
```

## Running the Worker

For queued execution mode, you need to run the worker process:

```bash
# Development (with auto-reload)
npm run worker:dev

# Production
npm run worker
```

## Complexity Analysis

The system analyzes workflows based on:
- Node count
- Presence of external API calls
- Loop constructs
- Parallel execution paths
- Human input requirements
- Estimated execution duration

Workflows are automatically queued if they:
- Have more than 10 nodes
- Estimated duration > 30 seconds
- Require human input
- Have external calls combined with loops

## Database Schema

Execution tracking is stored in the `workflow_executions` table:
- `id` - Unique execution ID
- `workflowId` - Reference to the workflow
- `status` - pending, running, completed, failed, cancelled
- `executionMode` - immediate or queued
- `startedAt` - Execution start time
- `completedAt` - Execution end time
- `error` - Error message if failed
- `result` - Execution output and step details
- `metadata` - Additional execution metadata

## Environment Variables

```env
REDIS_URL=redis://localhost:6379  # Required for queued execution
DATABASE_URL=postgresql://...      # Required for persistence
```

## Error Handling

- Immediate mode: Errors are thrown and caught in the API handler
- Queued mode: Errors are stored in the job and database
- Both modes support timeout handling
- Failed executions can be retried (queued mode only)

## Future Enhancements

- WebSocket support for real-time updates
- Execution history and analytics
- Resource usage tracking
- Dynamic worker scaling
- Priority queue management