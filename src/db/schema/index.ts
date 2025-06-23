// db/schema/index.ts
import * as postsSchema from "./posts";
import * as commentsSchema from "./comments";
import * as usersSchema from "./users";
import * as credentialsSchema from "./credentials";
import * as workflowsSchema from "./workflows";
import * as workflowExecutionsSchema from "./workflow-executions";
import * as apiKeysSchema from "./api-keys";
import * as workflowSchedulesSchema from "./workflow-schedules";

// Combine all schemas into a single object
export const schema = {
  ...postsSchema,
  ...commentsSchema,
  ...usersSchema,
  ...credentialsSchema,
  ...workflowsSchema,
  ...workflowExecutionsSchema,
  ...apiKeysSchema,
  ...workflowSchedulesSchema,
};

// Re-export individual schemas for easier imports
export * from "./posts";
export * from "./comments";
export * from "./users";
export * from "./credentials";
export * from "./workflows";
export * from "./workflow-executions";
export * from "./api-keys";
export * from "./workflow-schedules";