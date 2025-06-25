import { getWorkflow } from "@/lib/workflow/workflow-actions";
import { getExecution } from "@/lib/workflow/execution-actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, 
  Calendar, Timer, Server, Activity, Package, ChevronRight, 
  Layers, Hash, Copy, Check, ExternalLink, PlayCircle, 
  FileJson, Database, Zap, Code2
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

export default async function ExecutionDetailsPage({
  params,
}: {
  params: Promise<{ id: string; executionId: string }>;
}) {
  const { id, executionId } = await params;
  
  let workflow;
  let execution;
  
  try {
    workflow = await getWorkflow(id);
    execution = await getExecution(executionId);
  } catch (error) {
    notFound();
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "running":
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "running":
        return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">Running</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getDuration = () => {
    if (!execution.completedAt) return null;
    const duration = new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href={`/workflows/${id}/executions`} 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Executions
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  {getStatusIcon(execution.status)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Execution Details</h1>
                  <p className="text-muted-foreground mt-1">{workflow.name}</p>
                </div>
              </div>
              {getStatusBadge(execution.status)}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <PlayCircle className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Started</p>
                      <p className="font-medium">{formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Timer className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{getDuration() || "In progress..."}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Mode</p>
                      <p className="font-medium capitalize">{execution.executionMode}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Workflow Version</p>
                      <p className="font-medium">{workflow.version || "1.0.0"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            {/* Execution Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Execution Timeline
                </CardTitle>
                <CardDescription>Detailed timing information for this execution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Started At</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(execution.startedAt), "PPpp")}</p>
                      </div>
                    </div>
                  </div>
                  
                  {execution.completedAt && (
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium">Completed At</p>
                          <p className="text-sm text-muted-foreground">{format(new Date(execution.completedAt), "PPpp")}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Workflow Output - The vital information! */}
            {execution.result && (
              <Card className="border-green-500/20 shadow-lg">
                <CardHeader className="bg-green-500/5">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Workflow Output
                  </CardTitle>
                  <CardDescription>The result data returned by this workflow execution</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative">
                    <div className="absolute right-4 top-4 z-10">
                      <CopyButton text={formatJson(execution.result)} />
                    </div>
                    <pre className="p-6 overflow-x-auto bg-muted/30 text-sm">
                      <code className="language-json">{formatJson(execution.result)}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Details */}
            {execution.error && (
              <Card className="border-red-500/20">
                <CardHeader className="bg-red-500/5">
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <XCircle className="w-5 h-5" />
                    Error Details
                  </CardTitle>
                  <CardDescription>Information about why this execution failed</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 bg-red-500/5 border border-red-500/10 rounded-lg text-sm text-red-600 dark:text-red-400 overflow-x-auto">
                    {execution.error}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            {execution.metadata && Object.keys(execution.metadata).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Execution Metadata
                  </CardTitle>
                  <CardDescription>Additional context and information about this execution</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative">
                    <div className="absolute right-4 top-4 z-10">
                      <CopyButton text={formatJson(execution.metadata)} />
                    </div>
                    <pre className="p-6 overflow-x-auto bg-muted/30 text-sm">
                      <code className="language-json">{formatJson(execution.metadata)}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Technical Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  Technical Details
                </CardTitle>
                <CardDescription>Unique identifiers and system information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg group">
                    <div className="flex items-center gap-3">
                      <Hash className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Execution ID</p>
                        <p className="font-mono text-sm">{execution.id}</p>
                      </div>
                    </div>
                    <CopyButton 
                      text={execution.id} 
                      className="opacity-0 group-hover:opacity-100 transition-opacity" 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg group">
                    <div className="flex items-center gap-3">
                      <FileJson className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Workflow ID</p>
                        <p className="font-mono text-sm">{execution.workflowId}</p>
                      </div>
                    </div>
                    <CopyButton 
                      text={execution.workflowId} 
                      className="opacity-0 group-hover:opacity-100 transition-opacity" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center gap-4">
            <Button asChild>
              <Link href={`/workflows/${id}`}>
                <Layers className="w-4 h-4 mr-2" />
                View Workflow
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/workflows/${id}/executions`}>
                View All Executions
              </Link>
            </Button>
            {execution.status === "completed" && (
              <Button variant="outline" asChild>
                <Link href={`/workflows/${id}/run`}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Again
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}