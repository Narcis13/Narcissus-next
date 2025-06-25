import { NextRequest } from 'next/server';
import { ExecutionManager } from '@/lib/flow-engine/execution';
import { flowHub } from '@/lib/flow-engine/singletons';

interface RouteParams {
  params: Promise<{
    executionId: string;
  }>;
}

// GET /api/workflow/execution/[executionId]/stream - Stream execution updates
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { executionId } = await params;
  
  // Create SSE response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial progress
      try {
        const executionManager = ExecutionManager.getInstance();
        const progress = await executionManager.getProgress(executionId);
        
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            data: progress
          })}\n\n`)
        );
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: 'Execution not found'
          })}\n\n`)
        );
      }
      
      // Listen for flow events
      const handleStep = async (data: any) => {
        if (data.flowInstanceId !== executionId) return;
        
        try {
          const executionManager = ExecutionManager.getInstance();
          const progress = await executionManager.getProgress(executionId);
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'step',
              nodeId: data.nodeId,
              progress
            })}\n\n`)
          );
          
          // Check if execution is complete
          if (progress.status === 'completed' || progress.status === 'failed' || progress.status === 'cancelled') {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'complete',
                status: progress.status
              })}\n\n`)
            );
            controller.close();
          }
        } catch (error) {
          console.error('Error sending progress update:', error);
        }
      };
      
      flowHub.on('flowManagerStep', handleStep);
      
      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        flowHub.off('flowManagerStep', handleStep);
        controller.close();
      });
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}