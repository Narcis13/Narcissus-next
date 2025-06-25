import { getWorkflow } from "@/lib/workflow/workflow-actions";
import WorkflowForm from "@/components/workflows/workflow-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EditWorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let workflow;
  try {
    workflow = await getWorkflow(id);
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
        <h1 className="text-3xl font-bold mb-2">Edit Workflow</h1>
        <p className="text-base-content/70 mb-8">
          Modify your workflow configuration and settings
        </p>
        
        <WorkflowForm workflow={workflow} />
      </div>
    </div>
  );
}