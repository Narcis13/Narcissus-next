import { getRecentWorkflowExecutions } from "@/lib/workflow/workflow-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default async function WorkflowExecutionsPage() {
  const executions = await getRecentWorkflowExecutions(50);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Workflow Execution History</h1>
      
      {executions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">No workflow executions found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {executions.map((execution) => (
            <Card key={execution.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {execution.workflowName || "Unknown Workflow"}
                    </CardTitle>
                    <CardDescription>
                      ID: {execution.id}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      execution.status === "completed"
                        ? "default"
                        : execution.status === "failed"
                        ? "destructive"
                        : execution.status === "running"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {execution.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Started:</span>{" "}
                    {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
                  </div>
                  {execution.completedAt && (
                    <div>
                      <span className="font-medium">Completed:</span>{" "}
                      {formatDistanceToNow(new Date(execution.completedAt), { addSuffix: true })}
                    </div>
                  )}
                  {execution.error && (
                    <div className="mt-3">
                      <span className="font-medium text-red-600">Error:</span>
                      <pre className="mt-1 p-2 bg-red-50 rounded text-xs overflow-auto max-h-32">
                        {execution.error}
                      </pre>
                    </div>
                  )}
                  {execution.result && (
                    <div className="mt-3">
                      <span className="font-medium">Result:</span>
                      <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(execution.result, null, 2)}
                      </pre>
                    </div>
                  )}
                  {execution.metadata && Object.keys(execution.metadata).length > 0 && (
                    <div className="mt-3">
                      <span className="font-medium">Metadata:</span>
                      <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(execution.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}