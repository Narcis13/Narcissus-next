"use server";

import { db } from "@/lib/db";
import { workflows, workflowExecutions } from "@/db/schema";
import { eq, desc, and, ilike, or, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export interface WorkflowWithStats {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastRun: Date | null;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  status: "active" | "draft" | "archived";
}

export async function getWorkflows({
  page = 1,
  pageSize = 10,
  search = "",
  sortBy = "updatedAt",
  sortOrder = "desc"
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "name" | "createdAt" | "updatedAt" | "lastRun";
  sortOrder?: "asc" | "desc";
} = {}): Promise<{
  workflows: WorkflowWithStats[];
  totalCount: number;
  totalPages: number;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const offset = (page - 1) * pageSize;

  // Build search condition
  const searchCondition = search
    ? or(
        ilike(workflows.name, `%${search}%`),
        ilike(workflows.description, `%${search}%`)
      )
    : undefined;

  // Build where condition
  const whereCondition = and(
    eq(workflows.userId, session.user.id),
    searchCondition
  );

  // Get workflows with execution stats
  const workflowsWithStats = await db
    .select({
      id: workflows.id,
      name: workflows.name,
      description: workflows.description,
      createdAt: workflows.createdAt,
      updatedAt: workflows.updatedAt,
      lastRun: sql<Date>`MAX(${workflowExecutions.startedAt})`,
      totalRuns: sql<number>`COUNT(${workflowExecutions.id})::int`,
      successfulRuns: sql<number>`SUM(CASE WHEN ${workflowExecutions.status} = 'completed' THEN 1 ELSE 0 END)::int`,
      failedRuns: sql<number>`SUM(CASE WHEN ${workflowExecutions.status} = 'failed' THEN 1 ELSE 0 END)::int`,
    })
    .from(workflows)
    .leftJoin(workflowExecutions, eq(workflows.id, workflowExecutions.workflowId))
    .where(whereCondition)
    .groupBy(workflows.id)
    .orderBy(
      sortOrder === "desc" 
        ? desc(sortBy === "lastRun" ? sql`MAX(${workflowExecutions.startedAt})` : workflows[sortBy])
        : sql`${workflows[sortBy]} ASC`
    )
    .limit(pageSize)
    .offset(offset);

  // Get total count
  const totalCountResult = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(workflows)
    .where(whereCondition);

  const totalCount = totalCountResult[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Add status based on some logic (for now, all active)
  const workflowsWithStatus: WorkflowWithStats[] = workflowsWithStats.map(w => ({
    ...w,
    status: "active" as const,
    totalRuns: w.totalRuns || 0,
    successfulRuns: w.successfulRuns || 0,
    failedRuns: w.failedRuns || 0,
  }));

  return {
    workflows: workflowsWithStatus,
    totalCount,
    totalPages,
  };
}

export async function deleteWorkflow(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await db
    .delete(workflows)
    .where(and(eq(workflows.id, id), eq(workflows.userId, session.user.id)));

  revalidatePath("/workflows");
}

export async function deleteWorkflows(ids: string[]) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await db
    .delete(workflows)
    .where(
      and(
        sql`${workflows.id} IN ${sql.raw(`(${ids.map(() => "?").join(", ")})`, ids)}`,
        eq(workflows.userId, session.user.id)
      )
    );

  revalidatePath("/workflows");
}

export async function duplicateWorkflow(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get the workflow to duplicate
  const [workflow] = await db
    .select()
    .from(workflows)
    .where(and(eq(workflows.id, id), eq(workflows.userId, session.user.id)))
    .limit(1);

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  // Create a duplicate
  const [newWorkflow] = await db
    .insert(workflows)
    .values({
      userId: session.user.id,
      name: `${workflow.name} (Copy)`,
      description: workflow.description,
      jsonData: workflow.jsonData,
    })
    .returning();

  revalidatePath("/workflows");
  return newWorkflow;
}

export async function getWorkflow(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [workflow] = await db
    .select()
    .from(workflows)
    .where(and(eq(workflows.id, id), eq(workflows.userId, session.user.id)))
    .limit(1);

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  return workflow;
}

export async function createWorkflow(data: {
  name: string;
  description?: string;
  jsonData: any;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [workflow] = await db
    .insert(workflows)
    .values({
      userId: session.user.id,
      name: data.name,
      description: data.description,
      jsonData: data.jsonData,
    })
    .returning();

  revalidatePath("/workflows");
  return workflow;
}

export async function updateWorkflow(
  id: string,
  data: {
    name?: string;
    description?: string;
    jsonData?: any;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [workflow] = await db
    .update(workflows)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(workflows.id, id), eq(workflows.userId, session.user.id)))
    .returning();

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  revalidatePath("/workflows");
  revalidatePath(`/workflows/${id}`);
  return workflow;
}