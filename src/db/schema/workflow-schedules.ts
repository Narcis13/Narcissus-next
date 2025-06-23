import { pgTable, uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { workflows } from "./workflows";

export const workflowSchedules = pgTable("workflow_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  cronExpression: varchar("cron_expression", { length: 255 }).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  nextRun: timestamp("next_run"),
  lastRun: timestamp("last_run"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type WorkflowSchedule = typeof workflowSchedules.$inferSelect;
export type NewWorkflowSchedule = typeof workflowSchedules.$inferInsert;