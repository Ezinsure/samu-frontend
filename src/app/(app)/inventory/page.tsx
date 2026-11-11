"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PackagePlus } from "lucide-react";
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
import { IntakeDialog } from "@/features/inventory/intake-dialog";
import { buildUnitColumns } from "@/features/inventory/unit-columns";
import {
  STOCK_UNIT_STATUS_OPTIONS,
  canManageStock,
  getStockOverview,
  getStockTypes,
  getStockUnits,
  stockStatusLabel,
  stockStatusTone,
  type StockItemType,
  type StockOverview,
  type StockUnitStatus,
} from "@/lib/api/stock";
import { useAuth } from "@/lib/auth/auth-context";
import { filterValue, useListFilters } from "@/lib/hooks/use-list-filters";
import { useUserData } from "@/lib/hooks/use-user-data";

const PAGE_SIZE = 20;

const OVERVIEW_STATUSES: StockUnitStatus[] = [
  "in_warehouse",
  "in_transit",
  "with_holder",
  "sold",
];

export default function InventoryPage() {
  const { user } = useAuth();
  const [types, setTypes] = useState<StockItemType[]>([]);
  const [overview, setOverview] = useState<StockOverview | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [listVersion, setListVersion] = useState(0);

  const { filters, applied, key, setFilters, setPage } = useListFilters({
    search: "",
    typeKey: "all",
    status: "all",
  });

  const columns = useMemo(() => buildUnitColumns(), []);

  const loadMeta = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const [overviewData, typeRows] = await Promise.all([
        getStockOverview(),
        getStockTypes({ includeDisabled: true }),
      ]);
      setOverview(overviewData);
      setTypes(typeRows);
    } catch (err) {
      setOverviewError(
        err instanceof Error ? err.message : "Could not load inventory overview",
      );
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManageStock(user)) void loadMeta();
  }, [user, loadMeta, listVersion]);

  const listState = useUserData(
    () =>
      getStockUnits({
        page: applied.page,
        pageSize: PAGE_SIZE,
        search: applied.search,
        typeKey: filterValue(applied.typeKey),
        status: filterValue<StockUnitStatus>(applied.status),
      }),
    `stock-units:${key}:${listVersion}`,
  );

  const typeOptions = useMemo(
    () =>
      types
        .filter((t) => t.enabled || t.unitCount > 0)
        .map((t) => ({ value: t.key, label: t.label })),
    [types],
  );

  if (user && !canManageStock(user)) return <PermissionDenied />;

  function refreshAll() {
    setListVersion((v) => v + 1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devices & stock"
        description="Warehouse catalog for SIMs and routers. Intake serials now; assign and accept come in the next phase."
        actions={
          <Button type="button" onClick={() => setIntakeOpen(true)}>
            <PackagePlus className="h-4 w-4" />
            Intake devices
          </Button>
        }
      />

      {overviewError ? (
        <ErrorState
          title="Could not load overview"
          description={overviewError}
          onRetry={() => void loadMeta()}
        />
      ) : overviewLoading || !overview ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="space-y-1 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total units
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {overview.total}
              </p>
            </CardContent>
          </Card>
          {OVERVIEW_STATUSES.map((status) => (
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
          ))}
        </div>
      )}

      {types.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {types
            .filter((t) => t.enabled)
            .map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() =>
                  setFilters({
                    typeKey:
                      filters.typeKey === type.key ? "all" : type.key,
                  })
                }
                className={`rounded-[var(--radius-md)] border px-3 py-1.5 text-left text-sm transition-colors ${
                  filters.typeKey === type.key
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <span className="font-medium">{type.label}</span>
                <span className="ml-2 tabular-nums text-muted-foreground">
                  {type.unitCount}
                </span>
              </button>
            ))}
        </div>
      ) : null}

      <FilterBar
        searchPlaceholder="Search serial or notes…"
        searchValue={filters.search}
        onSearchChange={(search) => setFilters({ search })}
        filters={
          <>
            <FilterSelect
              value={filters.typeKey}
              onChange={(typeKey) => setFilters({ typeKey })}
              placeholder="Type"
              allLabel="All types"
              options={typeOptions}
              widthClass="w-[210px]"
            />
            <FilterSelect
              value={filters.status}
              onChange={(status) => setFilters({ status })}
              placeholder="Status"
              allLabel="All statuses"
              options={STOCK_UNIT_STATUS_OPTIONS}
              widthClass="w-[180px]"
            />
          </>
        }
      />

      <CoapListTable
        state={listState}
        columns={columns}
        page={filters.page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No devices yet"
        emptyDescription="Intake SIM or router serials to start the warehouse ledger."
      />

      <IntakeDialog
        open={intakeOpen}
        onOpenChange={setIntakeOpen}
        types={types}
        defaultTypeKey={
          filters.typeKey !== "all" ? filters.typeKey : undefined
        }
        onCompleted={refreshAll}
      />
    </div>
  );
}
