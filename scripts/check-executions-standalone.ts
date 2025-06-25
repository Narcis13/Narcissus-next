// Standalone script that includes its own database connection
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { workflowExecutions, workflows } from "../src/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set in .env.local");
  process.exit(1);
}

// Create database connection
const connectionString = DATABASE_URL;
const queryClient = postgres(connectionString);
const db = drizzle(queryClient);

async function checkExecutions() {
  console.log("Checking workflow executions...\n");

  try {
    // Get all executions with workflow details
    const executions = await db
      .select({
        id: workflowExecutions.id,
        workflowId: workflowExecutions.workflowId,
        workflowName: workflows.name,
        status: workflowExecutions.status,
        executionMode: workflowExecutions.executionMode,
        startedAt: workflowExecutions.startedAt,
        completedAt: workflowExecutions.completedAt,
        error: workflowExecutions.error,
        result: workflowExecutions.result,
        metadata: workflowExecutions.metadata,
      })
      .from(workflowExecutions)
      .leftJoin(workflows, eq(workflowExecutions.workflowId, workflows.id))
      .orderBy(desc(workflowExecutions.startedAt))
      .limit(20);

    if (executions.length === 0) {
      console.log("No workflow executions found in the database.");
      return;
    }

    console.log(`Found ${executions.length} workflow executions:\n`);

    for (const execution of executions) {
      console.log("═".repeat(80));
      console.log(`Execution ID: ${execution.id}`);
      console.log(`Workflow: ${execution.workflowName || "Unknown"} (${execution.workflowId})`);
      console.log(`Status: ${execution.status}`);
      console.log(`Mode: ${execution.executionMode}`);
      console.log(`Started: ${execution.startedAt}`);
      
      if (execution.completedAt) {
        const duration = Math.round(
          (new Date(execution.completedAt).getTime() - 
           new Date(execution.startedAt).getTime()) / 1000
        );
        console.log(`Completed: ${execution.completedAt} (${duration}s)`);
      }
      
      if (execution.error) {
        console.log(`\nError:`);
        console.log("─".repeat(40));
        console.log(execution.error);
      }
      
      if (execution.result) {
        console.log(`\nResult:`);
        console.log("─".repeat(40));
        console.log(JSON.stringify(execution.result, null, 2));
      }
      
      if (execution.metadata && Object.keys(execution.metadata).length > 0) {
        console.log(`\nMetadata:`);
        console.log("─".repeat(40));
        console.log(JSON.stringify(execution.metadata, null, 2));
      }
    }

    console.log("\n" + "═".repeat(80));

    // Get summary statistics
    const stats = await db
      .select({
        status: workflowExecutions.status,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(workflowExecutions)
      .groupBy(workflowExecutions.status);

    console.log("\nExecution Statistics:");
    console.log("─".repeat(40));
    for (const stat of stats) {
      console.log(`${stat.status}: ${stat.count}`);
    }

    // Get workflows with most executions
    const topWorkflows = await db
      .select({
        workflowName: workflows.name,
        workflowId: workflows.id,
        executionCount: sql<number>`COUNT(${workflowExecutions.id})::int`,
        lastRun: sql<Date>`MAX(${workflowExecutions.startedAt})`,
      })
      .from(workflows)
      .leftJoin(workflowExecutions, eq(workflows.id, workflowExecutions.workflowId))
      .groupBy(workflows.id)
      .having(sql`COUNT(${workflowExecutions.id}) > 0`)
      .orderBy(desc(sql`COUNT(${workflowExecutions.id})`))
      .limit(10);

    if (topWorkflows.length > 0) {
      console.log("\n\nTop Workflows by Execution Count:");
      console.log("─".repeat(40));
      for (const wf of topWorkflows) {
        console.log(`${wf.workflowName}: ${wf.executionCount} executions (last run: ${wf.lastRun})`);
      }
    }

  } catch (error) {
    console.error("Error checking executions:", error);
  } finally {
    await queryClient.end();
    process.exit(0);
  }
}

checkExecutions();