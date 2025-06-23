import { Workflow, NodeDefinition } from "../types";
import { WorkflowValidator } from "../validation";

/**
 * Example node definitions
 */
const exampleNodeDefinitions: NodeDefinition[] = [
  {
    id: "logic.condition.if",
    version: "1.0.0",
    name: "If Condition",
    description: "Conditional branching based on input value",
    categories: ["logic"],
    tags: ["condition", "branch", "if"],
    inputs: [
      {
        name: "condition",
        type: "boolean",
        description: "Condition to evaluate",
        required: true,
        example: true,
      },
      {
        name: "value",
        type: "any",
        description: "Value to pass through",
        required: false,
      },
    ],
    outputs: [
      {
        name: "result",
        type: "any",
        description: "The input value passed through",
      },
    ],
    edges: [
      {
        name: "true",
        description: "Path when condition is true",
        outputType: "any",
      },
      {
        name: "false",
        description: "Path when condition is false",
        outputType: "any",
      },
    ],
    implementation: async ({ inputs }) => {
      return {
        outputs: { result: inputs.value },
        edge: inputs.condition ? "true" : "false",
      };
    },
  },
  {
    id: "data.transform.uppercase",
    version: "1.0.0",
    name: "Uppercase",
    description: "Convert text to uppercase",
    categories: ["data", "transform"],
    tags: ["text", "string", "uppercase"],
    inputs: [
      {
        name: "text",
        type: "string",
        description: "Text to convert",
        required: true,
        example: "hello world",
      },
    ],
    outputs: [
      {
        name: "result",
        type: "string",
        description: "Uppercase text",
        example: "HELLO WORLD",
      },
    ],
    implementation: async ({ inputs }) => {
      return {
        outputs: {
          result: inputs.text.toUpperCase(),
        },
      };
    },
  },
  {
    id: "integration.http.request",
    version: "1.0.0",
    name: "HTTP Request",
    description: "Make an HTTP request",
    categories: ["integration", "action"],
    tags: ["http", "api", "request"],
    inputs: [
      {
        name: "url",
        type: "string",
        description: "Request URL",
        required: true,
        validation: {
          pattern: "^https?://",
        },
      },
      {
        name: "method",
        type: "string",
        description: "HTTP method",
        required: true,
        default: "GET",
        validation: {
          enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        },
      },
      {
        name: "headers",
        type: "object",
        description: "Request headers",
        required: false,
        default: {},
      },
      {
        name: "body",
        type: "any",
        description: "Request body",
        required: false,
      },
    ],
    outputs: [
      {
        name: "data",
        type: "any",
        description: "Response data",
      },
      {
        name: "status",
        type: "number",
        description: "HTTP status code",
      },
      {
        name: "headers",
        type: "object",
        description: "Response headers",
      },
    ],
    config: {
      timeout: 30000,
      retryable: true,
      maxRetries: 3,
    },
    implementation: async ({ inputs }) => {
      // Mock implementation
      return {
        outputs: {
          data: { message: "Mock response" },
          status: 200,
          headers: { "content-type": "application/json" },
        },
      };
    },
  },
];

/**
 * Example workflow
 */
const exampleWorkflow: Workflow = {
  id: "example-workflow-1",
  name: "Example API Workflow",
  description: "Fetch data from API and process it",
  version: "1.0.0",
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    version: "1.0.0",
    author: "System",
    tags: ["example", "api", "processing"],
  },
  nodes: [
    {
      id: "fetch-data",
      nodeId: "integration.http.request",
      name: "Fetch User Data",
      inputs: {
        url: "https://api.example.com/users/123",
        method: "GET",
        headers: {
          Authorization: "${secrets.apiKey}",
        },
      },
      position: { x: 100, y: 100 },
    },
    {
      id: "check-status",
      nodeId: "logic.condition.if",
      name: "Check Success",
      inputs: {
        condition: "${fetch-data.status === 200}",
        value: "${fetch-data.data}",
      },
      position: { x: 300, y: 100 },
    },
    {
      id: "process-name",
      nodeId: "data.transform.uppercase",
      name: "Uppercase Name",
      inputs: {
        text: "${check-status.result.name}",
      },
      position: { x: 500, y: 50 },
    },
  ],
  connections: [
    {
      id: "conn-1",
      source: {
        nodeId: "fetch-data",
        port: "data",
      },
      target: {
        nodeId: "check-status",
        port: "value",
      },
      type: "data",
    },
    {
      id: "conn-2",
      source: {
        nodeId: "check-status",
        edge: "true",
      },
      target: {
        nodeId: "process-name",
        port: "text",
      },
      type: "conditional",
    },
  ],
  config: {
    retryPolicy: {
      enabled: true,
      maxAttempts: 3,
      backoffType: "exponential",
      initialDelay: 1000,
    },
    timeout: 60000,
    errorHandling: "fail-fast",
    logging: {
      level: "info",
      includeNodeInputs: true,
      includeNodeOutputs: true,
      includeState: false,
    },
  },
  variables: [
    {
      name: "apiBaseUrl",
      type: "string",
      defaultValue: "https://api.example.com",
      description: "Base URL for API calls",
      scope: "global",
      mutable: false,
    },
  ],
  inputs: [
    {
      name: "userId",
      type: "string",
      required: true,
      description: "User ID to fetch",
      validation: {
        pattern: "^[0-9]+$",
      },
    },
  ],
  outputs: [
    {
      name: "processedName",
      type: "string",
      description: "Uppercase user name",
      source: "process-name.result",
    },
  ],
};

/**
 * Example usage of validation
 */
export function validateExampleWorkflow() {
  // Create node definition map
  const nodeMap = new Map(
    exampleNodeDefinitions.map((node) => [node.id, node])
  );

  // Create validator
  const validator = new WorkflowValidator(nodeMap);

  // Validate workflow
  const result = validator.validate(exampleWorkflow);

  console.log("Validation result:", {
    valid: result.valid,
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
  });

  if (result.errors.length > 0) {
    console.log("Errors:");
    result.errors.forEach((error) => {
      console.log(`  - ${error.type}: ${error.message}`);
    });
  }

  if (result.warnings.length > 0) {
    console.log("Warnings:");
    result.warnings.forEach((warning) => {
      console.log(`  - ${warning.type}: ${warning.message}`);
    });
  }

  return result;
}

/**
 * Example of creating a workflow programmatically
 */
export function createWorkflowProgrammatically(): Workflow {
  return {
    id: "dynamic-workflow",
    name: "Dynamically Created Workflow",
    version: "1.0.0",
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0.0",
    },
    nodes: [
      {
        id: "input-text",
        nodeId: "data.transform.uppercase",
        inputs: {
          text: "${inputs.userText}",
        },
      },
    ],
    connections: [],
    config: {
      errorHandling: "fail-fast",
      logging: {
        level: "debug",
        includeNodeInputs: true,
        includeNodeOutputs: true,
        includeState: true,
      },
    },
    inputs: [
      {
        name: "userText",
        type: "string",
        required: true,
        description: "Text to process",
      },
    ],
    outputs: [
      {
        name: "result",
        type: "string",
        source: "input-text.result",
      },
    ],
  };
}