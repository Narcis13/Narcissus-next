import { NextResponse } from 'next/server';
import { ExecutionManager, ExecutionContext, ExecutionOptions } from '@/lib/flow-engine/execution';
import { Workflow } from '@/lib/workflow/types';

export async function POST(request: Request) {
    try {
        const { workflow, mode, options } = await request.json();
        
        if (!workflow) {
            return NextResponse.json(
                { message: 'Workflow definition is required.' },
                { status: 400 }
            );
        }

        // Create execution context
        const context: ExecutionContext = {
            executionId: '', // Will be set by ExecutionManager
            workflowId: workflow.id || 'temp-workflow',
            userId: 1, // Hardcoded for now
            startedAt: new Date(),
            input: workflow.inputs || {},
            metadata: {
                source: 'api',
                mode: mode || 'auto',
            },
        };

        // Create execution options
        const executionOptions: ExecutionOptions = {
            mode: mode || 'auto',
            timeout: options?.timeout || 300000, // 5 minutes default
            priority: options?.priority || 1,
            tags: options?.tags || [],
            ...options,
        };

        // Get ExecutionManager instance
        const executionManager = ExecutionManager.getInstance();

        // Analyze complexity if in auto mode
        let complexity;
        if (executionOptions.mode === 'auto') {
            complexity = executionManager.getWorkflowComplexity(workflow);
        }

        // Execute workflow
        const result = await executionManager.execute(workflow, context, executionOptions);

        return NextResponse.json({
            message: result.status === 'pending' ? 'Workflow queued for execution.' : 'Workflow execution started.',
            executionId: result.executionId,
            status: result.status,
            complexity,
            mode: executionOptions.mode,
        });
    } catch (error: any) {
        console.error('API Route Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}