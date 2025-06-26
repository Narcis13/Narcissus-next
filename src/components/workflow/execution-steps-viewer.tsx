"use client";

import React, { useState, useMemo } from "react";
import { 
  PlayCircle, CheckCircle, XCircle, Clock, AlertCircle, 
  ChevronRight, ChevronDown, Code2, Zap, Eye, EyeOff,
  Timer, RefreshCw, SkipForward, Info
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/ui/copy-button";
import type { ExecutionStep } from "@/lib/flow-engine/execution/types";

interface ExecutionStepsViewerProps {
  steps?: ExecutionStep[];
  status: string;
  startedAt: string;
  completedAt?: string | null;
}

export function ExecutionStepsViewer({ steps = [], status, startedAt, completedAt }: ExecutionStepsViewerProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showInputOutput, setShowInputOutput] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "failed" | "running">("all");

  const filteredSteps = useMemo(() => {
    if (filter === "all") return steps;
    return steps.filter(step => {
      if (filter === "completed") return step.status === "completed";
      if (filter === "failed") return step.status === "failed";
      if (filter === "running") return step.status === "running";
      return true;
    });
  }, [steps, filter]);

  const stepStats = useMemo(() => {
    return {
      total: steps.length,
      completed: steps.filter(s => s.status === "completed").length,
      failed: steps.filter(s => s.status === "failed").length,
      running: steps.filter(s => s.status === "running").length,
      pending: steps.filter(s => s.status === "pending").length,
      skipped: steps.filter(s => s.status === "skipped").length,
    };
  }, [steps]);

  const toggleStep = (nodeId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "running":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "skipped":
        return <SkipForward className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "running":
        return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">Running</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">Pending</Badge>;
      case "skipped":
        return <Badge variant="secondary">Skipped</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDuration = (step: ExecutionStep) => {
    if (!step.startedAt || !step.completedAt) return null;
    const duration = new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime();
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  if (!steps || steps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Execution Steps
          </CardTitle>
          <CardDescription>Step-by-step execution log</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Info className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No execution steps recorded</p>
            <p className="text-sm text-muted-foreground mt-2">
              Step tracking may not be available for this execution
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Execution Steps
            </CardTitle>
            <CardDescription>Step-by-step execution log</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInputOutput(!showInputOutput)}
            >
              {showInputOutput ? (
                <>
                  <EyeOff className="w-4 h-4 mr-1" />
                  Hide I/O
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  Show I/O
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedSteps(new Set(steps.map(s => s.nodeId)))}
            >
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedSteps(new Set())}
            >
              Collapse All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Step Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">
          <div className="text-center p-2 bg-muted rounded">
            <p className="text-2xl font-bold">{stepStats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-2 bg-green-500/10 rounded">
            <p className="text-2xl font-bold text-green-600">{stepStats.completed}</p>
            <p className="text-xs text-green-600">Completed</p>
          </div>
          <div className="text-center p-2 bg-red-500/10 rounded">
            <p className="text-2xl font-bold text-red-600">{stepStats.failed}</p>
            <p className="text-xs text-red-600">Failed</p>
          </div>
          <div className="text-center p-2 bg-blue-500/10 rounded">
            <p className="text-2xl font-bold text-blue-600">{stepStats.running}</p>
            <p className="text-xs text-blue-600">Running</p>
          </div>
          <div className="text-center p-2 bg-yellow-500/10 rounded">
            <p className="text-2xl font-bold text-yellow-600">{stepStats.pending}</p>
            <p className="text-xs text-yellow-600">Pending</p>
          </div>
          <div className="text-center p-2 bg-gray-500/10 rounded">
            <p className="text-2xl font-bold text-gray-600">{stepStats.skipped}</p>
            <p className="text-xs text-gray-600">Skipped</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({stepStats.total})
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("completed")}
          >
            Completed ({stepStats.completed})
          </Button>
          <Button
            variant={filter === "failed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("failed")}
          >
            Failed ({stepStats.failed})
          </Button>
          <Button
            variant={filter === "running" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("running")}
          >
            Running ({stepStats.running})
          </Button>
        </div>

        {/* Steps Timeline */}
        <div className="space-y-2">
          {filteredSteps.map((step, index) => {
            const isExpanded = expandedSteps.has(step.nodeId);
            const isLastStep = index === filteredSteps.length - 1;
            
            return (
              <div key={step.nodeId} className="relative">
                {/* Connection Line */}
                {!isLastStep && (
                  <div className="absolute left-[19px] top-12 bottom-0 w-[2px] bg-border" />
                )}
                
                {/* Step Card */}
                <div className={cn(
                  "border rounded-lg transition-all",
                  step.status === "failed" && "border-red-500/20 bg-red-500/5",
                  step.status === "running" && "border-blue-500/20 bg-blue-500/5 animate-pulse",
                  step.status === "completed" && "border-green-500/20 bg-green-500/5",
                  isExpanded && "shadow-md"
                )}>
                  {/* Step Header */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleStep(step.nodeId)}
                  >
                    <div className="flex-shrink-0">{getStatusIcon(step.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{step.nodeId}</span>
                        {getStatusBadge(step.status)}
                        {step.completedAt && (
                          <span className="text-xs text-muted-foreground">
                            <Timer className="w-3 h-3 inline mr-1" />
                            {getDuration(step)}
                          </span>
                        )}
                      </div>
                      {step.startedAt && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Started {formatDistanceToNow(new Date(step.startedAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Step Details */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-4 space-y-4">
                      {/* Error Details */}
                      {step.error && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2 text-red-600">Error</h4>
                          <pre className="p-3 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-600 overflow-x-auto">
                            {step.error}
                          </pre>
                        </div>
                      )}

                      {/* Input/Output */}
                      {showInputOutput && (
                        <>
                          {step.input !== undefined && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium">Input</h4>
                                <CopyButton text={formatJson(step.input)} size="sm" />
                              </div>
                              <pre className="p-3 bg-muted rounded text-xs overflow-x-auto max-h-48">
                                <code>{formatJson(step.input)}</code>
                              </pre>
                            </div>
                          )}

                          {step.output !== undefined && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium">Output</h4>
                                <CopyButton text={formatJson(step.output)} size="sm" />
                              </div>
                              <pre className="p-3 bg-muted rounded text-xs overflow-x-auto max-h-48">
                                <code>{formatJson(step.output)}</code>
                              </pre>
                            </div>
                          )}
                        </>
                      )}

                      {/* Timing Details */}
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        {step.startedAt && (
                          <div>
                            <span className="text-muted-foreground">Started:</span>
                            <span className="ml-2">{new Date(step.startedAt).toLocaleString()}</span>
                          </div>
                        )}
                        {step.completedAt && (
                          <div>
                            <span className="text-muted-foreground">Completed:</span>
                            <span className="ml-2">{new Date(step.completedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}