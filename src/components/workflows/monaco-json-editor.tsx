"use client";

import { useRef, useEffect } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";

interface MonacoJsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidate?: (isValid: boolean, errors: any[]) => void;
  height?: string;
  readOnly?: boolean;
}

export default function MonacoJsonEditor({
  value,
  onChange,
  onValidate,
  height = "400px",
  readOnly = false,
}: MonacoJsonEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const handleEditorWillMount = (monaco: Monaco) => {
    monacoRef.current = monaco;

    // Configure JSON language features
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [
        {
          uri: "http://myserver/workflow-schema.json",
          fileMatch: ["*"],
          schema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "The name of the workflow",
              },
              description: {
                type: "string",
                description: "A description of what the workflow does",
              },
              nodes: {
                type: "array",
                description: "The nodes that make up the workflow",
                items: {
                  oneOf: [
                    {
                      type: "string",
                      description: "Node ID reference",
                    },
                    {
                      type: "object",
                      description: "Node with parameters",
                      properties: {
                        id: {
                          type: "string",
                          description: "Node ID",
                        },
                        params: {
                          type: "object",
                          description: "Node parameters",
                        },
                      },
                      required: ["id"],
                    },
                    {
                      type: "array",
                      description: "Sub-flow or loop structure",
                    },
                  ],
                },
              },
              connections: {
                type: "array",
                description: "Connections between nodes",
                items: {
                  type: "object",
                  properties: {
                    from: {
                      type: "string",
                      description: "Source node ID",
                    },
                    to: {
                      type: "string",
                      description: "Target node ID",
                    },
                    fromPort: {
                      type: "string",
                      description: "Source port name",
                    },
                    toPort: {
                      type: "string",
                      description: "Target port name",
                    },
                  },
                  required: ["from", "to"],
                },
              },
              variables: {
                type: "object",
                description: "Workflow variables",
                additionalProperties: true,
              },
              inputs: {
                type: "object",
                description: "Workflow input definitions",
                additionalProperties: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["string", "number", "boolean", "object", "array"],
                    },
                    required: {
                      type: "boolean",
                    },
                    default: {},
                    description: {
                      type: "string",
                    },
                  },
                },
              },
              outputs: {
                type: "object",
                description: "Workflow output definitions",
                additionalProperties: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["string", "number", "boolean", "object", "array"],
                    },
                    description: {
                      type: "string",
                    },
                  },
                },
              },
              config: {
                type: "object",
                description: "Workflow configuration",
                properties: {
                  retryPolicy: {
                    type: "object",
                    properties: {
                      maxAttempts: {
                        type: "number",
                        minimum: 1,
                        maximum: 10,
                      },
                      backoffMultiplier: {
                        type: "number",
                        minimum: 1,
                      },
                    },
                  },
                  timeout: {
                    type: "number",
                    description: "Timeout in seconds",
                    minimum: 0,
                  },
                  maxConcurrency: {
                    type: "number",
                    description: "Maximum concurrent executions",
                    minimum: 1,
                  },
                },
              },
            },
            required: ["nodes"],
          },
        },
      ],
    });

    // Set up auto-completion for common node IDs
    monaco.languages.registerCompletionItemProvider("json", {
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        // Check if we're in a nodes array context
        const inNodesContext = /\"nodes\"\s*:\s*\[[^]*$/.test(textUntilPosition);
        const inNodeId = /\"id\"\s*:\s*\"[^"]*$/.test(textUntilPosition);

        if (inNodesContext || inNodeId) {
          // Common node IDs from the FlowManager system
          const nodeIds = [
            // Logic nodes
            { label: "logic.condition.if", insertText: '"logic.condition.if"', detail: "Conditional branching" },
            { label: "logic.control.delay", insertText: '"logic.control.delay"', detail: "Delay execution" },
            { label: "logic.control.loop", insertText: '"logic.control.loop"', detail: "Loop controller" },
            // Data nodes
            { label: "data.transform.mapper", insertText: '"data.transform.mapper"', detail: "Transform data" },
            { label: "data.combine.merge", insertText: '"data.combine.merge"', detail: "Merge data sources" },
            // HTTP nodes
            { label: "http.request.get", insertText: '"http.request.get"', detail: "HTTP GET request" },
            { label: "http.request.post", insertText: '"http.request.post"', detail: "HTTP POST request" },
            // AI nodes
            { label: "ai.openai.completion", insertText: '"ai.openai.completion"', detail: "OpenAI completion" },
            { label: "ai.anthropic.completion", insertText: '"ai.anthropic.completion"', detail: "Anthropic Claude" },
            // Communication nodes
            { label: "communication.email.send", insertText: '"communication.email.send"', detail: "Send email" },
            { label: "communication.webhook.send", insertText: '"communication.webhook.send"', detail: "Send webhook" },
            // Database nodes
            { label: "database.query.select", insertText: '"database.query.select"', detail: "Database query" },
            { label: "database.query.insert", insertText: '"database.query.insert"', detail: "Database insert" },
          ];

          return {
            suggestions: nodeIds.map((node, index) => ({
              label: node.label,
              kind: monaco.languages.CompletionItemKind.Value,
              insertText: node.insertText,
              detail: node.detail,
              sortText: String(index).padStart(3, "0"),
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              },
            })),
          };
        }

        return { suggestions: [] };
      },
    });
  };

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Validate on mount
    const markers = editor.getModel()?.getLanguageId() === "json" 
      ? monacoRef.current?.editor.getModelMarkers({ resource: editor.getModel()!.uri }) || []
      : [];
    
    if (onValidate) {
      onValidate(markers.length === 0, markers);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  const handleValidation = (markers: editor.IMarker[]) => {
    if (onValidate) {
      onValidate(markers.length === 0, markers);
    }
  };

  useEffect(() => {
    // Format document on first load
    setTimeout(() => {
      editorRef.current?.getAction("editor.action.formatDocument")?.run();
    }, 100);
  }, []);

  return (
    <div className="border border-base-300 rounded-lg overflow-hidden">
      <Editor
        height={height}
        defaultLanguage="json"
        value={value}
        onChange={handleEditorChange}
        onValidate={handleValidation}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          tabSize: 2,
          wordWrap: "on",
          automaticLayout: true,
          formatOnPaste: true,
          formatOnType: true,
          readOnly,
          theme: "vs-dark",
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          suggestOnTriggerCharacters: true,
        }}
      />
    </div>
  );
}