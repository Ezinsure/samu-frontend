"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { DocumentViewer } from "@/components/shared/document-viewer";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { StatusBadge } from "@/components/shared/status-badge";
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
  getCoaEvidenceFileUrl,
  type AdminCoaDetail,
  type AdminCoaMonthReport,
  type AdminCoaReportRow,
} from "@/lib/api/coa-performance";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminCoaPerformancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState<AdminCoaMonthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminCoaDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [viewingFileId, setViewingFileId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminCoaMonthReport(month);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load report");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

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

  async function openDetail(row: AdminCoaReportRow) {
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
  }

  async function onExport() {
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
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="COA performance"
        description="Track monthly imihigo attainment for every Community Opportunity Associate against shared targets."
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
      ) : loading || !report ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-foreground-muted">Active COAs</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {report.totals.coaCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-foreground-muted">Enabled metrics</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {report.metrics.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-foreground-muted">
                  Avg. attainment
                </p>
                <p className="text-2xl font-semibold tabular-nums">
                  {report.totals.averageOverallPercent}%
                </p>
              </CardContent>
            </Card>
          </div>

          {report.rows.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-foreground-muted">
                No active COA accounts yet. Import or create COA users to start
                tracking.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {report.rows.map((row) => (
                <Card key={row.coa.id}>
                  <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-base">{row.coa.name}</CardTitle>
                      <p className="text-xs text-foreground-muted">
                        {row.coa.email}
                        {row.coa.workingDistrict
                          ? ` · ${row.coa.workingDistrict}`
                          : ""}
                      </p>
                      <p className="text-xs text-foreground-secondary">
                        {row.metricsMet}/{row.metricsTotal} targets met ·{" "}
                        {row.overallPercent}% average
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={detailLoading}
                      onClick={() => void openDetail(row)}
                    >
                      View evidence
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {row.progress.map((p) => (
                      <div key={p.metric.id} className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate font-medium">
                            {p.metric.label}
                          </span>
                          <span className="shrink-0 tabular-nums text-foreground-muted">
                            {p.actual}/{p.target}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${
                              p.met ? "bg-success" : "bg-primary-600"
                            }`}
                            style={{ width: `${p.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
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
                      {p.actual} / {p.target} ({p.percent}%)
                    </p>
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
                          {entry.clients.map((c) => (
                            <li key={c.id}>
                              {c.fullName}
                              {c.phone ? ` · ${c.phone}` : ""}
                              {c.email ? ` · ${c.email}` : ""}
                              {c.accountRef ? ` · Acc ${c.accountRef}` : ""}
                              {c.simNumber ? ` · SIM ${c.simNumber}` : ""}
                            </li>
                          ))}
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
    </div>
  );
}
