"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createWorkflow, updateWorkflow } from "@/lib/workflow/workflow-actions";
import { Save, AlertCircle, FileJson, Code2 } from "lucide-react";
import type { Workflow } from "@/db/schema";
import dynamic from "next/dynamic";

// Dynamically import Monaco to avoid SSR issues
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

const workflowSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  jsonData: z.string().refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, "Invalid JSON format"),
});

type WorkflowFormData = z.infer<typeof workflowSchema>;

interface WorkflowFormProps {
  workflow?: Workflow;
}

export default function WorkflowForm({ workflow }: WorkflowFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [jsonValidationErrors, setJsonValidationErrors] = useState<any[]>([]);
  const [useCodeEditor, setUseCodeEditor] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
    setValue,
  } = useForm<WorkflowFormData>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: workflow?.name || "",
      description: workflow?.description || "",
      jsonData: workflow?.jsonData
        ? JSON.stringify(workflow.jsonData, null, 2)
        : JSON.stringify(
            {
              name: "My Workflow",
              description: "Workflow description",
              nodes: [],
              connections: [],
            },
            null,
            2
          ),
    },
  });

  const jsonData = watch("jsonData");

  const onSubmit = handleSubmit((data) => {
    setError(null);
    startTransition(async () => {
      try {
        const jsonPayload = JSON.parse(data.jsonData);
        
        if (workflow) {
          await updateWorkflow(workflow.id, {
            name: data.name,
            description: data.description,
            jsonData: jsonPayload,
          });
          router.push(`/workflows/${workflow.id}`);
        } else {
          const newWorkflow = await createWorkflow({
            name: data.name,
            description: data.description,
            jsonData: jsonPayload,
          });
          router.push(`/workflows/${newWorkflow.id}`);
        }
      } catch (error) {
        console.error("Failed to save workflow:", error);
        setError(error instanceof Error ? error.message : "Failed to save workflow");
      }
    });
  });

  // Simple JSON validation for visual feedback
  let jsonError = null;
  try {
    JSON.parse(jsonData);
  } catch (e) {
    jsonError = e instanceof Error ? e.message : "Invalid JSON";
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="alert alert-error">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Workflow Details</h2>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">Name</span>
            </label>
            <input
              type="text"
              placeholder="My Awesome Workflow"
              className={`input input-bordered ${errors.name ? "input-error" : ""}`}
              {...register("name")}
            />
            {errors.name && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.name.message}</span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              placeholder="Describe what this workflow does..."
              className="textarea textarea-bordered h-24"
              {...register("description")}
            />
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title flex items-center gap-2">
              <FileJson className="w-5 h-5" />
              Workflow Configuration
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                {jsonError || jsonValidationErrors.length > 0 ? (
                  <span className="text-error flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {jsonValidationErrors.length} validation {jsonValidationErrors.length === 1 ? 'error' : 'errors'}
                  </span>
                ) : (
                  <span className="text-success">Valid JSON</span>
                )}
              </div>
              <label className="label cursor-pointer gap-2">
                <span className="label-text">Code Editor</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={useCodeEditor}
                  onChange={(e) => setUseCodeEditor(e.target.checked)}
                />
              </label>
            </div>
          </div>

          <div className="form-control">
            {useCodeEditor ? (
              <Controller
                name="jsonData"
                control={control}
                render={({ field }) => (
                  <MonacoJsonEditor
                    value={field.value}
                    onChange={field.onChange}
                    onValidate={(isValid, errors) => {
                      setJsonValidationErrors(errors);
                    }}
                    height="400px"
                  />
                )}
              />
            ) : (
              <textarea
                placeholder="Enter workflow JSON..."
                className={`textarea textarea-bordered font-mono text-sm h-96 ${
                  errors.jsonData || jsonError ? "textarea-error" : ""
                }`}
                {...register("jsonData")}
              />
            )}
            {errors.jsonData && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.jsonData.message}</span>
              </label>
            )}
            {jsonValidationErrors.length > 0 && useCodeEditor && (
              <div className="mt-2 max-h-32 overflow-y-auto">
                {jsonValidationErrors.slice(0, 3).map((error, index) => (
                  <div key={index} className="text-sm text-error">
                    Line {error.startLineNumber}: {error.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="alert alert-info mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <div className="text-sm">
                Define your workflow using JSON format. Include nodes array for workflow steps and connections array for data flow.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.push("/workflows")}
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`btn btn-primary ${isPending ? "loading" : ""}`}
          disabled={isPending}
        >
          {!isPending && <Save className="w-4 h-4" />}
          {workflow ? "Update Workflow" : "Create Workflow"}
        </button>
      </div>
    </form>
  );
}