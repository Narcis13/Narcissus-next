import { NextResponse } from 'next/server';
import { ExecutionManager } from '@/lib/flow-engine/execution';

interface RouteParams {
  params: {
    executionId: string;
  };
}

// POST /api/workflow/execution/[executionId]/resume - Resume execution
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { executionId } = params;
    
    const executionManager = ExecutionManager.getInstance();
    await executionManager.resume(executionId);
    
    return NextResponse.json({
      message: 'Execution resumed successfully',
      executionId,
    });
  } catch (error: any) {
    console.error('Resume execution error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to resume execution' },
      { status: 500 }
    );
  }
}