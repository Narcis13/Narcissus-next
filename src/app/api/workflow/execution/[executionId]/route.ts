import { NextResponse } from 'next/server';
import { ExecutionManager } from '@/lib/flow-engine/execution';

interface RouteParams {
  params: Promise<{
    executionId: string;
  }>;
}

// GET /api/workflow/execution/[executionId] - Get execution status
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { executionId } = await params;
    
    const executionManager = ExecutionManager.getInstance();
    const result = await executionManager.getStatus(executionId);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Get execution status error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to get execution status' },
      { status: 500 }
    );
  }
}

// DELETE /api/workflow/execution/[executionId] - Cancel execution
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { executionId } = await params;
    
    const executionManager = ExecutionManager.getInstance();
    await executionManager.cancel(executionId);
    
    return NextResponse.json({
      message: 'Execution cancelled successfully',
      executionId,
    });
  } catch (error: any) {
    console.error('Cancel execution error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to cancel execution' },
      { status: 500 }
    );
  }
}