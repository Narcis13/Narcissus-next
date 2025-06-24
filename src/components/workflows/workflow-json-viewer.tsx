"use client";

import dynamic from "next/dynamic";
import type { Workflow } from "@/db/schema";

const MonacoJsonEditor = dynamic(
  () => import("./monaco-json-editor"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-base-200 rounded-lg">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }
);

interface WorkflowJsonViewerProps {
  workflow: Workflow;
}

export default function WorkflowJsonViewer({ workflow }: WorkflowJsonViewerProps) {
  const jsonString = JSON.stringify(workflow.jsonData, null, 2);

  return (
    <MonacoJsonEditor
      value={jsonString}
      onChange={() => {}} // Read-only
      height="400px"
      readOnly={true}
    />
  );
}