import { NextRequest, NextResponse } from "next/server";
import { getWorkflowExecutions } from "@/lib/workflow/execution-actions";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const executions = await getWorkflowExecutions(id);
    
    return NextResponse.json(executions);
  } catch (error) {
    console.error("Failed to fetch workflow executions:", error);
    return NextResponse.json(
      { error: "Failed to fetch executions" },
      { status: 500 }
    );
  }
}