"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, 
  Search, Filter, Calendar, ChevronDown 
} from "lucide-react";
import { formatDistanceToNow, format, isWithinInterval, subDays } from "date-fns";
import type { WorkflowExecution } from "@/db/schema";

interface ExecutionHistoryClientProps {
  workflow: { id: string; name: string };
  executions: WorkflowExecution[];
}

export function ExecutionHistoryClient({ workflow, executions: initialExecutions }: ExecutionHistoryClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [executionModeFilter, setExecutionModeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [executions, setExecutions] = useState(initialExecutions);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  // Refresh executions
  const refreshExecutions = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/workflows/${workflow.id}/executions`);
      if (response.ok) {
        const data = await response.json();
        setExecutions(data);
      }
    } catch (error) {
      console.error("Failed to refresh executions:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh for running executions
  useEffect(() => {
    const hasRunningExecutions = executions.some(
      (exec) => exec.status === "running" || exec.status === "pending"
    );

    if (hasRunningExecutions) {
      const interval = setInterval(refreshExecutions, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [executions]);

  const filteredExecutions = useMemo(() => {
    let filtered = executions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((exec) => 
        exec.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exec.error?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(exec.metadata).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((exec) => exec.status === statusFilter);
    }

    // Execution mode filter
    if (executionModeFilter !== "all") {
      filtered = filtered.filter((exec) => exec.executionMode === executionModeFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((exec) => {
        if (!exec.startedAt) return false;
        const execDate = new Date(exec.startedAt);
        switch (dateFilter) {
          case "today":
            return isWithinInterval(execDate, {
              start: new Date(now.setHours(0, 0, 0, 0)),
              end: new Date(now.setHours(23, 59, 59, 999))
            });
          case "week":
            return isWithinInterval(execDate, {
              start: subDays(now, 7),
              end: now
            });
          case "month":
            return isWithinInterval(execDate, {
              start: subDays(now, 30),
              end: now
            });
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [executions, searchTerm, statusFilter, dateFilter, executionModeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredExecutions.length / itemsPerPage);
  const paginatedExecutions = filteredExecutions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-error" />;
      case "running":
        return <RefreshCw className="w-5 h-5 text-info animate-spin" />;
      case "pending":
        return <Clock className="w-5 h-5 text-warning" />;
      default:
        return <AlertCircle className="w-5 h-5 text-base-content/60" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "badge badge-sm";
    switch (status) {
      case "completed":
        return `${baseClasses} badge-success`;
      case "failed":
        return `${baseClasses} badge-error`;
      case "running":
        return `${baseClasses} badge-info`;
      case "pending":
        return `${baseClasses} badge-warning`;
      default:
        return `${baseClasses} badge-ghost`;
    }
  };

  const executionStats = useMemo(() => {
    const stats = {
      total: executions.length,
      completed: executions.filter(e => e.status === "completed").length,
      failed: executions.filter(e => e.status === "failed").length,
      running: executions.filter(e => e.status === "running").length,
      pending: executions.filter(e => e.status === "pending").length,
    };
    return stats;
  }, [executions]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/workflows/${workflow.id}`} className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Workflow
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Execution History: {workflow.name}
              </h1>
              <p className="text-base-content/70">
                View all execution runs and their details
              </p>
            </div>
            <button
              onClick={refreshExecutions}
              className={`btn btn-circle btn-ghost ${isRefreshing ? 'animate-spin' : ''}`}
              disabled={isRefreshing}
              title="Refresh executions"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Total</div>
                <div className="stat-value text-2xl">{executionStats.total}</div>
              </div>
            </div>
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Completed</div>
                <div className="stat-value text-2xl text-success">{executionStats.completed}</div>
              </div>
            </div>
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Failed</div>
                <div className="stat-value text-2xl text-error">{executionStats.failed}</div>
              </div>
            </div>
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Running</div>
                <div className="stat-value text-2xl text-info">{executionStats.running}</div>
              </div>
            </div>
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Pending</div>
                <div className="stat-value text-2xl text-warning">{executionStats.pending}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {executions.length > 0 && (
          <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="card-title mb-4">
              <Filter className="w-5 h-5" />
              Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Search</span>
                </label>
                <div className="input-group">
                  <span>
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search executions..."
                    className="input input-bordered w-full"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Status</span>
                </label>
                <select 
                  className="select select-bordered w-full"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="running">Running</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Execution Mode Filter */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Execution Mode</span>
                </label>
                <select 
                  className="select select-bordered w-full"
                  value={executionModeFilter}
                  onChange={(e) => {
                    setExecutionModeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Modes</option>
                  <option value="immediate">Immediate</option>
                  <option value="queued">Queued</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Date Range</span>
                </label>
                <select 
                  className="select select-bordered w-full"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>

            {filteredExecutions.length !== executions.length && (
              <div className="mt-4 text-sm text-base-content/70">
                Showing {filteredExecutions.length} of {executions.length} executions
              </div>
            )}
          </div>
        </div>
        )}

        {executions.length === 0 ? (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center py-16">
              <Clock className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
              <h3 className="text-xl font-semibold mb-2">No Executions Yet</h3>
              <p className="text-base-content/60 mb-6">
                This workflow hasn't been executed yet.
              </p>
              <Link
                href={`/workflows/${workflow.id}/run`}
                className="btn btn-primary mx-auto"
              >
                Run Workflow Now
              </Link>
            </div>
          </div>
        ) : filteredExecutions.length === 0 ? (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center py-16">
              <Search className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
              <h3 className="text-xl font-semibold mb-2">No Executions Found</h3>
              <p className="text-base-content/60 mb-6">
                No executions match your filters. Try adjusting your search criteria.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setDateFilter("all");
                  setExecutionModeFilter("all");
                  setCurrentPage(1);
                }}
                className="btn btn-primary mx-auto"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
                >
                  <div className="card-body">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        {getStatusIcon(execution.status)}
                        <div>
                          <h3 className="font-semibold text-lg">
                            Execution {execution.id.slice(0, 8)}...
                          </h3>
                          <div className="mt-2 space-y-1 text-sm">
                            <p className="flex items-center gap-2">
                              <span className="font-medium">Started:</span>
                              <span>
                                {execution.startedAt 
                                  ? format(new Date(execution.startedAt), "PPpp")
                                  : "Not started"}
                              </span>
                              <span className="text-base-content/60">
                                {execution.startedAt 
                                  ? `(${formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })})`
                                  : ""}
                              </span>
                            </p>
                            {execution.completedAt && (
                              <p className="flex items-center gap-2">
                                <span className="font-medium">Completed:</span>
                                <span>{format(new Date(execution.completedAt), "PPpp")}</span>
                                <span className="text-base-content/60">
                                  (took {execution.startedAt 
                                    ? Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)
                                    : 0}s)
                                </span>
                              </p>
                            )}
                            <p className="flex items-center gap-2">
                              <span className="font-medium">Mode:</span>
                              <span className="badge badge-ghost badge-sm">
                                {execution.executionMode}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={getStatusBadge(execution.status)}>
                          {execution.status}
                        </span>
                        <Link
                          href={`/workflows/${workflow.id}/executions/${execution.id}`}
                          className="btn btn-sm btn-ghost"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>

                    {execution.error && (
                      <div className="mt-4 p-4 bg-error/10 border border-error/20 rounded-lg">
                        <h4 className="font-semibold text-error mb-2">Error Details:</h4>
                        <pre className="text-sm whitespace-pre-wrap text-error/80 font-mono">
                          {execution.error}
                        </pre>
                      </div>
                    )}

                    {execution.metadata && (
                      <div className="mt-4">
                        <details className="collapse collapse-arrow bg-base-200">
                          <summary className="collapse-title text-sm font-medium">
                            Metadata
                          </summary>
                          <div className="collapse-content">
                            <pre className="text-xs overflow-auto">
                              {JSON.stringify(execution.metadata, null, 2)}
                            </pre>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="join">
                  <button
                    className="join-item btn"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    «
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === totalPages || 
                      Math.abs(page - currentPage) <= 2
                    )
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <button className="join-item btn btn-disabled">...</button>
                        )}
                        <button
                          className={`join-item btn ${currentPage === page ? 'btn-active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                  <button
                    className="join-item btn"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}