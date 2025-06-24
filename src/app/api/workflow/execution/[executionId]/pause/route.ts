import { NextResponse } from 'next/server';
import { ExecutionManager } from '@/lib/flow-engine/execution';

interface RouteParams {
  params: {
    executionId: string;
  };
}

// POST /api/workflow/execution/[executionId]/pause - Pause execution
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { executionId } = params;
    
    const executionManager = ExecutionManager.getInstance();
    await executionManager.pause(executionId);
    
    return NextResponse.json({
      message: 'Execution paused successfully',
      executionId,
    });
  } catch (error: any) {
    console.error('Pause execution error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to pause execution' },
      { status: 500 }
    );
  }
}