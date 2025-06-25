"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  deleteWorkflow, 
  deleteWorkflows, 
  duplicateWorkflow,
  type WorkflowWithStats 
} from "@/lib/workflow/workflow-actions";
import { 
  Search, 
  ChevronUp, 
  ChevronDown, 
  MoreVertical,
  Copy,
  Trash2,
  Play,
  Edit,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface WorkflowListProps {
  workflows: WorkflowWithStats[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  search: string;
  sortBy: string;
  sortOrder: string;
}

export default function WorkflowList({
  workflows,
  totalCount,
  totalPages,
  currentPage,
  search: initialSearch,
  sortBy,
  sortOrder,
}: WorkflowListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const updateSearchParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`/workflows?${params.toString()}`);
  }, [router, searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams({ search, page: "1" });
  };

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === "desc" ? "asc" : "desc";
    updateSearchParams({ sort: field, order: newOrder });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(workflows.map(w => w.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteWorkflow(id);
      } catch (error) {
        console.error("Failed to delete workflow:", error);
      } finally {
        setDeletingId(null);
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmed = confirm(`Delete ${selectedIds.size} workflow(s)?`);
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await deleteWorkflows(Array.from(selectedIds));
        setSelectedIds(new Set());
      } catch (error) {
        console.error("Failed to delete workflows:", error);
      }
    });
  };

  const handleDuplicate = async (id: string) => {
    startTransition(async () => {
      try {
        await duplicateWorkflow(id);
      } catch (error) {
        console.error("Failed to duplicate workflow:", error);
      }
    });
  };

  const handleRun = async (id: string) => {
    try {
      // Get the workflow data first
      const response = await fetch(`/api/workflow/${id}`);
      const workflow = await response.json();
      
      // Run the workflow using the API
      const runResponse = await fetch('/api/workflow/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workflowId: id,
          nodes: workflow.nodes, 
          initialState: workflow.initialState || {} 
        }),
      });
      
      const result = await runResponse.json();
      if (runResponse.ok) {
        // Redirect to execution detail page or show success
        router.push(`/workflows/${id}?execution=${result.executionId}`);
      } else {
        console.error('Failed to run workflow:', result.error);
        alert(`Failed to run workflow: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to run workflow:", error);
      alert('Failed to run workflow. Please try again.');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return sortOrder === "desc" ? 
      <ChevronDown className="w-4 h-4" /> : 
      <ChevronUp className="w-4 h-4" />;
  };

  const StatusBadge = ({ workflow }: { workflow: WorkflowWithStats }) => {
    const successRate = workflow.totalRuns > 0 
      ? (workflow.successfulRuns / workflow.totalRuns) * 100 
      : 0;

    if (workflow.totalRuns === 0) {
      return <span className="badge badge-ghost">Never run</span>;
    }

    if (successRate >= 90) {
      return <span className="badge badge-success">Healthy</span>;
    } else if (successRate >= 50) {
      return <span className="badge badge-warning">Warning</span>;
    } else {
      return <span className="badge badge-error">Issues</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="form-control">
            <div className="input-group">
              <input
                type="text"
                placeholder="Search workflows..."
                className="input input-bordered w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-square">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
              className="btn btn-error btn-outline"
              disabled={isPending}
            >
              <Trash2 className="w-4 h-4" />
              Delete {selectedIds.size} selected
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-visible relative">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>
                <label>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={selectedIds.size === workflows.length && workflows.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </label>
              </th>
              <th>
                <button
                  className="flex items-center gap-1 hover:text-primary"
                  onClick={() => handleSort("name")}
                >
                  Name
                  <SortIcon field="name" />
                </button>
              </th>
              <th>Status</th>
              <th>Last Run</th>
              <th>Success Rate</th>
              <th>
                <button
                  className="flex items-center gap-1 hover:text-primary"
                  onClick={() => handleSort("updatedAt")}
                >
                  Updated
                  <SortIcon field="updatedAt" />
                </button>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((workflow, index) => (
              <tr key={workflow.id} className={deletingId === workflow.id ? "opacity-50" : ""}>
                <td>
                  <label>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectedIds.has(workflow.id)}
                      onChange={(e) => handleSelect(workflow.id, e.target.checked)}
                    />
                  </label>
                </td>
                <td>
                  <div>
                    <Link 
                      href={`/workflows/${workflow.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {workflow.name}
                    </Link>
                    {workflow.description && (
                      <p className="text-sm text-base-content/60 mt-1">
                        {workflow.description}
                      </p>
                    )}
                  </div>
                </td>
                <td>
                  <StatusBadge workflow={workflow} />
                </td>
                <td>
                  {workflow.lastRun ? (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-base-content/60" />
                      <span className="text-sm">
                        {formatDistanceToNow(workflow.lastRun, { addSuffix: true })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-base-content/60">-</span>
                  )}
                </td>
                <td>
                  {workflow.totalRuns > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-sm">{workflow.successfulRuns}</span>
                      </div>
                      <div className="flex gap-1">
                        <XCircle className="w-4 h-4 text-error" />
                        <span className="text-sm">{workflow.failedRuns}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-base-content/60">-</span>
                  )}
                </td>
                <td>
                  <span className="text-sm">
                    {formatDistanceToNow(workflow.updatedAt, { addSuffix: true })}
                  </span>
                </td>
                <td>
                  <div className={`dropdown dropdown-end ${workflows.length <= 2 || index >= workflows.length - 2 ? 'dropdown-top' : ''}`}>
                    <label tabIndex={0} className="btn btn-ghost btn-sm btn-square">
                      <MoreVertical className="w-4 h-4" />
                    </label>
                    <ul
                      tabIndex={0}
                      className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-[100] mt-1"
                    >
                      <li>
                        <button onClick={() => handleRun(workflow.id)}>
                          <Play className="w-4 h-4" />
                          Run
                        </button>
                      </li>
                      <li>
                        <Link href={`/workflows/${workflow.id}/edit`}>
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <button onClick={() => handleDuplicate(workflow.id)}>
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                      </li>
                      <li>
                        <button 
                          onClick={() => handleDelete(workflow.id)}
                          className="text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {workflows.length === 0 && (
          <div className="text-center py-12">
            <p className="text-base-content/60">
              {search ? "No workflows found matching your search." : "No workflows yet."}
            </p>
            <Link href="/workflows/new" className="btn btn-primary mt-4">
              Create your first workflow
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="join">
            <button
              className="join-item btn"
              disabled={currentPage === 1}
              onClick={() => updateSearchParams({ page: String(currentPage - 1) })}
            >
              «
            </button>
            
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    className={`join-item btn ${page === currentPage ? "btn-active" : ""}`}
                    onClick={() => updateSearchParams({ page: String(page) })}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <button key={page} className="join-item btn btn-disabled">...</button>;
              }
              return null;
            })}
            
            <button
              className="join-item btn"
              disabled={currentPage === totalPages}
              onClick={() => updateSearchParams({ page: String(currentPage + 1) })}
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-base-300/50 flex items-center justify-center z-50">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}
    </div>
  );
}