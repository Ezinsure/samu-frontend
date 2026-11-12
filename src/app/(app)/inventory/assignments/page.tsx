"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FilterBar } from "@/components/shared/filter-bar";
import { FilterSelect } from "@/components/shared/filter-select";
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
  type StockTransferStatus,
} from "@/lib/api/stock";
import { useAuth } from "@/lib/auth/auth-context";
import { filterValue, useListFilters } from "@/lib/hooks/use-list-filters";
import { useUserData } from "@/lib/hooks/use-user-data";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "partially_accepted", label: "Partially accepted" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
];

export default function InventoryAssignmentsPage() {
  const { user } = useAuth();
  const { filters, applied, key, setFilters, setPage } = useListFilters({
    search: "",
    status: "all",
  });

  const columns = useMemo((): DataTableColumn<StockTransfer>[] => {
    return [
      {
        id: "created",
        header: "Created",
        cell: (row) => new Date(row.createdAt).toLocaleString(),
      },
      {
        id: "to",
        header: "Assignee",
        cell: (row) => (
          <div>
            <p className="font-medium">{row.toUser.name}</p>
            <p className="text-xs text-muted-foreground">{row.toUser.email}</p>
          </div>
        ),
      },
      {
        id: "items",
        header: "Devices",
        cell: (row) => (
          <span className="tabular-nums">{row.itemCount}</span>
        ),
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
        id: "flags",
        header: "Flags",
        cell: (row) => {
          const flagged = row.items.filter((item) =>
            ["missing", "wrong", "declined"].includes(item.decision),
          );
          if (flagged.length === 0) return "—";
          return flagged
            .slice(0, 3)
            .map((item) => `${item.serial}:${item.decision}`)
            .join(", ");
        },
      },
      {
        id: "actions",
        header: "",
        cell: (row) => (
          <Button asChild size="sm" variant="secondary">
            <Link href={`/inventory/assignments/${row.id}`}>Open</Link>
          </Button>
        ),
      },
    ];
  }, []);

  const listState = useUserData(
    () =>
      getStockTransfers({
        page: applied.page,
        pageSize: PAGE_SIZE,
        kind: "assignment",
        status: filterValue<StockTransferStatus>(applied.status),
      }),
    `inventory-assignments:${key}`,
  );

  if (user && !canManageStock(user)) return <PermissionDenied />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="History of warehouse handoffs to TCs and COAs, including accept/missing/wrong outcomes."
        actions={
          <Button asChild variant="secondary">
            <Link href="/inventory">Back to devices</Link>
          </Button>
        }
      />

      <FilterBar
        filters={
          <FilterSelect
            placeholder="Status"
            value={filters.status}
            allLabel="All statuses"
            options={STATUS_OPTIONS}
            onChange={(status) => setFilters({ status })}
          />
        }
      />

      <CoapListTable
        state={listState}
        columns={columns}
        page={applied.page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No assignments yet"
        emptyDescription="Assign warehouse serials from Devices & stock to see them here."
      />
    </div>
  );
}
