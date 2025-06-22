// src/app/api/workflow/resume/route.ts
import { NextResponse } from 'next/server';
import { flowHub } from '@/lib/flow-engine/singletons';


// Run initialization logic once.


export async function POST(request: Request) {
    try {
        const { pauseId, resumeData } = await request.json();

        if (!pauseId) {
            return NextResponse.json(
                { message: 'pauseId is required.' },
                { status: 400 }
            );
        }
        
        const success = flowHub.resume(pauseId, resumeData);

        if (!success) {
            return NextResponse.json({ 
                success: false, 
                message: `Flow with pauseId '${pauseId}' not found or already resumed.`
            });
        }

        return NextResponse.json({ 
            success: true, 
            message: `Flow resumed for pauseId '${pauseId}'.` 
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}