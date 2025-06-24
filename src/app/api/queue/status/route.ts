import { NextResponse } from "next/server";
import { QueueService } from "@/lib/services/queue-service";

export async function GET() {
  try {
    const metrics = await QueueService.getQueueMetrics();
    
    return NextResponse.json({
      status: "connected",
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Queue status error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}