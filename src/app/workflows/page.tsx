import { Suspense } from "react";
import { getWorkflows } from "@/lib/workflow/workflow-actions";
import WorkflowList from "@/components/workflows/workflow-list";
import { Plus, FileText, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default async function WorkflowsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sort?: string; order?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const sortBy = params.sort as "name" | "createdAt" | "updatedAt" | "lastRun" || "updatedAt";
  const sortOrder = params.order as "desc" | "asc" || "desc";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground mt-2">
            Manage your automation workflows
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/workflows/visualize">
              <Eye className="w-4 h-4 mr-2" />
              Visualize
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/workflows/templates">
              <FileText className="w-4 h-4 mr-2" />
              Browse Templates
            </Link>
          </Button>
          <Button asChild>
            <Link href="/workflows/new">
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </Link>
          </Button>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        }
      >
        <WorkflowListContent
          page={page}
          search={search}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
      </Suspense>
    </div>
  );
}

async function WorkflowListContent({
  page,
  search,
  sortBy,
  sortOrder,
}: {
  page: number;
  search: string;
  sortBy: string;
  sortOrder: string;
}) {
  const { workflows, totalCount, totalPages } = await getWorkflows({
    page,
    search,
    sortBy,
    sortOrder,
    pageSize: 10,
  });

  return (
    <WorkflowList
      workflows={workflows}
      totalCount={totalCount}
      totalPages={totalPages}
      currentPage={page}
      search={search}
      sortBy={sortBy}
      sortOrder={sortOrder}
    />
  );
}