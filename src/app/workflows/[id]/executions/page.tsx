import { getWorkflow } from "@/lib/workflow/workflow-actions";
import { getWorkflowExecutions } from "@/lib/workflow/execution-actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default async function WorkflowExecutionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  let workflow;
  let executions;
  
  try {
    workflow = await getWorkflow(id);
    executions = await getWorkflowExecutions(id);
  } catch (error) {
    notFound();
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-error" />;
      case "running":
        return <RefreshCw className="w-5 h-5 text-info animate-spin" />;
      case "pending":
        return <Clock className="w-5 h-5 text-warning" />;
      default:
        return <AlertCircle className="w-5 h-5 text-base-content/60" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "badge badge-sm";
    switch (status) {
      case "completed":
        return `${baseClasses} badge-success`;
      case "failed":
        return `${baseClasses} badge-error`;
      case "running":
        return `${baseClasses} badge-info`;
      case "pending":
        return `${baseClasses} badge-warning`;
      default:
        return `${baseClasses} badge-ghost`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/workflows/${id}`} className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Workflow
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Execution History: {workflow.name}
          </h1>
          <p className="text-base-content/70">
            View all execution runs and their details
          </p>
        </div>

        {executions.length === 0 ? (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center py-16">
              <Clock className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
              <h3 className="text-xl font-semibold mb-2">No Executions Yet</h3>
              <p className="text-base-content/60 mb-6">
                This workflow hasn't been executed yet.
              </p>
              <Link
                href={`/workflows/${id}/run`}
                className="btn btn-primary mx-auto"
              >
                Run Workflow Now
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {executions.map((execution) => (
              <div
                key={execution.id}
                className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
              >
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {getStatusIcon(execution.status)}
                      <div>
                        <h3 className="font-semibold text-lg">
                          Execution {execution.id.slice(0, 8)}...
                        </h3>
                        <div className="mt-2 space-y-1 text-sm">
                          <p className="flex items-center gap-2">
                            <span className="font-medium">Started:</span>
                            <span>{format(new Date(execution.startedAt), "PPpp")}</span>
                            <span className="text-base-content/60">
                              ({formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })})
                            </span>
                          </p>
                          {execution.completedAt && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium">Completed:</span>
                              <span>{format(new Date(execution.completedAt), "PPpp")}</span>
                              <span className="text-base-content/60">
                                (took {Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)}s)
                              </span>
                            </p>
                          )}
                          <p className="flex items-center gap-2">
                            <span className="font-medium">Mode:</span>
                            <span className="badge badge-ghost badge-sm">
                              {execution.executionMode}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={getStatusBadge(execution.status)}>
                        {execution.status}
                      </span>
                      <Link
                        href={`/workflows/${id}/executions/${execution.id}`}
                        className="btn btn-sm btn-ghost"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                  {execution.error && (
                    <div className="mt-4 p-4 bg-error/10 border border-error/20 rounded-lg">
                      <h4 className="font-semibold text-error mb-2">Error Details:</h4>
                      <pre className="text-sm whitespace-pre-wrap text-error/80 font-mono">
                        {execution.error}
                      </pre>
                    </div>
                  )}

                  {execution.metadata && (
                    <div className="mt-4">
                      <details className="collapse collapse-arrow bg-base-200">
                        <summary className="collapse-title text-sm font-medium">
                          Metadata
                        </summary>
                        <div className="collapse-content">
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(execution.metadata, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}