"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { FilterSelect } from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CoapListTable } from "@/features/coap/coap-list-table";
import { buildUnitColumns } from "@/features/inventory/unit-columns";
import {
  STOCK_UNIT_STATUS_OPTIONS,
  canUseMyStock,
  getMyStockOverview,
  getStockTransfers,
  getStockUnits,
  stockStatusLabel,
  stockStatusTone,
  type StockOverview,
  type StockTransfer,
  type StockUnitStatus,
} from "@/lib/api/stock";
import { useAuth } from "@/lib/auth/auth-context";
import { filterValue, useListFilters } from "@/lib/hooks/use-list-filters";
import { useUserData } from "@/lib/hooks/use-user-data";

const PAGE_SIZE = 20;

export default function MyStockPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<StockOverview | null>(null);
  const [incoming, setIncoming] = useState<StockTransfer[]>([]);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);

  const { filters, applied, key, setFilters, setPage } = useListFilters({
    search: "",
    status: "all",
  });

  const columns = useMemo(
    () => buildUnitColumns({ detailBasePath: "/my-stock/units" }),
    [],
  );

  const loadMeta = useCallback(async () => {
    setMetaLoading(true);
    setMetaError(null);
    try {
      const [overviewData, pending] = await Promise.all([
        getMyStockOverview(),
        getStockTransfers({
          page: 1,
          pageSize: 10,
          kind: "assignment",
          status: "pending",
          mine: true,
        }),
      ]);
      setOverview(overviewData);
      setIncoming(pending.data);
    } catch (err) {
      setMetaError(
        err instanceof Error ? err.message : "Could not load my stock",
      );
    } finally {
      setMetaLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canUseMyStock(user)) void loadMeta();
  }, [user, loadMeta]);

  const listState = useUserData(
    () =>
      getStockUnits({
        page: applied.page,
        pageSize: PAGE_SIZE,
        search: applied.search,
        status: filterValue<StockUnitStatus>(applied.status),
      }),
    `my-stock-units:${key}`,
  );

  if (user && !canUseMyStock(user)) return <PermissionDenied />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My stock"
        description="Devices assigned to you. Confirm incoming handoffs so serials stay accurate before sales logging."
        actions={
          <Button asChild variant="secondary">
            <Link href="/my-stock/returns">Return to office</Link>
          </Button>
        }
      />

      {metaError ? (
        <ErrorState
          title="Could not load stock summary"
          description={metaError}
          onRetry={() => void loadMeta()}
        />
      ) : metaLoading || !overview ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <>
          {(overview.pendingIncoming ?? incoming.length) > 0 ? (
            <Card className="border-amber-300/70 bg-amber-50/40">
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <PackageCheck className="h-4 w-4" />
                    Incoming devices need confirmation
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {overview.pendingIncoming ?? incoming.length} assignment
                    {(overview.pendingIncoming ?? incoming.length) === 1
                      ? ""
                      : "s"}{" "}
                    waiting for you to accept or flag missing/wrong items.
                  </p>
                </div>
                <Button asChild>
                  <Link
                    href={
                      incoming[0]
                        ? `/my-stock/incoming/${incoming[0].id}`
                        : "/my-stock"
                    }
                  >
                    Review incoming
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="space-y-1 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Total with you
                </p>
                <p className="text-2xl font-semibold tabular-nums">
                  {overview.total}
                </p>
              </CardContent>
            </Card>
            {(["in_transit", "with_holder"] as StockUnitStatus[]).map(
              (status) => (
                <Card key={status}>
                  <CardContent className="space-y-2 py-4">
                    <StatusBadge
                      label={stockStatusLabel(status)}
                      tone={stockStatusTone(status)}
                    />
                    <p className="text-2xl font-semibold tabular-nums">
                      {overview.byStatus[status] ?? 0}
                    </p>
                  </CardContent>
                </Card>
              ),
            )}
          </div>

          {overview.byType.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {overview.byType.map((row) => (
                <div
                  key={row.type.id}
                  className="rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-sm"
                >
                  <span className="font-medium">{row.type.label}</span>
                  <span className="ml-2 tabular-nums text-muted-foreground">
                    {row.total}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}

      {incoming.length > 1 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Pending assignments</p>
          <div className="space-y-2">
            {incoming.map((transfer) => (
              <Card key={transfer.id}>
                <CardContent className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm">
                    <p className="font-medium">
                      {transfer.itemCount} device
                      {transfer.itemCount === 1 ? "" : "s"} from{" "}
                      {transfer.createdBy.name}
                    </p>
                    <p className="text-muted-foreground">
                      {new Date(transfer.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/my-stock/incoming/${transfer.id}`}>
                      Open
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <FilterBar
        searchPlaceholder="Search serial or notes…"
        searchValue={filters.search}
        onSearchChange={(search) => setFilters({ search })}
        filters={
          <FilterSelect
            value={filters.status}
            onChange={(status) => setFilters({ status })}
            placeholder="Status"
            allLabel="All statuses"
            options={STOCK_UNIT_STATUS_OPTIONS.filter((o) =>
              ["in_transit", "with_holder", "sold", "returned_by_customer"].includes(
                o.value,
              ),
            )}
            widthClass="w-[180px]"
          />
        }
      />

      <CoapListTable
        state={listState}
        columns={columns}
        page={filters.page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No devices assigned yet"
        emptyDescription="When an admin assigns SIMs or routers to you, they will appear here after confirmation."
      />
    </div>
  );
}
