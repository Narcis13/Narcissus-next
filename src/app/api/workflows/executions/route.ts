import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflowExecutions, workflows } from "@/db/schema";
import { eq, desc, and, or, ilike } from "drizzle-orm";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const workflowId = searchParams.get("workflowId");
    const workflowName = searchParams.get("workflowName");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where conditions
    const conditions = [];
    
    // Add user filter
    conditions.push(eq(workflows.userId, session.user.id));
    
    // Add workflow filters
    if (workflowId) {
      conditions.push(eq(workflowExecutions.workflowId, workflowId));
    }
    
    if (workflowName) {
      conditions.push(ilike(workflows.name, `%${workflowName}%`));
    }
    
    if (status) {
      conditions.push(eq(workflowExecutions.status, status as any));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const executions = await db
      .select({
        id: workflowExecutions.id,
        workflowId: workflowExecutions.workflowId,
        workflowName: workflows.name,
        workflowDescription: workflows.description,
        status: workflowExecutions.status,
        executionMode: workflowExecutions.executionMode,
        startedAt: workflowExecutions.startedAt,
        completedAt: workflowExecutions.completedAt,
        error: workflowExecutions.error,
        result: workflowExecutions.result,
        metadata: workflowExecutions.metadata,
        duration: workflowExecutions.completedAt
          ? `${Math.round((new Date(workflowExecutions.completedAt).getTime() - new Date(workflowExecutions.startedAt).getTime()) / 1000)}s`
          : null,
      })
      .from(workflowExecutions)
      .leftJoin(workflows, eq(workflowExecutions.workflowId, workflows.id))
      .where(whereCondition)
      .orderBy(desc(workflowExecutions.startedAt))
      .limit(limit);

    // Get summary statistics
    const stats = {
      total: executions.length,
      completed: executions.filter(e => e.status === "completed").length,
      failed: executions.filter(e => e.status === "failed").length,
      running: executions.filter(e => e.status === "running").length,
      cancelled: executions.filter(e => e.status === "cancelled").length,
      pending: executions.filter(e => e.status === "pending").length,
    };

    return NextResponse.json({
      executions,
      stats,
    });
  } catch (error) {
    console.error("Error fetching workflow executions:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow executions" },
      { status: 500 }
    );
  }
}