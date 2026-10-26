import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AsyncDataState } from "@/lib/hooks/use-async-data";
import type { Paginated } from "@/types";

interface CoapListTableProps<T extends { id: string }> {
  state: AsyncDataState<Paginated<T>>;
  columns: DataTableColumn<T>[];
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  emptyTitle: string;
  emptyDescription: string;
}

/** Loading / error / table body shared by the COAP list pages. */
export function CoapListTable<T extends { id: string }>({
  state,
  columns,
  page,
  pageSize,
  onPageChange,
  emptyTitle,
  emptyDescription,
}: CoapListTableProps<T>) {
  if (state.error) {
    return (
      <ErrorState
        title="Could not load this list"
        description={state.error}
        onRetry={state.reload}
      />
    );
  }
  if (state.loading || !state.data) return <Skeleton className="h-72 w-full" />;

  return (
    <DataTable
      data={state.data.data}
      getRowId={(row) => row.id}
      columns={columns}
      page={page}
      pageSize={pageSize}
      total={state.data.total}
      onPageChange={onPageChange}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
    />
  );
}

/** Trailing "Open" link used in the actions column of list tables. */
export function OpenLink({ href }: { href: string }) {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link href={href}>Open</Link>
    </Button>
  );
}
