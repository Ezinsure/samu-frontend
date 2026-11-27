"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Download, Mail } from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { InventorySubnav } from "@/features/inventory/inventory-subnav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  canManageStock,
  downloadStockExportCsv,
  getStockAgingReport,
  getStockCatalogReport,
  getStockDiscrepancies,
  getStockIntakeBatch,
  getStockIntakeBatches,
  getStockLowStockReport,
  getStockReportsWorkspace,
  sendStockDigest,
  stockStatusLabel,
  stockStatusTone,
  transferStatusLabel,
  transferStatusTone,
  type StockAgingReport,
  type StockCatalogReport,
  type StockDiscrepancies,
  type StockIntakeBatchDetail,
  type StockIntakeBatchSummary,
  type StockLowStockReport,
  type StockReportsWorkspace,
} from "@/lib/api/stock";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function InventoryReportsPage() {
  const { user } = useAuth();
  const [agingDays, setAgingDays] = useState(30);
  const [workspace, setWorkspace] = useState<StockReportsWorkspace | null>(null);
  const [aging, setAging] = useState<StockAgingReport | null>(null);
  const [lowStock, setLowStock] = useState<StockLowStockReport | null>(null);
  const [discrepancies, setDiscrepancies] =
    useState<StockDiscrepancies | null>(null);
  const [batches, setBatches] = useState<StockIntakeBatchSummary[]>([]);
  const [catalog, setCatalog] = useState<StockCatalogReport | null>(null);
  const [batchDetail, setBatchDetail] =
    useState<StockIntakeBatchDetail | null>(null);
  const [batchDetailLoading, setBatchDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        workspaceData,
        agingData,
        lowStockData,
        discrepancyData,
        batchData,
        catalogData,
      ] = await Promise.all([
        getStockReportsWorkspace(agingDays),
        getStockAgingReport({ days: agingDays }),
        getStockLowStockReport(),
        getStockDiscrepancies(),
        getStockIntakeBatches({ page: 1, pageSize: 20 }),
        getStockCatalogReport(),
      ]);
      setWorkspace(workspaceData);
      setAging(agingData);
      setLowStock(lowStockData);
      setDiscrepancies(discrepancyData);
      setBatches(batchData.data);
      setCatalog(catalogData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load stock reports",
      );
    } finally {
      setLoading(false);
    }
  }, [agingDays]);

  useEffect(() => {
    if (canManageStock(user)) void load();
  }, [user, load]);

  if (user && !canManageStock(user)) return <PermissionDenied />;

  async function exportCsv(
    kind: "units" | "by_holder" | "movements" | "intake_batches" | "catalog",
  ) {
    setBusy(true);
    try {
      await downloadStockExportCsv({
        kind,
        days: kind === "movements" ? 90 : undefined,
      });
      toast.success("Export downloaded");
    } catch (err) {
      toast.error("Export failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  async function openBatch(id: string) {
    setBatchDetailLoading(true);
    setBatchDetail(null);
    try {
      const detail = await getStockIntakeBatch(id);
      setBatchDetail(detail);
    } catch (err) {
      toast.error("Could not load intake batch", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBatchDetailLoading(false);
    }
  }

  async function handleDigest() {
    setBusy(true);
    const result = await sendStockDigest();
    setBusy(false);
    if (!result.ok) {
      toast.error("Could not send digest", { description: result.error });
      return;
    }
    toast.success(
      `Digest sent to ${result.data.recipients} admin${result.data.recipients === 1 ? "" : "s"}`,
      { description: `${result.data.delivered} delivered via email provider` },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory reports"
        description="Unified catalog, intake composition, stock health, issues, and CSV exports for every device type."
        actions={
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void handleDigest()}
          >
            <Mail className="h-4 w-4" />
            Email digest
          </Button>
        }
      />
      <InventorySubnav />

      {error ? (
        <ErrorState
          title="Could not load reports"
          description={error}
          onRetry={() => void load()}
        />
      ) : loading || !workspace ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Total units" value={workspace.total} />
            <SummaryCard
              label={`Aging (≥${workspace.agingDays}d)`}
              value={workspace.agingCount}
            />
            <SummaryCard
              label="Low-stock types"
              value={workspace.lowStockCount}
            />
            <SummaryCard
              label="Open issues"
              value={workspace.discrepancies.total}
            />
          </div>

          <Tabs defaultValue="catalog" className="space-y-4">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
              <TabsTrigger value="catalog">Catalog</TabsTrigger>
              <TabsTrigger value="intake">Intake batches</TabsTrigger>
              <TabsTrigger value="health">Health</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="exports">Exports</TabsTrigger>
            </TabsList>

            <TabsContent value="catalog" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Overall composition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!catalog || catalog.composition.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No stock recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                        {catalog.composition.map((row) => (
                          <div
                            key={row.status}
                            className="h-full bg-primary/70"
                            style={{
                              width: `${Math.max(row.percent, 0.5)}%`,
                              opacity: 0.45 + row.percent / 200,
                            }}
                            title={`${row.label}: ${row.percent}%`}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {catalog.composition.map((row) => (
                          <span key={row.status}>
                            {row.label} {row.percent}% ({row.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">By device type</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(catalog?.byType ?? []).map((group) => (
                    <div
                      key={group.type.id}
                      className="rounded-md border border-border p-3"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-medium">{group.type.label}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {group.total} units
                        </p>
                      </div>
                      {group.composition.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {group.composition.map((row) => (
                            <span key={row.status}>
                              {row.label} {row.percent}% ({row.count})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">
                          No units yet
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {(catalog?.byAttribute.length ?? 0) > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      By category / brand / model
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(catalog?.byAttribute ?? []).map((group) => (
                      <div
                        key={`${group.type.id}-${group.label}`}
                        className="rounded-md border border-border p-3"
                      >
                        <p className="text-sm font-medium">
                          {group.type.label}: {group.label}{" "}
                          <span className="text-muted-foreground">
                            ({group.total})
                          </span>
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {group.composition.map((row) => (
                            <span key={row.status}>
                              {row.label} {row.percent}% ({row.count})
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>

            <TabsContent value="intake">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-base">Intake batches</CardTitle>
              <p className="text-sm text-muted-foreground">
                How each warehouse intake is used today
              </p>
            </CardHeader>
            <CardContent>
              {batches.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No intake batches yet. Use Intake on Inventory to record a
                  shipment.
                </p>
              ) : (
                <div className="space-y-4">
                  {batches.map((batch) => (
                    <button
                      key={batch.id}
                      type="button"
                      className="w-full rounded-md border border-border p-3 text-left transition hover:bg-muted/40"
                      onClick={() => void openBatch(batch.id)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{batch.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(batch.receivedAt).toLocaleDateString()}
                            {batch.type ? ` · ${batch.type.label}` : ""}
                            {batch.supplierRef
                              ? ` · ${batch.supplierRef}`
                              : ""}
                            {` · ${batch.unitCount} unit${batch.unitCount === 1 ? "" : "s"}`}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          View composition
                        </span>
                      </div>
                      {batch.composition.length > 0 ? (
                        <div className="mt-3 space-y-1.5">
                          <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                            {batch.composition.map((row) => (
                              <div
                                key={row.status}
                                className="h-full bg-primary/70 first:rounded-l-full last:rounded-r-full"
                                style={{
                                  width: `${Math.max(row.percent, 0.5)}%`,
                                  opacity: 0.45 + row.percent / 200,
                                }}
                                title={`${row.label}: ${row.percent}%`}
                              />
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {batch.composition.map((row) => (
                              <span key={row.status}>
                                {row.label} {row.percent}% ({row.count})
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-base">Aging devices</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  className="w-24"
                  value={agingDays}
                  onChange={(e) =>
                    setAgingDays(Math.max(1, Number(e.target.value) || 30))
                  }
                />
                <span className="text-sm text-muted-foreground">days</span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void load()}
                >
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!aging || aging.rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No devices held longer than {agingDays} days.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="pb-2 pr-3">Serial</th>
                        <th className="pb-2 pr-3">Type</th>
                        <th className="pb-2 pr-3">Holder</th>
                        <th className="pb-2 pr-3">Status</th>
                        <th className="pb-2">Age</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aging.rows.slice(0, 50).map((row) => (
                        <tr key={row.id} className="border-t border-border/70">
                          <td className="py-2 pr-3 font-mono">
                            <Link
                              href={`/inventory/${row.id}`}
                              className="hover:underline"
                            >
                              {row.serial}
                            </Link>
                          </td>
                          <td className="py-2 pr-3">{row.type.label}</td>
                          <td className="py-2 pr-3">
                            {row.holder?.name ?? "—"}
                          </td>
                          <td className="py-2 pr-3">
                            <StatusBadge
                              label={stockStatusLabel(row.status)}
                              tone={stockStatusTone(row.status)}
                              showIcon={false}
                            />
                          </td>
                          <td className="py-2 tabular-nums">{row.ageDays}d</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Low stock by type</CardTitle>
            </CardHeader>
            <CardContent>
              {!lowStock ? null : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="pb-2 pr-3">Type</th>
                        <th className="pb-2 pr-3">In warehouse</th>
                        <th className="pb-2 pr-3">Threshold</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStock.rows.map((row) => (
                        <tr
                          key={row.type.id}
                          className="border-t border-border/70"
                        >
                          <td className="py-2 pr-3">{row.type.label}</td>
                          <td className="py-2 pr-3 tabular-nums">
                            {row.inWarehouse}
                          </td>
                          <td className="py-2 pr-3 tabular-nums">
                            {row.threshold}
                          </td>
                          <td className="py-2">
                            <StatusBadge
                              label={row.isLow ? "Low" : "OK"}
                              tone={row.isLow ? "warning" : "success"}
                              showIcon={false}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="issues" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Open returns ({discrepancies?.openReturns.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(discrepancies?.openReturns.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">None open.</p>
                ) : (
                  discrepancies!.openReturns.slice(0, 8).map((row) => (
                    <Link
                      key={row.id}
                      href={`/inventory/returns/${row.id}`}
                      className="flex items-center justify-between rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm hover:bg-muted/30"
                    >
                      <span>
                        {row.fromUser?.name ?? "Holder"} · {row.itemCount}{" "}
                        device{row.itemCount === 1 ? "" : "s"}
                      </span>
                      <StatusBadge
                        label={transferStatusLabel(row.status)}
                        tone={transferStatusTone(row.status)}
                        showIcon={false}
                      />
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Declined / partial assignments (
                  {discrepancies?.declinedAssignments.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(discrepancies?.declinedAssignments.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">None.</p>
                ) : (
                  discrepancies!.declinedAssignments.slice(0, 8).map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm"
                    >
                      <span>
                        {row.toUser.name} · {row.flaggedItemCount} flagged
                      </span>
                      <StatusBadge
                        label={transferStatusLabel(row.status)}
                        tone={transferStatusTone(row.status)}
                        showIcon={false}
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Flagged serials ({discrepancies?.flaggedSerials.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(discrepancies?.flaggedSerials.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No missing/wrong flags.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="pb-2 pr-3">Serial</th>
                        <th className="pb-2 pr-3">Type</th>
                        <th className="pb-2 pr-3">Decision</th>
                        <th className="pb-2">Transfer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discrepancies!.flaggedSerials.slice(0, 40).map((row) => (
                        <tr
                          key={row.itemId}
                          className="border-t border-border/70"
                        >
                          <td className="py-2 pr-3 font-mono">{row.serial}</td>
                          <td className="py-2 pr-3">{row.typeLabel}</td>
                          <td className="py-2 pr-3">{row.decision}</td>
                          <td className="py-2 text-muted-foreground">
                            {row.transfer.kind} · {row.transfer.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="exports">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">CSV exports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Downloads use your current session. Movements cover the last
                    90 days. Catalog export includes type and brand/model
                    composition.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void exportCsv("catalog")}
                    >
                      <Download className="h-4 w-4" />
                      Catalog composition
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void exportCsv("units")}
                    >
                      <Download className="h-4 w-4" />
                      All units
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void exportCsv("by_holder")}
                    >
                      <Download className="h-4 w-4" />
                      By holder
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void exportCsv("movements")}
                    >
                      <Download className="h-4 w-4" />
                      Movements
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void exportCsv("intake_batches")}
                    >
                      <Download className="h-4 w-4" />
                      Intake batches
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      <Dialog
        open={Boolean(batchDetail) || batchDetailLoading}
        onOpenChange={(open) => {
          if (!open) {
            setBatchDetail(null);
            setBatchDetailLoading(false);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {batchDetail?.label ?? "Intake batch"}
            </DialogTitle>
            <DialogDescription>
              {batchDetail
                ? `${new Date(batchDetail.receivedAt).toLocaleDateString()}${
                    batchDetail.type ? ` · ${batchDetail.type.label}` : ""
                  }${
                    batchDetail.supplierRef
                      ? ` · ${batchDetail.supplierRef}`
                      : ""
                  } · ${batchDetail.unitCount} units`
                : "Loading composition…"}
            </DialogDescription>
          </DialogHeader>
          {batchDetailLoading && !batchDetail ? (
            <Skeleton className="h-40 w-full" />
          ) : batchDetail ? (
            <div className="space-y-4">
              <div className="space-y-2">
                {batchDetail.composition.map((row) => (
                  <div
                    key={row.status}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span>{row.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {row.percent}% · {row.count}
                    </span>
                  </div>
                ))}
              </div>
              {batchDetail.byType.length > 1 ? (
                <div className="space-y-3 border-t border-border pt-3">
                  <p className="text-sm font-medium">By device type</p>
                  {batchDetail.byType.map((group) => (
                    <div key={group.type.id} className="space-y-1 text-sm">
                      <p>
                        {group.type.label}{" "}
                        <span className="text-muted-foreground">
                          ({group.total})
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {group.composition.map((row) => (
                          <span key={row.status}>
                            {row.label} {row.percent}%
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {(batchDetail.byAttribute?.length ?? 0) > 0 ? (
                <div className="space-y-3 border-t border-border pt-3">
                  <p className="text-sm font-medium">By category / brand / model</p>
                  {(batchDetail.byAttribute ?? []).map((group) => (
                    <div
                      key={`${group.type.id}-${group.label}`}
                      className="space-y-1 text-sm"
                    >
                      <p>
                        {group.type.label}: {group.label}{" "}
                        <span className="text-muted-foreground">
                          ({group.total})
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {group.composition.map((row) => (
                          <span key={row.status}>
                            {row.label} {row.percent}% ({row.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Serials</p>
                  {batchDetail.unitsTruncated ? (
                    <p className="text-xs text-muted-foreground">
                      Showing first {batchDetail.units.length}
                    </p>
                  ) : null}
                </div>
                <div className="max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-background text-muted-foreground">
                      <tr>
                        <th className="py-1.5 pr-2 font-medium">Serial</th>
                        <th className="py-1.5 pr-2 font-medium">Status</th>
                        <th className="py-1.5 font-medium">Holder</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchDetail.units.map((unit) => (
                        <tr
                          key={unit.id}
                          className="border-t border-border/60"
                        >
                          <td className="py-1.5 pr-2 font-mono">
                            <Link
                              href={`/inventory/${unit.id}`}
                              className="hover:underline"
                            >
                              {unit.serial}
                            </Link>
                          </td>
                          <td className="py-1.5 pr-2">
                            <StatusBadge
                              label={stockStatusLabel(unit.status)}
                              tone={stockStatusTone(unit.status)}
                              showIcon={false}
                            />
                          </td>
                          <td className="py-1.5 text-muted-foreground">
                            {unit.holder?.name ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="space-y-1 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
