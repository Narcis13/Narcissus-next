"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, User, MessageSquare } from "lucide-react";

export default function TestExecutionModesPage() {
  const [executionMode, setExecutionMode] = useState<"immediate" | "queued">("immediate");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [testWorkflowJson, setTestWorkflowJson] = useState<any>(null);
  const [activePauses, setActivePauses] = useState<any[]>([]);
  const [humanInputValue, setHumanInputValue] = useState("");
  const [workflowType, setWorkflowType] = useState<"simple" | "humanInLoop">("simple");

  useEffect(() => {
    // Connect to WebSocket for FlowHub events
    const ws = new WebSocket('ws://localhost:8089');

    ws.onopen = () => {
      console.log('[TestExecutionModes] WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('[TestExecutionModes] Received event:', data);
      setEvents(prev => [...prev, { ...data, timestamp: new Date() }]);
      
      // Handle flow paused events to show human input UI
      if (data.type === 'flowPaused' && data.payload) {
        const { pauseId, details, flowInstanceId } = data.payload;
        if (details && details.type === 'text-input') {
          setActivePauses(prev => [...prev, { pauseId, details, flowInstanceId }]);
        }
      }
      
      // Handle flow resumed events to remove from active pauses
      if (data.type === 'flowResumed' && data.payload) {
        const { pauseId } = data.payload;
        setActivePauses(prev => prev.filter(p => p.pauseId !== pauseId));
      }
    };

    ws.onclose = () => {
      console.log('[TestExecutionModes] WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('[TestExecutionModes] WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const executeTestWorkflow = async () => {
    setIsExecuting(true);
    setExecutionResult(null);
    setEvents([]); // Clear previous events
    setActivePauses([]); // Clear previous pauses

    try {
      // Choose workflow based on type
      let workflowNodes;
      if (workflowType === "humanInLoop") {
        workflowNodes = [
          { log: { message: "Step 1: Starting human-in-the-loop workflow" } },
          { "human.input.text": { 
            prompt: "Please enter some text to convert to uppercase:",
            placeholder: "Type your text here...",
            defaultValue: ""
          } },
          {
            "submitted": [
              { "text.transform.uppercase": { text: "${state.lastHumanInput}" } },
              { log: { message: "Converted to uppercase: ${state.lastUppercaseText}" } }
            ],
            "cancelled": { log: { message: "User cancelled input" } }
          },
          { identity: { value: { 
            message: "Human-in-the-loop workflow completed!",
            userInput: "${state.lastHumanInput}",
            uppercaseResult: "${state.lastUppercaseText}"
          } } }
        ];
      } else {
        workflowNodes = [
          { log: { message: "Step 1: Starting workflow" } },
          { log: { message: "Step 2: Processing data from ${testData}" } },
          { delay: { ms: 1000 } },
          { log: { message: "Step 3: Workflow started at ${timestamp}" } },
          { identity: { value: { 
            message: "Workflow completed successfully!",
            receivedData: "${testData}",
            startTime: "${timestamp}"
          } } }
        ];
      }

      // First, create a workflow in the database
      const workflowData = {
        name: workflowType === "humanInLoop" ? "Test Human-in-the-Loop" : "Test Execution Modes",
        description: workflowType === "humanInLoop" 
          ? "Test workflow with human input for immediate and queued execution modes"
          : "Test workflow for immediate and queued execution modes",
        jsonData: {
          nodes: workflowNodes
        }
      };

      // Create workflow
      const createResponse = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflowData),
      });

      if (!createResponse.ok) {
        const error = await createResponse.text();
        throw new Error(`Failed to create workflow: ${error}`);
      }

      const createdWorkflow = await createResponse.json();
      console.log("Created workflow:", createdWorkflow);

      // Now execute the workflow
      const testWorkflow = {
        id: createdWorkflow.id,
        name: createdWorkflow.name,
        nodes: createdWorkflow.jsonData.nodes,
        initialState: {
          testData: "Hello from test workflow",
          timestamp: new Date().toISOString()
        }
      };

      // Store the workflow JSON for display
      setTestWorkflowJson(testWorkflow);

      const response = await fetch("/api/workflow/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: testWorkflow,
          mode: "auto",
          executionMode: executionMode
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${error}`);
      }

      const result = await response.json();
      setExecutionResult(result);

      // For queued mode, poll for status
      if (executionMode === "queued" && result.status === "pending") {
        pollExecutionStatus(result.executionId);
      }

      // Clean up: delete the test workflow
      await fetch(`/api/workflows/${createdWorkflow.id}`, {
        method: "DELETE",
      });
    } catch (error: any) {
      console.error("Execution failed:", error);
      setExecutionResult({ error: error.message || "Unknown error occurred" });
    } finally {
      setIsExecuting(false);
    }
  };

  const pollExecutionStatus = async (executionId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/workflow/execution/${executionId}/status`);
        if (!response.ok) throw new Error("Failed to get status");
        
        const status = await response.json();
        setExecutionResult(status);
        
        if (status.status === "completed" || status.status === "failed") {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Failed to poll status:", error);
        clearInterval(pollInterval);
      }
    }, 1000);

    // Stop polling after 30 seconds
    setTimeout(() => clearInterval(pollInterval), 30000);
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const submitHumanInput = async (pauseId: string, value: string) => {
    try {
      const response = await fetch("/api/workflow/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pauseId,
          resumeData: { value }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit human input");
      }

      const result = await response.json();
      console.log("Human input submitted:", result);
      
      // Clear the input
      setHumanInputValue("");
    } catch (error) {
      console.error("Error submitting human input:", error);
    }
  };

  const cancelHumanInput = async (pauseId: string) => {
    try {
      const response = await fetch("/api/workflow/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pauseId,
          resumeData: { cancelled: true }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel human input");
      }

      console.log("Human input cancelled");
    } catch (error) {
      console.error("Error cancelling human input:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Test Execution Modes</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Execution Configuration</CardTitle>
              <CardDescription>Choose execution mode and run test workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-base mb-3 block">Workflow Type</Label>
                <RadioGroup value={workflowType} onValueChange={(value) => setWorkflowType(value as any)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="simple" id="simple" />
                    <Label htmlFor="simple">Simple (automatic)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="humanInLoop" id="humanInLoop" />
                    <Label htmlFor="humanInLoop">Human-in-the-Loop</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base mb-3 block">Execution Mode</Label>
                <RadioGroup value={executionMode} onValueChange={(value) => setExecutionMode(value as any)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="immediate" id="immediate" />
                    <Label htmlFor="immediate">Immediate (synchronous)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="queued" id="queued" />
                    <Label htmlFor="queued">Queued (via Redis/Upstash)</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button 
                onClick={executeTestWorkflow} 
                disabled={isExecuting} 
                className="w-full"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  "Execute Test Workflow"
                )}
              </Button>
            </CardContent>
          </Card>

          {testWorkflowJson && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Test Workflow JSON</CardTitle>
                <CardDescription>The workflow being executed</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm overflow-x-auto bg-muted p-3 rounded">
                  {JSON.stringify(testWorkflowJson, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {activePauses.length > 0 && (
            <Card className="mb-6 border-2 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Human Input Required
                </CardTitle>
                <CardDescription>The workflow is waiting for your input</CardDescription>
              </CardHeader>
              <CardContent>
                {activePauses.map((pause) => (
                  <div key={pause.pauseId} className="space-y-4">
                    <div>
                      <Label className="text-base mb-2 block">{pause.details.prompt}</Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder={pause.details.placeholder || "Enter text..."}
                          value={humanInputValue}
                          onChange={(e) => setHumanInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              submitHumanInput(pause.pauseId, humanInputValue);
                            }
                          }}
                          className="flex-1"
                        />
                        <Button 
                          onClick={() => submitHumanInput(pause.pauseId, humanInputValue)}
                          disabled={!humanInputValue}
                          variant="default"
                        >
                          Submit
                        </Button>
                        <Button 
                          onClick={() => cancelHumanInput(pause.pauseId)}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {executionResult && (
            <Card>
              <CardHeader>
                <CardTitle>Execution Result</CardTitle>
                <CardDescription>Latest execution outcome</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm overflow-x-auto bg-muted p-3 rounded">
                  {JSON.stringify(executionResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>FlowHub Events</CardTitle>
                <CardDescription>Real-time events from both execution modes</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                <Button onClick={clearEvents} variant="outline" size="sm">
                  Clear
                </Button>
              </div>
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
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Test Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Choose a workflow type:
            <ul className="list-disc list-inside ml-4 mt-1">
              <li><strong>Simple:</strong> Automatic workflow with delays and logging</li>
              <li><strong>Human-in-the-Loop:</strong> Workflow that pauses for user input</li>
            </ul>
          </li>
          <li>Select an execution mode:
            <ul className="list-disc list-inside ml-4 mt-1">
              <li><strong>Immediate:</strong> Synchronous execution (existing behavior)</li>
              <li><strong>Queued:</strong> Asynchronous via Redis/Upstash queue</li>
            </ul>
          </li>
          <li>Click "Execute Test Workflow" to start</li>
          <li>For Human-in-the-Loop workflows:
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>A blue input box will appear when input is needed</li>
              <li>Enter text and click Submit (or press Enter)</li>
              <li>The workflow will convert your text to uppercase</li>
            </ul>
          </li>
          <li>Watch the FlowHub Events panel for real-time updates</li>
          <li>Both execution modes support human input via pause/resume</li>
        </ol>
      </div>
    </div>
  );
}