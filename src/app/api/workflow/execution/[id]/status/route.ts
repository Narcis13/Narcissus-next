import { NextResponse } from 'next/server';
import { ExecutionManager } from '@/lib/flow-engine/execution';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const executionId = params.id;
    
    if (!executionId) {
      return NextResponse.json(
        { message: 'Execution ID is required.' },
        { status: 400 }
      );
    }

    // Get ExecutionManager instance
    const executionManager = ExecutionManager.getInstance();
    
    // Get execution status
    const status = await executionManager.getExecutionStatus(executionId);
    
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Failed to get execution status:', error);
    return NextResponse.json({ 
      message: error.message || 'Failed to get execution status' 
    }, { status: 500 });
  }
}