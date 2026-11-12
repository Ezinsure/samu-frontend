"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { CreateReturnDialog } from "@/features/inventory/create-return-dialog";
import { CoapListTable } from "@/features/coap/coap-list-table";
import type { DataTableColumn } from "@/components/shared/data-table";
import {
  canUseMyStock,
  getStockTransfers,
  transferStatusLabel,
  transferStatusTone,
  type StockTransfer,
} from "@/lib/api/stock";
import { useAuth } from "@/lib/auth/auth-context";
import { useListFilters } from "@/lib/hooks/use-list-filters";
import { useUserData } from "@/lib/hooks/use-user-data";

const PAGE_SIZE = 20;

export default function MyStockReturnsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const { filters, applied, key, setPage } = useListFilters({
    search: "",
  });

  const columns: DataTableColumn<StockTransfer>[] = [
    {
      id: "created",
      header: "Created",
      cell: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      id: "items",
      header: "Devices",
      cell: (row) => `${row.itemCount}`,
    },
    {
      id: "reason",
      header: "Reason",
      cell: (row) => row.reasonCode ?? "—",
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge
          label={transferStatusLabel(row.status)}
          tone={transferStatusTone(row.status)}
        />
      ),
    },
    {
      id: "rev",
      header: "Rev",
      cell: (row) => String(row.revision),
    },
    {
      id: "actions",
      header: "",
      cell: (row) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/my-stock/returns/${row.id}`}>Open</Link>
        </Button>
      ),
    },
  ];

  const state = useUserData(
    () =>
      getStockTransfers({
        page: applied.page,
        pageSize: PAGE_SIZE,
        kind: "return",
        mine: true,
      }),
    `my-returns:${key}`,
  );

  if (user && !canUseMyStock(user)) return <PermissionDenied />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Return to office"
        description="Draft or submit devices back to the warehouse. Stock moves only after both you and the office confirm the same revision."
        actions={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New return
          </Button>
        }
      />

      <CoapListTable
        state={state}
        columns={columns}
        page={filters.page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No return applications"
        emptyDescription="Create a return when you need to send SIMs or routers back to the office."
      />

      <CreateReturnDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => {
          state.reload();
          router.push(`/my-stock/returns/${id}`);
        }}
      />
    </div>
  );
}
