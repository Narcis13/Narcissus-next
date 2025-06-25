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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";

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
          workflow: {
            id: workflow.id,
            nodes: workflow.nodes,
            inputs: workflow.initialState || {}
          },
          mode: 'auto'
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
      <ChevronDown className="ml-2 h-4 w-4" /> : 
      <ChevronUp className="ml-2 h-4 w-4" />;
  };

  const StatusBadge = ({ workflow }: { workflow: WorkflowWithStats }) => {
    const successRate = workflow.totalRuns > 0 
      ? (workflow.successfulRuns / workflow.totalRuns) * 100 
      : 0;

    if (workflow.totalRuns === 0) {
      return <Badge variant="secondary">Never run</Badge>;
    }

    if (successRate >= 90) {
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Healthy</Badge>;
    } else if (successRate >= 50) {
      return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>;
    } else {
      return <Badge variant="destructive">Issues</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search workflows..."
              className="flex-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <Button
              onClick={handleBulkDelete}
              variant="destructive"
              disabled={isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete {selectedIds.size} selected
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedIds.size === workflows.length && workflows.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("name")}
                >
                  Name
                  <SortIcon field="name" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Run</TableHead>
              <TableHead>Success Rate</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("updatedAt")}
                >
                  Updated
                  <SortIcon field="updatedAt" />
                </Button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.map((workflow, index) => (
              <TableRow key={workflow.id} className={deletingId === workflow.id ? "opacity-50" : ""}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(workflow.id)}
                    onCheckedChange={(checked) => handleSelect(workflow.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <Link 
                      href={`/workflows/${workflow.id}`}
                      className="font-medium hover:underline"
                    >
                      {workflow.name}
                    </Link>
                    {workflow.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {workflow.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge workflow={workflow} />
                </TableCell>
                <TableCell>
                  {workflow.lastRun ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDistanceToNow(workflow.lastRun, { addSuffix: true })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {workflow.totalRuns > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{workflow.successfulRuns}</span>
                      </div>
                      <div className="flex gap-1">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm">{workflow.failedRuns}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {formatDistanceToNow(workflow.updatedAt, { addSuffix: true })}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRun(workflow.id)}>
                        <Play className="mr-2 h-4 w-4" />
                        Run
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/workflows/${workflow.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/workflows/${workflow.id}/executions`}>
                          <Clock className="mr-2 h-4 w-4" />
                          View Executions
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(workflow.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(workflow.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {workflows.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {search ? "No workflows found matching your search." : "No workflows yet."}
            </p>
            <Button asChild className="mt-4">
              <Link href="/workflows/new">
                Create your first workflow
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => updateSearchParams({ page: String(currentPage - 1) })}
            >
              «
            </Button>
            
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="icon"
                    onClick={() => updateSearchParams({ page: String(page) })}
                  >
                    {page}
                  </Button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <Button key={page} variant="ghost" size="icon" disabled>
                    ...
                  </Button>
                );
              }
              return null;
            })}
            
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => updateSearchParams({ page: String(currentPage + 1) })}
            >
              »
            </Button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <Spinner className="h-8 w-8" />
        </div>
      )}
    </div>
  );
}