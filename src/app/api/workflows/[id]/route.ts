import { NextRequest, NextResponse } from "next/server";
import { getWorkflow } from "@/lib/workflow/workflow-actions";
import { db } from "@/lib/db";
import { workflows } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const workflow = await getWorkflow(id);
    
    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Failed to fetch workflow:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // Delete workflow (for testing purposes, no auth check)
    await db.delete(workflows).where(eq(workflows.id, id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete workflow:", error);
    return NextResponse.json(
      { error: "Failed to delete workflow" },
      { status: 500 }
    );
  }
}