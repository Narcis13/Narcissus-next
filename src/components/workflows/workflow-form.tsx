"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createWorkflow, updateWorkflow } from "@/lib/workflow/workflow-actions";
import { Save, AlertCircle, FileJson, Code2, FileText, Sparkles, Info } from "lucide-react";
import type { Workflow } from "@/db/schema";
import dynamic from "next/dynamic";
import { workflowTemplates } from "@/lib/workflow/templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

// Dynamically import Monaco to avoid SSR issues
const MonacoJsonEditor = dynamic(
  () => import("./monaco-json-editor"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
        <Spinner size="lg" />
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
  initialTemplate?: typeof workflowTemplates[0];
}

export default function WorkflowForm({ workflow, initialTemplate }: WorkflowFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [jsonValidationErrors, setJsonValidationErrors] = useState<any[]>([]);
  const [useCodeEditor, setUseCodeEditor] = useState(true);
  const [showTemplates, setShowTemplates] = useState(!workflow);

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
      name: workflow?.name || initialTemplate?.workflow.name || "",
      description: workflow?.description || initialTemplate?.workflow.description || "",
      jsonData: workflow?.jsonData
        ? JSON.stringify(workflow.jsonData, null, 2)
        : initialTemplate
        ? JSON.stringify(initialTemplate.workflow, null, 2)
        : JSON.stringify(
            {
              name: "My Workflow",
              description: "Workflow description",
              nodes: [],
              initialState: {}
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

  const handleTemplateSelect = (template: typeof workflowTemplates[0]) => {
    setValue("name", template.workflow.name);
    setValue("description", template.workflow.description);
    setValue("jsonData", JSON.stringify(template.workflow, null, 2));
    setShowTemplates(false);
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      {!workflow && showTemplates && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Start with a Template
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(false)}
              >
                Start from scratch
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workflowTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <span className="text-2xl">{template.icon}</span>
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {template.description}
                    </p>
                    <div className="flex justify-end mt-2">
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show templates button if hidden */}
      {!workflow && !showTemplates && (
        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowTemplates(true)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Use a template
          </Button>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Workflow Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="My Awesome Workflow"
              className={errors.name ? "border-destructive" : ""}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this workflow does..."
              className="h-24"
              {...register("description")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileJson className="w-5 h-5" />
              Workflow Configuration
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                {jsonError || jsonValidationErrors.length > 0 ? (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {jsonValidationErrors.length} validation {jsonValidationErrors.length === 1 ? 'error' : 'errors'}
                  </span>
                ) : (
                  <span className="text-green-600">Valid JSON</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="code-editor" className="text-sm font-normal">Code Editor</Label>
                <Checkbox
                  id="code-editor"
                  checked={useCodeEditor}
                  onCheckedChange={(checked) => setUseCodeEditor(checked as boolean)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>

          <div className="space-y-2">
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
              <Textarea
                placeholder="Enter workflow JSON..."
                className={`font-mono text-sm h-96 ${
                  errors.jsonData || jsonError ? "border-destructive" : ""
                }`}
                {...register("jsonData")}
              />
            )}
            {errors.jsonData && (
              <p className="text-sm text-destructive">{errors.jsonData.message}</p>
            )}
            {jsonValidationErrors.length > 0 && useCodeEditor && (
              <div className="mt-2 max-h-32 overflow-y-auto">
                {jsonValidationErrors.slice(0, 3).map((error, index) => (
                  <div key={index} className="text-sm text-destructive">
                    Line {error.startLineNumber}: {error.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Define your workflow using JSON format. Include nodes array for workflow steps and connections array for data flow.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/workflows")}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
        >
          {isPending ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {workflow ? "Update Workflow" : "Create Workflow"}
        </Button>
      </div>
      </form>
    </div>
  );
}