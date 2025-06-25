"use server";

import { db } from "@/db";
import { workflowExecutions } from "@/db/schema/workflow-executions";
import { eq, desc } from "drizzle-orm";

export async function getWorkflowExecutions(workflowId: string) {
  const executions = await db
    .select()
    .from(workflowExecutions)
    .where(eq(workflowExecutions.workflowId, workflowId))
    .orderBy(desc(workflowExecutions.startedAt));
  
  return executions;
}

export async function getExecution(executionId: string) {
  const [execution] = await db
    .select()
    .from(workflowExecutions)
    .where(eq(workflowExecutions.id, executionId));
  
  if (!execution) {
    throw new Error("Execution not found");
  }
  
  return execution;
}