import { getWorkflow } from "@/lib/workflow/workflow-actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit, Play, Code2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import WorkflowJsonViewer from "@/components/workflows/workflow-json-viewer";

export default async function WorkflowDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let workflow;
  try {
    workflow = await getWorkflow(params.id);
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

        {/* Execution History Placeholder */}
        <div className="card bg-base-100 shadow-xl mt-6">
          <div className="card-body">
            <h2 className="card-title mb-4">Recent Executions</h2>
            <div className="text-center py-8 text-base-content/60">
              <p>Execution history will be displayed here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}