import { getWorkflow } from "@/lib/workflow/workflow-actions";
import { getWorkflowExecutions } from "@/lib/workflow/execution-actions";
import { notFound } from "next/navigation";
import { ExecutionHistoryClient } from "@/components/workflow/execution-history-client";

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

  return <ExecutionHistoryClient workflow={workflow} executions={executions} />;
}