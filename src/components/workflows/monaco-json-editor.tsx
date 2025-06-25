"use client";

import { useRef, useEffect, useState } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";

interface NodeSuggestion {
  label: string;
  insertText: string;
  detail: string;
  nodeId: string;
  sortOrder: number;
}

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
  const [nodeSuggestions, setNodeSuggestions] = useState<NodeSuggestion[]>([]);

  const handleEditorWillMount = (monaco: Monaco) => {
    monacoRef.current = monaco;

    // Define recursive node schema
    const nodeDefinition: any = {
      definitions: {
        node: {
          oneOf: [
            // String node: "node.id" or "Human Readable Name"
            {
              type: "string",
              description: "Node ID (e.g. 'http.request.get') or human-readable name (e.g. 'Send Email')"
            },
            // Parameterized node: { "node.id": { params } } or { "Human Name": { params } }
            {
              type: "object",
              description: "Parameterized node call with parameters",
              minProperties: 1,
              maxProperties: 1,
              patternProperties: {
                "^.+$": {
                  type: "object",
                  description: "Node parameters",
                  additionalProperties: true
                }
              },
              additionalProperties: false
            },
            // Sub-flow: [node1, node2, ...] (single array)
            {
              type: "array",
              description: "Sub-flow (single array of nodes executed in sequence)",
              minItems: 1,
              items: { "$ref": "#/definitions/node" }
            },
            // Loop: [[controller, action1, action2]] (double array)
            {
              type: "array",
              description: "Loop flow (double array: [[controller, ...actions]])",
              minItems: 1,
              maxItems: 1,
              items: {
                type: "array",
                description: "Loop nodes (first is controller, rest are actions)",
                minItems: 1,
                items: { "$ref": "#/definitions/node" }
              }
            },
            // Branch: { "edgeName": node, ... } (NOT a parameterized node)
            {
              type: "object",
              description: "Branch node (routes based on previous node's edges)",
              minProperties: 2,  // Distinguish from parameterized nodes which have exactly 1 property
              patternProperties: {
                "^.+$": { "$ref": "#/definitions/node" }
              },
              additionalProperties: false
            }
          ]
        }
      }
    };

    // Configure JSON language features
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [
        {
          uri: "http://myserver/workflow-schema.json",
          fileMatch: ["*"],
          schema: {
            ...nodeDefinition,
            type: "object",
            required: ["name", "nodes"],
            properties: {
              name: {
                type: "string",
                minLength: 1,
                description: "The name of the workflow",
              },
              description: {
                type: "string",
                description: "A description of what the workflow does",
              },
              nodes: {
                type: "array",
                description: "Array of workflow nodes",
                minItems: 1,
                items: { "$ref": "#/definitions/node" }
              },
              initialState: {
                type: "object",
                description: "Initial state for the workflow (accessible via ${path.to.value} in parameters or state.get/set in node implementations)",
                additionalProperties: true,
              },
            },
          },
        },
      ],
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

  // Fetch node suggestions from the API
  useEffect(() => {
    fetch('/api/workflow/nodes/suggestions')
      .then(res => res.json())
      .then(data => {
        if (data.suggestions) {
          setNodeSuggestions(data.suggestions);
        }
      })
      .catch(err => {
        console.error('Failed to fetch node suggestions:', err);
      });
  }, []);

  // Register completion provider when suggestions are loaded
  useEffect(() => {
    if (monacoRef.current && nodeSuggestions.length > 0) {
      const disposable = monacoRef.current.languages.registerCompletionItemProvider("json", {
        provideCompletionItems: (model, position) => {
          const textUntilPosition = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          // Check if we're in a nodes array context or typing a string
          const inNodesContext = /\"nodes\"\s*:\s*\[[^]*$/.test(textUntilPosition);
          const typingString = /\"[^"]*$/.test(textUntilPosition) && inNodesContext;

          if (typingString) {
            // Get the current word being typed and its starting position
            const lineText = model.getLineContent(position.lineNumber);
            const wordMatch = lineText.substring(0, position.column - 1).match(/\"([^"]*)$/);
            const currentWord = wordMatch ? wordMatch[1] : '';
            const wordStartColumn = wordMatch ? position.column - currentWord.length : position.column;
            
            const filteredSuggestions = nodeSuggestions
              .filter(suggestion => 
                suggestion.label.toLowerCase().includes(currentWord.toLowerCase())
              )
              .slice(0, 50); // Limit to 50 suggestions for performance

            return {
              suggestions: filteredSuggestions.map((node, index) => ({
                label: node.label,
                kind: monacoRef.current!.languages.CompletionItemKind.Value,
                insertText: node.label, // Just the label, not quoted
                detail: node.detail,
                sortText: String(node.sortOrder).padStart(5, "0") + String(index).padStart(3, "0"),
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: wordStartColumn,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                },
              })),
            };
          }

          return { suggestions: [] };
        },
      });

      return () => {
        disposable.dispose();
      };
    }
  }, [nodeSuggestions]);

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