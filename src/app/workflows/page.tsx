import { Suspense } from "react";
import { getWorkflows } from "@/lib/workflow/workflow-actions";
import WorkflowList from "@/components/workflows/workflow-list";
import { Plus, FileText } from "lucide-react";
import Link from "next/link";

export default async function WorkflowsPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; sort?: string; order?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const search = searchParams.search || "";
  const sortBy = (searchParams.sort as any) || "updatedAt";
  const sortOrder = (searchParams.order as any) || "desc";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-base-content/70 mt-2">
            Manage your automation workflows
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/workflows/templates" className="btn btn-outline">
            <FileText className="w-4 h-4" />
            Browse Templates
          </Link>
          <Link href="/workflows/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            New Workflow
          </Link>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
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