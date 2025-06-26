import { getWorkflow } from "@/lib/workflow/workflow-actions";
import { getExecution } from "@/lib/workflow/execution-actions";
import { notFound } from "next/navigation";
import { ExecutionDetailClient } from "@/components/workflow/execution-detail-client";

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

  return <ExecutionDetailClient workflow={workflow} execution={execution} />;
}