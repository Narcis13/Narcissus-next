import { NextRequest, NextResponse } from 'next/server';
import { getWorkflow } from '@/lib/workflow/workflow-actions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workflow = await getWorkflow(id);
    
    return NextResponse.json({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      nodes: workflow.jsonData.nodes || [],
      initialState: workflow.jsonData.initialState || {},
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 404 }
    );
  }
}