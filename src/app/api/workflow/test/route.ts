// Test simple workflow
import { NextResponse } from 'next/server';
import { FlowManager } from '@/lib/flow-engine/core/FlowManager.js';
import { nodeRegistry, flowHub } from '@/lib/flow-engine/singletons';

export async function POST() {
    try {
        console.log('[Test Route] Creating simple test workflow...');
        console.log('[Test Route] FlowHub available:', !!flowHub);
        
        // Create a simple test workflow with basic functions
        const testNodes = [
            function() {
                console.log('Test Node 1 executing');
                return { message: 'Hello from node 1' };
            },
            function() {
                console.log('Test Node 2 executing');
                return { message: 'Hello from node 2' };
            }
        ];

        const fm = FlowManager({
            nodes: testNodes,
            initialState: { test: true },
            scope: {},
        }) as {
            run: () => Promise<any[]>;
            getInstanceId: () => string;
            getSteps: () => any[];
            getStateManager: () => any;
        };
        
        console.log('[Test Route] FlowManager created with ID:', fm.getInstanceId());
        console.log('[Test Route] Starting test workflow execution...');
        
        // Run the flow and handle the promise
        fm.run().then((result) => {
            console.log('[Test Route] Flow execution completed:', result);
        }).catch((error) => {
            console.error('[Test Route] Flow execution error:', error);
        });

        return NextResponse.json({
            message: 'Test workflow started.',
            flowInstanceId: fm.getInstanceId(),
        });
    } catch (error: any) {
        console.error('[Test Route] Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
