"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Loader2 } from "lucide-react";

export default function RunWorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    params.then(({ id }) => setWorkflowId(id));
  }, [params]);

  const runWorkflow = async () => {
    if (!workflowId) return;
    
    setIsRunning(true);
    setError(null);

    try {
      // First fetch the workflow details
      const workflowResponse = await fetch(`/api/workflows/${workflowId}`);
      if (!workflowResponse.ok) {
        throw new Error("Failed to fetch workflow");
      }
      const workflow = await workflowResponse.json();

      // Run the workflow
      const response = await fetch("/api/workflow/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflow: {
            id: workflow.id,
            name: workflow.name,
            nodes: workflow.jsonData.nodes || workflow.jsonData,
            inputs: workflow.jsonData.inputs || {},
          },
          mode: "auto",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to run workflow");
      }

      // Redirect to execution details
      router.push(`/workflows/${workflowId}/executions/${data.executionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Auto-run the workflow when the page loads
    if (workflowId) {
      runWorkflow();
    }
  }, [workflowId]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/workflows/${workflowId}`} className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Workflow
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            {isRunning ? (
              <>
                <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
                <h2 className="text-2xl font-bold mb-2">Running Workflow...</h2>
                <p className="text-base-content/70">
                  Your workflow is being executed. You'll be redirected to the execution details once it starts.
                </p>
              </>
            ) : error ? (
              <>
                <div className="text-error mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Execution Failed</h2>
                <p className="text-error mb-4">{error}</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={runWorkflow} className="btn btn-primary">
                    <Play className="w-4 h-4" />
                    Try Again
                  </button>
                  <Link href={`/workflows/${workflowId}`} className="btn btn-outline">
                    Back to Workflow
                  </Link>
                </div>
              </>
            ) : (
              <p>Preparing to run workflow...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}