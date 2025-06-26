"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestFlowHubPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket for FlowHub events
    const ws = new WebSocket('ws://localhost:8089');

    ws.onopen = () => {
      console.log('[TestFlowHub] WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('[TestFlowHub] Received event:', data);
      setEvents(prev => [...prev, { ...data, timestamp: new Date() }]);
    };

    ws.onclose = () => {
      console.log('[TestFlowHub] WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('[TestFlowHub] WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">FlowHub Event Monitor</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>WebSocket connection to FlowHub</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Event Log</CardTitle>
              <CardDescription>Real-time FlowHub events</CardDescription>
            </div>
            <Button onClick={clearEvents} variant="outline" size="sm">
              Clear Events
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-muted-foreground">No events received yet. Run a workflow to see events.</p>
            ) : (
              events.map((event, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">{event.type}</span>
                    <span className="text-xs text-muted-foreground">
                      {event.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(event.payload || event, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">How to test:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Keep this page open to monitor FlowHub events</li>
          <li>In another tab, run a workflow</li>
          <li>You should see events like: flowStart, flowManagerStep, flowEnd</li>
          <li>For human-in-the-loop workflows, you'll see flowPaused/flowResumed events</li>
        </ol>
      </div>
    </div>
  );
}