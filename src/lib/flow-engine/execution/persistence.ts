
import { db } from "@/db";
import { workflowExecutions, WorkflowExecutionStatus } from "@/db/schema/workflow-executions";
import { eq, sql } from "drizzle-orm";
import { ExecutionResult, ExecutionStep } from "./types";

export class ExecutionPersistence {
  static async createExecution(data: {
    workflowId: string;
    status?: WorkflowExecutionStatus;
    executionMode?: "immediate" | "queued";
    metadata?: Record<string, any>;
  }) {
    console.log('[ExecutionPersistence] Creating execution for workflow:', data.workflowId);
    
    try {
      console.log('[ExecutionPersistence] Insert values:', {
        workflowId: data.workflowId,
        status: data.status || "pending",
        executionMode: data.executionMode || "immediate",
      });
      
      const result = await db
        .insert(workflowExecutions)
        .values({
          workflowId: data.workflowId,
          status: data.status || "pending",
          executionMode: data.executionMode || "immediate",
          metadata: data.metadata || {},
        })
        .returning();
      
      console.log('[ExecutionPersistence] Insert result:', result);
      
      if (!result || result.length === 0) {
        throw new Error('No execution returned from insert');
      }
      
      const execution = result[0];
      console.log('[ExecutionPersistence] Created execution with ID:', execution.id);
      
      // Verify it was saved by reading it back
      const verification = await db
        .select()
        .from(workflowExecutions)
        .where(eq(workflowExecutions.id, execution.id));
      
      console.log('[ExecutionPersistence] Verification - found:', verification.length > 0);
      
      return execution;
    } catch (error: any) {
      console.error('[ExecutionPersistence] Failed to create execution:', error);
      console.error('[ExecutionPersistence] Error details:', error.message);
      throw error;
    }
  }

  static async updateExecution(
    executionId: string,
    data: {
      status?: WorkflowExecutionStatus;
      error?: string;
      result?: any;
      completedAt?: Date;
    }
  ) {
    const [updated] = await db
      .update(workflowExecutions)
      .set({
        status: data.status,
        error: data.error,
        result: data.result,
        completedAt: data.completedAt,
      })
      .where(eq(workflowExecutions.id, executionId))
      .returning();
    
    return updated;
  }

  static async getExecution(executionId: string) {
    console.log('[ExecutionPersistence] Getting execution with ID:', executionId);
    
    // First, let's see all executions (order by most recent first)
    const allExecutions = await db
      .select({ 
        id: workflowExecutions.id, 
        status: workflowExecutions.status,
        startedAt: workflowExecutions.startedAt 
      })
      .from(workflowExecutions)
      .orderBy(sql`${workflowExecutions.startedAt} DESC`)
      .limit(10);
    
    console.log('[ExecutionPersistence] Recent executions:', allExecutions.map(e => ({ id: e.id.substring(0, 8), status: e.status })));
    
    // Force a fresh read by using a new query
    const executions = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.id, executionId));
    
    const execution = executions[0];
    
    console.log('[ExecutionPersistence] Found execution:', execution ? 'Yes' : 'No');
    
    return execution;
  }

  static async saveExecutionResult(result: ExecutionResult) {
    return this.updateExecution(result.executionId, {
      status: result.status,
      error: result.error,
      result: {
        output: result.output,
        steps: result.steps,
      },
      completedAt: result.completedAt,
    });
  }

  static async saveExecutionStep(
    executionId: string,
    step: ExecutionStep
  ) {
    const execution = await this.getExecution(executionId);
    if (!execution) return null;

    const currentSteps = (execution.result?.steps || []) as ExecutionStep[];
    const stepIndex = currentSteps.findIndex(s => s.nodeId === step.nodeId);
    
    if (stepIndex >= 0) {
      currentSteps[stepIndex] = step;
    } else {
      currentSteps.push(step);
    }

    return this.updateExecution(executionId, {
      result: {
        ...execution.result,
        steps: currentSteps,
      },
    });
  }

  static async markExecutionAsRunning(executionId: string) {
    return this.updateExecution(executionId, {
      status: "running",
    });
  }

  static async markExecutionAsCompleted(
    executionId: string,
    output: any
  ) {
    return this.updateExecution(executionId, {
      status: "completed",
      result: { output },
      completedAt: new Date(),
    });
  }

  static async markExecutionAsFailed(
    executionId: string,
    error: string
  ) {
    return this.updateExecution(executionId, {
      status: "failed",
      error,
      completedAt: new Date(),
    });
  }

  static async markExecutionAsCancelled(executionId: string) {
    return this.updateExecution(executionId, {
      status: "cancelled",
      completedAt: new Date(),
    });
  }
}