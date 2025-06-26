"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { WorkflowExecution } from "@/db/schema";
import type { ExecutionStep } from "@/lib/flow-engine/execution/types";

interface ExecutionUpdate {
  type: "status" | "step" | "progress" | "error" | "complete";
  executionId: string;
  data: any;
  timestamp: Date;
}

interface UseExecutionUpdatesOptions {
  executionId: string;
  onUpdate?: (update: ExecutionUpdate) => void;
  autoRefresh?: boolean;
}

export function useExecutionUpdates({
  executionId,
  onUpdate,
  autoRefresh = true,
}: UseExecutionUpdatesOptions) {
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const router = useRouter();

  // Fetch initial execution data
  const fetchExecution = useCallback(async () => {
    try {
      const response = await fetch(`/api/workflow/execution/${executionId}`);
      if (!response.ok) throw new Error("Failed to fetch execution");
      const data = await response.json();
      
      // Handle different response formats
      if (data.executionId && !data.id) {
        // This is the ExecutionResult format, transform it to WorkflowExecution format
        setExecution({
          id: data.executionId,
          workflowId: execution?.workflowId || '',
          status: data.status,
          executionMode: execution?.executionMode || 'immediate',
          startedAt: execution?.startedAt || new Date().toISOString(),
          completedAt: data.completedAt,
          error: data.error,
          result: {
            output: data.output,
            steps: data.steps || []
          },
          metadata: execution?.metadata || {}
        } as any);
      } else {
        // This is already in WorkflowExecution format
        setExecution(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch execution");
    }
  }, [executionId, execution]);

  // Connect to SSE stream
  const connectToStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(
      `/api/workflow/execution/${executionId}/stream`
    );

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const update: ExecutionUpdate = JSON.parse(event.data);
        
        // Update local state based on update type
        switch (update.type) {
          case "status":
            setExecution((prev) => 
              prev ? { ...prev, status: update.data.status } : null
            );
            break;
            
          case "step":
            setExecution((prev) => {
              if (!prev) return null;
              const steps = (prev.result?.steps || []) as ExecutionStep[];
              const stepIndex = steps.findIndex(s => s.nodeId === update.data.nodeId);
              
              if (stepIndex >= 0) {
                steps[stepIndex] = update.data;
              } else {
                steps.push(update.data);
              }
              
              return {
                ...prev,
                result: {
                  ...prev.result,
                  steps,
                },
              };
            });
            break;
            
          case "complete":
            setExecution((prev) => 
              prev ? {
                ...prev,
                status: "completed",
                completedAt: update.data.completedAt,
                result: update.data.result,
              } : null
            );
            break;
            
          case "error":
            setExecution((prev) => 
              prev ? {
                ...prev,
                status: "failed",
                error: update.data.error,
                completedAt: update.data.completedAt,
              } : null
            );
            break;
            
          case "progress":
            // Progress updates can be handled by parent component
            break;
        }
        
        // Call onUpdate callback if provided
        if (onUpdate) {
          onUpdate(update);
        }
        
        // Refresh router on status changes if autoRefresh is enabled
        if (autoRefresh && (update.type === "complete" || update.type === "error")) {
          router.refresh();
        }
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };

    eventSource.onerror = (err) => {
      setIsConnected(false);
      setError("Connection to execution stream lost");
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (execution && (execution.status === "running" || execution.status === "pending")) {
          connectToStream();
        }
      }, 5000);
    };

    eventSourceRef.current = eventSource;
  }, [executionId, onUpdate, autoRefresh, router, execution]);

  // Set up SSE connection and fetch initial data
  useEffect(() => {
    fetchExecution();
    
    // Only connect to stream if execution is running/pending
    const checkAndConnect = async () => {
      await fetchExecution();
      if (execution && (execution.status === "running" || execution.status === "pending")) {
        connectToStream();
      }
    };
    
    checkAndConnect();
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [executionId]);

  // Reconnect when execution status changes to running
  useEffect(() => {
    if (execution && (execution.status === "running" || execution.status === "pending") && !isConnected) {
      connectToStream();
    } else if (execution && (execution.status === "completed" || execution.status === "failed" || execution.status === "cancelled") && eventSourceRef.current) {
      eventSourceRef.current.close();
      setIsConnected(false);
    }
  }, [execution?.status, isConnected, connectToStream]);

  const pauseExecution = useCallback(async () => {
    try {
      const response = await fetch(`/api/workflow/execution/${executionId}/pause`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to pause execution");
      await fetchExecution();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pause execution");
    }
  }, [executionId, fetchExecution]);

  const resumeExecution = useCallback(async () => {
    try {
      const response = await fetch(`/api/workflow/execution/${executionId}/resume`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to resume execution");
      await fetchExecution();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resume execution");
    }
  }, [executionId, fetchExecution]);

  const cancelExecution = useCallback(async () => {
    try {
      const response = await fetch(`/api/workflow/execution/${executionId}/cancel`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to cancel execution");
      await fetchExecution();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel execution");
    }
  }, [executionId, fetchExecution]);

  return {
    execution,
    isConnected,
    error,
    pauseExecution,
    resumeExecution,
    cancelExecution,
    refetch: fetchExecution,
  };
}