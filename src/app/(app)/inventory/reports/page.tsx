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
import {
  canManageStock,
  downloadStockExportCsv,
  getStockAgingReport,
  getStockDiscrepancies,
  getStockLowStockReport,
  getStockReportsWorkspace,
  sendStockDigest,
  stockStatusLabel,
  stockStatusTone,
  transferStatusLabel,
  transferStatusTone,
  type StockAgingReport,
  type StockDiscrepancies,
  type StockLowStockReport,
  type StockReportsWorkspace,
} from "@/lib/api/stock";
import { useAuth } from "@/lib/auth/auth-context";

export default function InventoryReportsPage() {
  const { user } = useAuth();
  const [agingDays, setAgingDays] = useState(30);
  const [workspace, setWorkspace] = useState<StockReportsWorkspace | null>(null);
  const [aging, setAging] = useState<StockAgingReport | null>(null);
  const [lowStock, setLowStock] = useState<StockLowStockReport | null>(null);
  const [discrepancies, setDiscrepancies] =
    useState<StockDiscrepancies | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [workspaceData, agingData, lowStockData, discrepancyData] =
        await Promise.all([
          getStockReportsWorkspace(agingDays),
          getStockAgingReport({ days: agingDays }),
          getStockLowStockReport(),
          getStockDiscrepancies(),
        ]);
      setWorkspace(workspaceData);
      setAging(agingData);
      setLowStock(lowStockData);
      setDiscrepancies(discrepancyData);
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

  async function exportCsv(kind: "units" | "by_holder" | "movements") {
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
        title="Stock reports"
        description="Aging, low-stock thresholds, discrepancies, CSV exports, and an optional admin digest."
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/inventory">Inventory</Link>
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void handleDigest()}
            >
              <Mail className="h-4 w-4" />
              Email digest
            </Button>
          </>
        }
      />

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
              label="Discrepancies"
              value={workspace.discrepancies.total}
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-base">Exports</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void exportCsv("units")}
                >
                  <Download className="h-4 w-4" />
                  Global stock CSV
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void exportCsv("by_holder")}
                >
                  <Download className="h-4 w-4" />
                  By holder CSV
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void exportCsv("movements")}
                >
                  <Download className="h-4 w-4" />
                  Movements CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Downloads use your current session. Movements export covers the
              last 90 days.
            </CardContent>
          </Card>

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
        </>
      )}
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
