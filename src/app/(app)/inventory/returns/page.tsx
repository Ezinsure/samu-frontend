"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { CoapListTable } from "@/features/coap/coap-list-table";
import type { DataTableColumn } from "@/components/shared/data-table";
import {
  canManageStock,
  getStockTransfers,
  transferStatusLabel,
  transferStatusTone,
  type StockTransfer,
} from "@/lib/api/stock";
import { useAuth } from "@/lib/auth/auth-context";
import { useListFilters } from "@/lib/hooks/use-list-filters";
import { useUserData } from "@/lib/hooks/use-user-data";

const PAGE_SIZE = 20;

export default function InventoryReturnsPage() {
  const { user } = useAuth();
  const { filters, applied, key, setPage } = useListFilters({
    search: "",
  });

  const columns: DataTableColumn<StockTransfer>[] = [
    {
      id: "holder",
      header: "Holder",
      cell: (row) => row.fromUser?.name ?? "—",
    },
    {
      id: "created",
      header: "Created",
      cell: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      id: "items",
      header: "Devices",
      cell: (row) => String(row.itemCount),
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
      id: "confirm",
      header: "Confirmations",
      cell: (row) =>
        `H:${row.holderConfirmed ? "✓" : "·"} O:${row.officeConfirmed ? "✓" : "·"}`,
    },
    {
      id: "actions",
      header: "",
      cell: (row) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/inventory/returns/${row.id}`}>Open</Link>
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
      }),
    `admin-returns:${key}`,
  );

  if (user && !canManageStock(user)) return <PermissionDenied />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Return applications"
        description="Review TC/COA return-to-office applications. Edits bump the revision; stock moves only when both sides confirm."
        actions={
          <Button asChild variant="secondary">
            <Link href="/inventory">Back to inventory</Link>
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
        emptyDescription="Returns appear here when holders submit devices back to the warehouse."
      />
    </div>
  );
}
