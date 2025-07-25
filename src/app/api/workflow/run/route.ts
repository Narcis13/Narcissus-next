import { NextResponse } from 'next/server';
import { ExecutionManager, ExecutionContext, ExecutionOptions } from '@/lib/flow-engine/execution';

export async function POST(request: Request) {
    let workflow: any;
    try {
        const body = await request.json();
        workflow = body.workflow;
        const mode = body.mode;
        const options = body.options;
        const executionMode = body.executionMode; // 'immediate' or 'queued'
        
        if (!workflow) {
            return NextResponse.json(
                { message: 'Workflow definition is required.' },
                { status: 400 }
            );
        }

        // Ensure we have a valid workflow ID
        if (!workflow.id) {
            return NextResponse.json(
                { message: 'Workflow ID is required.' },
                { status: 400 }
            );
        }

        // Create execution context
        const context: ExecutionContext = {
            executionId: '', // Will be set by ExecutionManager
            workflowId: workflow.id,
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

        // Override execution mode if specified
        if (executionMode === 'queued') {
            executionOptions.mode = 'queued';
        } else if (executionMode === 'immediate') {
            executionOptions.mode = 'immediate';
        }

        // Execute workflow
        const result = await executionManager.execute(workflow, context, executionOptions);

        console.log('[Workflow Run API] Execution result:', {
            executionId: result.executionId,
            status: result.status,
            mode: executionOptions.mode
        });

        return NextResponse.json({
            message: result.status === 'pending' ? 'Workflow queued for execution.' : 'Workflow execution started.',
            executionId: result.executionId,
            status: result.status,
            complexity,
            mode: executionOptions.mode,
        });
    } catch (error: any) {
        console.error('API Route Error:', error);
        
        // Check if it's a foreign key constraint error
        if (error.message?.includes('workflow_id') || error.message?.includes('foreign key')) {
            return NextResponse.json({ 
                message: `Workflow with ID '${workflow?.id}' not found in database. Please ensure the workflow is saved before running.`,
                error: 'WORKFLOW_NOT_FOUND'
            }, { status: 400 });
        }
        
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}