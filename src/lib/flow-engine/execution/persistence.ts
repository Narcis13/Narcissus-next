
import { db } from "@/db";
import { workflowExecutions, WorkflowExecutionStatus } from "@/db/schema/workflow-executions";
import { eq } from "drizzle-orm";
import { ExecutionResult, ExecutionStep } from "./types";

export class ExecutionPersistence {
  static async createExecution(data: {
    workflowId: string;
    status?: WorkflowExecutionStatus;
    executionMode?: "immediate" | "queued";
    metadata?: Record<string, any>;
  }) {
    const [execution] = await db
      .insert(workflowExecutions)
      .values({
        workflowId: data.workflowId,
        status: data.status || "pending",
        executionMode: data.executionMode || "immediate",
        metadata: data.metadata || {},
      })
      .returning();
    
    return execution;
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
    const [execution] = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.id, executionId))
      .limit(1);
    
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