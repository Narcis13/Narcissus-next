"use client";

import { useState } from "react";
import MonacoJsonEditor from "@/components/workflows/monaco-json-editor";

export default function TestMonacoPage() {
  const [value, setValue] = useState(JSON.stringify({
    name: "Test Workflow",
    description: "Testing Monaco IntelliSense with human-readable node names",
    nodes: [
      // Type here to test IntelliSense
    ]
  }, null, 2));

  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState<any[]>([]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Monaco Editor IntelliSense Test</h1>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Try typing a quote (") inside the nodes array to see IntelliSense suggestions.
          Human-readable names should appear first.
        </p>
        {!isValid && (
          <div className="alert alert-error">
            <span>Validation errors: {errors.length}</span>
          </div>
        )}
      </div>

      <MonacoJsonEditor
        value={value}
        onChange={setValue}
        onValidate={(valid, errs) => {
          setIsValid(valid);
          setErrors(errs);
        }}
        height="600px"
      />

      <div className="mt-4">
        <details className="collapse bg-base-200">
          <summary className="collapse-title text-xl font-medium">
            Current JSON Value
          </summary>
          <div className="collapse-content">
            <pre className="text-xs overflow-auto">{value}</pre>
          </div>
        </details>
      </div>
    </div>
  );
}