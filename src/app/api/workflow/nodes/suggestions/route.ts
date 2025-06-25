import { NextResponse } from 'next/server';
import { getNodeSuggestions } from '@/lib/flow-engine/get-node-suggestions';

export async function GET() {
  try {
    const suggestions = getNodeSuggestions();
    
    return NextResponse.json({
      suggestions,
      total: suggestions.length
    });
  } catch (error) {
    console.error('Error fetching node suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch node suggestions' },
      { status: 500 }
    );
  }
}