"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { DocumentViewer } from "@/components/shared/document-viewer";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { evidenceTypeLabel } from "@/lib/api/coa-metrics";
import {
  downloadAdminCoaReportCsv,
  getAdminCoaDetail,
  getAdminCoaMonthReport,
  getCoaClientDocUrl,
  getCoaEvidenceFileUrl,
  type AdminCoaDetail,
  type AdminCoaMonthReport,
  type AdminCoaReportRow,
} from "@/lib/api/coa-performance";

const PAGE_SIZE = 20;

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function clientDocEntries(
  data: Record<string, unknown> | undefined,
): Array<{ fieldKey: string; label: string; storageKey: string; originalName: string }> {
  if (!data) return [];
  const labels: Record<string, string> = {
    nationalIdDocument: "National ID",
    clientSignedAgreement: "Agreement",
  };
  const out: Array<{
    fieldKey: string;
    label: string;
    storageKey: string;
    originalName: string;
  }> = [];
  for (const [fieldKey, label] of Object.entries(labels)) {
    const meta = data[fieldKey];
    const storageKey =
      typeof meta === "string"
        ? meta.trim()
        : meta &&
            typeof meta === "object" &&
            "storageKey" in meta &&
            typeof (meta as { storageKey: unknown }).storageKey === "string"
          ? String((meta as { storageKey: string }).storageKey).trim()
          : "";
    if (!storageKey) continue;
    const originalName =
      meta &&
      typeof meta === "object" &&
      "originalName" in meta &&
      typeof (meta as { originalName: unknown }).originalName === "string"
        ? String((meta as { originalName: string }).originalName)
        : label;
    out.push({ fieldKey, label, storageKey, originalName });
  }
  return out;
}

function attainmentStatus(row: AdminCoaReportRow): {
  label: string;
  tone: StatusTone;
} {
  if (row.metricsTotal === 0) {
    return { label: "No metrics", tone: "neutral" };
  }
  if (row.metricsMet === row.metricsTotal) {
    return { label: "All met", tone: "success" };
  }
  if (row.overallPercent >= 70) {
    return { label: "On track", tone: "info" };
  }
  if (row.overallPercent >= 40) {
    return { label: "Behind", tone: "warning" };
  }
  return { label: "At risk", tone: "danger" };
}

function collectiveMetricSummary(report: AdminCoaMonthReport) {
  return report.metrics.map((metric) => {
    let actual = 0;
    let verified = 0;
    let target = 0;
    let coasMet = 0;
    for (const row of report.rows) {
      const progress = row.progress.find((p) => p.metric.id === metric.id);
      if (!progress) continue;
      actual += progress.actual;
      verified += progress.verified ?? 0;
      target += progress.target;
      if (progress.met) coasMet += 1;
    }
    const percent =
      target <= 0 ? 0 : Math.min(100, Math.round((actual / target) * 100));
    return {
      metric,
      actual,
      verified,
      target,
      percent,
      coasMet,
      coaCount: report.rows.length,
    };
  });
}

export default function AdminCoaPerformancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState<AdminCoaMonthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<AdminCoaDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [viewingFileId, setViewingFileId] = useState<string | null>(null);
  const [viewingClientDoc, setViewingClientDoc] = useState<{
    storageKey: string;
    originalName: string;
  } | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminCoaMonthReport(month);
      setReport(data);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load report");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const overview = useMemo(() => {
    if (!report) return null;
    const fullyMet = report.rows.filter(
      (row) => row.metricsTotal > 0 && row.metricsMet === row.metricsTotal,
    ).length;
    const atRisk = report.rows.filter(
      (row) => row.metricsTotal > 0 && row.overallPercent < 40,
    ).length;
    return {
      ...report.totals,
      fullyMet,
      atRisk,
      metricSummaries: collectiveMetricSummary(report),
    };
  }, [report]);

  const filteredRows = useMemo(() => {
    if (!report) return [];
    const q = search.trim().toLowerCase();
    if (!q) return report.rows;
    return report.rows.filter((row) => {
      const haystack = [
        row.coa.name,
        row.coa.email,
        row.coa.workingDistrict ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [report, search]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const openDetail = useCallback(
    async (row: AdminCoaReportRow) => {
      setDetailLoading(true);
      try {
        const data = await getAdminCoaDetail(row.coa.id, month);
        setDetail(data);
      } catch (err) {
        toast.error("Could not load COA detail", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setDetailLoading(false);
      }
    },
    [month],
  );

  const onExport = useCallback(async () => {
    setExporting(true);
    try {
      await downloadAdminCoaReportCsv(month);
      toast.success("CSV downloaded");
    } catch (err) {
      toast.error("CSV export failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setExporting(false);
    }
  }, [month]);

  const columns = useMemo((): DataTableColumn<AdminCoaReportRow>[] => {
    return [
      {
        id: "coa",
        header: "COA",
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium">{row.coa.name}</p>
            <p className="truncate text-xs text-foreground-muted">
              {row.coa.email}
            </p>
          </div>
        ),
      },
      {
        id: "district",
        header: "District",
        cell: (row) => row.coa.workingDistrict || "—",
      },
      {
        id: "targets",
        header: "Targets met",
        align: "right",
        cell: (row) => `${row.metricsMet}/${row.metricsTotal}`,
      },
      {
        id: "overall",
        header: "Overall",
        align: "right",
        cell: (row) => (
          <div className="inline-flex min-w-[7rem] flex-col items-end gap-1">
            <span className="tabular-nums font-medium">
              {row.overallPercent}%
            </span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${
                  row.metricsMet === row.metricsTotal && row.metricsTotal > 0
                    ? "bg-success"
                    : "bg-primary-600"
                }`}
                style={{ width: `${Math.min(100, row.overallPercent)}%` }}
              />
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => {
          const status = attainmentStatus(row);
          return <StatusBadge label={status.label} tone={status.tone} />;
        },
      },
      {
        id: "actions",
        header: "",
        className: "w-[1%] whitespace-nowrap",
        cell: (row) => (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={detailLoading}
            onClick={() => void openDetail(row)}
          >
            Open
          </Button>
        ),
      },
    ];
  }, [detailLoading, openDetail]);

  if (!isAdmin) {
    return (
      <PermissionDenied
        action={
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="COA performance"
        description="Network-wide monthly imihigo attainment, with per-COA detail on demand."
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/coa-metrics">Manage metrics</Link>
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={exporting || !report}
              onClick={() => void onExport()}
            >
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="space-y-1.5">
            <label className="text-sm text-foreground-secondary" htmlFor="month">
              Month
            </label>
            <Input
              id="month"
              type="month"
              className="w-44"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label
              className="text-sm text-foreground-secondary"
              htmlFor="coa-search"
            >
              Find COA
            </label>
            <Input
              id="coa-search"
              className="w-64"
              placeholder="Name, email, or district"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button type="button" onClick={() => void load()}>
            Refresh
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <ErrorState
          title="Could not load COA performance"
          description={error}
          onRetry={() => void load()}
        />
      ) : loading || !report || !overview ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-foreground-muted">Active COAs</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {overview.coaCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-foreground-muted">
                  Network attainment
                </p>
                <p className="text-2xl font-semibold tabular-nums">
                  {overview.averageOverallPercent}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-foreground-muted">Fully on target</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {overview.fullyMet}
                  <span className="ml-1 text-sm font-normal text-foreground-muted">
                    / {overview.coaCount}
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-foreground-muted">At risk (&lt;40%)</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {overview.atRisk}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Collective targets</CardTitle>
              <p className="text-sm text-foreground-muted">
                Combined progress across all active COAs for {report.month}.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {overview.metricSummaries.length === 0 ? (
                <p className="text-sm text-foreground-muted">
                  No enabled metrics for this month.
                </p>
              ) : (
                overview.metricSummaries.map((item) => (
                  <div key={item.metric.id} className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-medium">{item.metric.label}</span>
                      <span className="tabular-nums text-foreground-muted">
                        {item.metric.key === "ezinsure_agents_applied"
                          ? `${item.actual} logged · ${item.verified} verified / ${item.target}`
                          : `${item.actual}/${item.target}`}
                        {" · "}
                        {item.coasMet}/{item.coaCount} COAs met
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${
                          item.percent >= 100 ? "bg-success" : "bg-primary-600"
                        }`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {report.rows.length === 0 ? (
            <Card>
              <CardContent className="space-y-3 py-10 text-center text-sm text-foreground-muted">
                <p>
                  No active COA accounts yet. Import or create COA users to start
                  tracking.
                </p>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/users">Open Users &amp; access</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">COA roster</h2>
                  <p className="text-sm text-foreground-muted">
                    Overall attainment only — open a COA for metric breakdown and
                    evidence.
                  </p>
                </div>
                <p className="text-xs text-foreground-muted tabular-nums">
                  {filteredRows.length} of {report.rows.length}
                </p>
              </div>
              <DataTable
                columns={columns}
                data={pagedRows}
                getRowId={(row) => row.coa.id}
                emptyTitle="No matching COAs"
                emptyDescription="Try a different name, email, or district."
                page={page}
                pageSize={PAGE_SIZE}
                total={filteredRows.length}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      <Dialog
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle>{detail.coa.name}</DialogTitle>
                <DialogDescription>
                  {detail.month} · {detail.coa.email}
                  {detail.coa.workingDistrict
                    ? ` · ${detail.coa.workingDistrict}`
                    : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-2 sm:grid-cols-2">
                {detail.progress.map((p) => (
                  <div
                    key={p.metric.id}
                    className="rounded-md border border-border p-3 text-sm"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">{p.metric.label}</span>
                      <StatusBadge
                        label={evidenceTypeLabel(p.metric.evidenceType)}
                        tone="info"
                      />
                      {p.met ? (
                        <StatusBadge label="Met" tone="success" />
                      ) : null}
                    </div>
                    <p className="tabular-nums text-foreground-muted">
                      {p.metric.key === "ezinsure_agents_applied"
                        ? `${p.actual} logged · ${p.verified ?? 0} verified / ${p.target} (${p.percent}%)`
                        : `${p.actual} / ${p.target} (${p.percent}%)`}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${
                          p.met ? "bg-success" : "bg-primary-600"
                        }`}
                        style={{ width: `${p.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-border pt-3">
                <h3 className="text-sm font-semibold">Evidence log</h3>
                {detail.entries.length === 0 ? (
                  <p className="text-sm text-foreground-muted">
                    No evidence logged this month.
                  </p>
                ) : (
                  detail.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="space-y-2 rounded-md border border-border p-3 text-sm"
                    >
                      <p className="font-medium">
                        {entry.metricLabel ?? entry.metricKey}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {new Date(entry.loggedAt).toLocaleString()}
                        {entry.notes ? ` · ${entry.notes}` : ""}
                      </p>
                      {entry.clients.length > 0 ? (
                        <ul className="space-y-1 text-xs text-foreground-secondary">
                          {entry.clients.map((c) => {
                            const data = c.data ?? {};
                            const bits = [c.fullName];
                            if (c.variantKey && c.variantKey !== "sim") {
                              bits.push(c.variantKey.toUpperCase());
                            }
                            if (c.phone) bits.push(c.phone);
                            if (c.email) bits.push(c.email);
                            if (c.accountRef) bits.push(`Acc ${c.accountRef}`);
                            if (c.simNumber) bits.push(`SIM ${c.simNumber}`);
                            if (
                              typeof data.routerSerial === "string" &&
                              data.routerSerial
                            ) {
                              bits.push(`Router ${data.routerSerial}`);
                            }
                            if (typeof data.speed === "string" && data.speed) {
                              bits.push(data.speed);
                            }
                            if (
                              typeof data.district === "string" &&
                              data.district
                            ) {
                              bits.push(data.district);
                            }
                            if (c.gpsLat != null && c.gpsLng != null) {
                              bits.push(
                                `${c.gpsLat.toFixed(4)}, ${c.gpsLng.toFixed(4)}`,
                              );
                            }
                            const docs = clientDocEntries(c.data);
                            return (
                              <li
                                key={c.id}
                                className="flex flex-wrap items-center gap-2"
                              >
                                <span>{bits.join(" · ")}</span>
                                {docs.map((doc) => (
                                  <Button
                                    key={doc.fieldKey}
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() =>
                                      setViewingClientDoc({
                                        storageKey: doc.storageKey,
                                        originalName: doc.originalName,
                                      })
                                    }
                                  >
                                    {doc.label}
                                  </Button>
                                ))}
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                      {entry.files.length > 0 ? (
                        <ul className="space-y-1">
                          {entry.files.map((f) => (
                            <li
                              key={f.id}
                              className="flex items-center justify-between gap-2 text-xs"
                            >
                              <span className="truncate">{f.originalName}</span>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => setViewingFileId(f.id)}
                              >
                                View
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <DocumentViewer
        open={Boolean(viewingFileId)}
        onOpenChange={(open) => {
          if (!open) setViewingFileId(null);
        }}
        loadSource={
          viewingFileId
            ? () => getCoaEvidenceFileUrl(viewingFileId)
            : undefined
        }
      />
      <DocumentViewer
        open={Boolean(viewingClientDoc)}
        onOpenChange={(open) => {
          if (!open) setViewingClientDoc(null);
        }}
        loadSource={
          viewingClientDoc
            ? async () => {
                const src = await getCoaClientDocUrl(
                  viewingClientDoc.storageKey,
                );
                return {
                  ...src,
                  originalName:
                    viewingClientDoc.originalName || src.originalName,
                };
              }
            : undefined
        }
      />
    </div>
  );
}
