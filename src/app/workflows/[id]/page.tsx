import { getWorkflow } from "@/lib/workflow/workflow-actions";
import { getWorkflowExecutions } from "@/lib/workflow/execution-actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit, Play, Code2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import WorkflowJsonViewer from "@/components/workflows/workflow-json-viewer";

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let workflow;
  let recentExecutions;
  try {
    workflow = await getWorkflow(id);
    recentExecutions = await getWorkflowExecutions(id);
  } catch (error) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/workflows" className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Workflows
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{workflow.name}</h1>
            {workflow.description && (
              <p className="text-base-content/70">{workflow.description}</p>
            )}
            <div className="flex gap-4 mt-4 text-sm text-base-content/60">
              <span>
                Created {formatDistanceToNow(workflow.createdAt, { addSuffix: true })}
              </span>
              <span>•</span>
              <span>
                Updated {formatDistanceToNow(workflow.updatedAt, { addSuffix: true })}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link
              href={`/workflows/${workflow.id}/run`}
              className="btn btn-primary"
            >
              <Play className="w-4 h-4" />
              Run Workflow
            </Link>
            <Link
              href={`/workflows/${workflow.id}/edit`}
              className="btn btn-outline"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <Link
              href={`/workflows/${workflow.id}/executions`}
              className="btn btn-outline"
            >
              <Clock className="w-4 h-4" />
              Executions
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workflow Visualization Placeholder */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-4">
                <Code2 className="w-5 h-5" />
                Workflow Visualization
              </h2>
              <div className="bg-base-200 rounded-lg h-96 flex items-center justify-center">
                <p className="text-base-content/60">
                  Visual workflow editor will be implemented next
                </p>
              </div>
            </div>
          </div>

          {/* Workflow JSON */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-4">
                <Code2 className="w-5 h-5" />
                Workflow Configuration
              </h2>
              <WorkflowJsonViewer workflow={workflow} />
            </div>
          </div>
        </div>

        {/* Execution History */}
        <div className="card bg-base-100 shadow-xl mt-6">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Recent Executions</h2>
              <Link 
                href={`/workflows/${workflow.id}/executions`}
                className="btn btn-ghost btn-sm"
              >
                View All
                <Clock className="w-4 h-4 ml-2" />
              </Link>
            </div>
            {recentExecutions && recentExecutions.length > 0 ? (
              <div className="space-y-2">
                {recentExecutions.slice(0, 5).map((execution) => (
                  <div key={execution.id} className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`badge badge-sm ${
                        execution.status === 'completed' ? 'badge-success' :
                        execution.status === 'failed' ? 'badge-error' :
                        execution.status === 'running' ? 'badge-info' :
                        'badge-warning'
                      }`}>
                        {execution.status}
                      </span>
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
                      </span>
                    </div>
                    <Link 
                      href={`/workflows/${workflow.id}/executions`}
                      className="btn btn-xs btn-ghost"
                    >
                      Details
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-base-content/60">
                <p>No executions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}