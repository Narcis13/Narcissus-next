import { NextResponse } from 'next/server';
import { FlowManager } from '@/lib/flow-engine/core/FlowManager.js';
import { nodeRegistry, flowHub } from '@/lib/flow-engine/singletons';
// Run initialization logic once when this module is first loaded.


export async function POST(request: Request) {
    try {
        const { nodes, initialState } = await request.json();
        console.log('Received nodes:', nodes);
        console.log('Initial state:', initialState);
        
        if (!nodes || !Array.isArray(nodes)) {
            return NextResponse.json(
                { message: 'Workflow nodes are required.' },
                { status: 400 }
            );
        }

        console.log('Creating FlowManager with nodeRegistry scope:', Object.keys(nodeRegistry.getScope()));
        
        const fm = FlowManager({
            nodes,
            initialState: initialState || {},
            scope: nodeRegistry.getScope(),
        }) as {
            run: () => Promise<any[]>;
            getInstanceId: () => string;
            getSteps: () => any[];
            getStateManager: () => any;
        };
        
        console.log('FlowManager created with ID:', fm.getInstanceId());
        
        // Run the flow and handle the promise
        fm.run().then((result) => {
            console.log('Flow execution completed:', result);
        }).catch((error) => {
            console.error('Flow execution error:', error);
        });

        return NextResponse.json({
            message: 'Workflow started.',
            flowInstanceId: fm.getInstanceId(),
        });
    } catch (error: any) {
        console.error('API Route Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}