"use client";

import { useState } from "react";
import FlowViewer from "@/components/flow-viewer/FlowViewer";
import { FlowManagerWorkflow } from "@/lib/workflow/types/flowmanager-workflow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Eye, Code, Sparkles, Workflow } from "lucide-react";

const exampleWorkflows: Record<string, FlowManagerWorkflow> = {
  simple: {
    name: "Simple Sequential Flow",
    description: "A basic workflow that fetches data and transforms it",
    nodes: [
      "data.fetch.http",
      { "data.transform.uppercase": { text: "${state.fetchedData}" } },
      "utility.debug.log"
    ],
    initialState: {
      apiUrl: "https://api.example.com/data"
    }
  },
  
  conditional: {
    name: "Conditional Branching",
    description: "Workflow with conditional logic based on data",
    nodes: [
      "data.fetch.http",
      "logic.condition.if",
      {
        "true": "send.email.notification",
        "false": "utility.debug.log"
      }
    ]
  },
  
  loop: {
    name: "Loop Example",
    description: "Process items in a loop with control flow",
    nodes: [
      "data.fetch.list",
      [["logic.loop.controller", "data.transform.process", "data.save.database"]],
      "send.email.summary"
    ]
  },
  
  complex: {
    name: "Complex AI Workflow",
    description: "Advanced workflow with AI integration and multiple branches",
    nodes: [
      "webhook.trigger.receive",
      { "data.validate.schema": { schema: "userInput" } },
      "ai.openai.completion",
      "logic.condition.switch",
      {
        "success": [
          "ai.response.parser",
          "data.transform.format",
          "send.webhook.response"
        ],
        "error": "send.error.notification",
        "retry": [["logic.delay.wait", "ai.anthropic.claude"]]
      },
      "utility.log.analytics"
    ]
  }
};

export default function VisualizeWorkflowPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("simple");
  const [viewMode, setViewMode] = useState<"visual" | "json">("visual");
  
  const currentWorkflow = exampleWorkflows[selectedWorkflow];
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
            <Workflow className="w-8 h-8 text-purple-600" />
            Workflow Visualization
          </h1>
          <p className="text-muted-foreground mt-2">
            Beautiful, interactive visualization of your AI workflows
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" />
            AI-Native
          </Badge>
          <Badge variant="outline">Read-Only Viewer</Badge>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Select Example Workflow</CardTitle>
          <CardDescription>
            Choose from our curated examples to see the visualization in action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(exampleWorkflows).map(([key, workflow]) => (
              <Button
                key={key}
                variant={selectedWorkflow === key ? "default" : "outline"}
                onClick={() => setSelectedWorkflow(key)}
                className="justify-start"
              >
                {workflow.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{currentWorkflow.name}</CardTitle>
              <CardDescription>{currentWorkflow.description}</CardDescription>
            </div>
            
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <TabsList>
                <TabsTrigger value="visual" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Visual
                </TabsTrigger>
                <TabsTrigger value="json" className="gap-2">
                  <Code className="w-4 h-4" />
                  JSON
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {viewMode === "visual" ? (
            <div className="h-[600px] w-full">
              <FlowViewer
                workflow={currentWorkflow}
                showMiniMap={true}
                showControls={true}
                interactive={false}
              />
            </div>
          ) : (
            <div className="p-6">
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[600px]">
                <code className="text-sm">
                  {JSON.stringify(currentWorkflow, null, 2)}
                </code>
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                Auto-Layout
              </h4>
              <p className="text-sm text-muted-foreground">
                Intelligent dagre-based layout algorithm automatically positions nodes for optimal readability
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                Node Categories
              </h4>
              <p className="text-sm text-muted-foreground">
                Color-coded nodes by category with custom icons for instant recognition
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Interactive Controls
              </h4>
              <p className="text-sm text-muted-foreground">
                Zoom, pan, and minimap for navigating complex workflows with ease
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}