import { NextResponse } from 'next/server';
import { ExecutionManager } from '@/lib/flow-engine/execution';

interface RouteParams {
  params: Promise<{
    executionId: string;
  }>;
}

// GET /api/workflow/execution/[executionId]/progress - Get execution progress
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { executionId } = await params;
    
    const executionManager = ExecutionManager.getInstance();
    const progress = await executionManager.getProgress(executionId);
    
    return NextResponse.json(progress);
  } catch (error: any) {
    console.error('Get execution progress error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to get execution progress' },
      { status: 500 }
    );
  }
}