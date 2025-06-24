import { workflowTemplates, type WorkflowTemplate } from "@/lib/workflow/templates";
import Link from "next/link";
import { ArrowLeft, Plus, FileText, Robot, Database, Link2 } from "lucide-react";

const categoryIcons = {
  automation: FileText,
  ai: Robot,
  data: Database,
  integration: Link2,
};

export default function WorkflowTemplatesPage() {
  const categories = Array.from(new Set(workflowTemplates.map(t => t.category)));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/workflows" className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Workflows
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Workflow Templates</h1>
            <p className="text-base-content/70">
              Start with a pre-built template and customize it to your needs
            </p>
          </div>
          <Link href="/workflows/new" className="btn btn-outline">
            <Plus className="w-4 h-4" />
            Start from Scratch
          </Link>
        </div>

        {/* Templates by Category */}
        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold mb-4 capitalize flex items-center gap-2">
              {(() => {
                const Icon = categoryIcons[category as keyof typeof categoryIcons];
                return Icon ? <Icon className="w-5 h-5" /> : null;
              })()}
              {category} Templates
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflowTemplates
                .filter((t) => t.category === category)
                .map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ template }: { template: WorkflowTemplate }) {
  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
      <div className="card-body">
        <h3 className="card-title">
          <span className="text-3xl">{template.icon}</span>
          {template.name}
        </h3>
        <p className="text-sm text-base-content/70 flex-grow">
          {template.description}
        </p>
        
        <div className="divider my-2"></div>
        
        <div className="text-xs text-base-content/60 space-y-1">
          <p>• {template.workflow.nodes.length} nodes</p>
          {template.workflow.config && (
            <p>• {Object.keys(template.workflow.config).length} config options</p>
          )}
        </div>
        
        <div className="card-actions justify-between items-center mt-4">
          <span className="badge badge-outline badge-sm">{template.category}</span>
          <Link
            href={`/workflows/new?template=${template.id}`}
            className="btn btn-primary btn-sm"
          >
            Use Template
          </Link>
        </div>
      </div>
    </div>
  );
}