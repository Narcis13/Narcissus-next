import { pgTable, uuid, varchar, timestamp, text, jsonb } from "drizzle-orm/pg-core";
import { workflows } from "./workflows";

export const workflowExecutionStatusEnum = ["pending", "running", "completed", "failed", "cancelled"] as const;
export type WorkflowExecutionStatus = typeof workflowExecutionStatusEnum[number];

export const workflowExecutions = pgTable("workflow_executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull().$type<WorkflowExecutionStatus>().default("pending"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  error: text("error"),
  result: jsonb("result").$type<any>(),
});

export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type NewWorkflowExecution = typeof workflowExecutions.$inferInsert;