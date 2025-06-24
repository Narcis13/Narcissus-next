import WorkflowForm from "@/components/workflows/workflow-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTemplateById } from "@/lib/workflow/templates";

export default async function NewWorkflowPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const params = await searchParams;
  const template = params.template ? getTemplateById(params.template) : undefined;
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/workflows" className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Workflows
        </Link>
      </div>
      
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Create New Workflow</h1>
        <p className="text-base-content/70 mb-8">
          Design your automation workflow using our visual editor or JSON code
        </p>
        
        <WorkflowForm initialTemplate={template} />
      </div>
    </div>
  );
}