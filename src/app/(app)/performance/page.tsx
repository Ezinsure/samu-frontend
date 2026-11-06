"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogClientsDialog } from "@/features/coa-performance/log-clients-dialog";
import { LogFilesDialog } from "@/features/coa-performance/log-files-dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { evidenceTypeLabel, type CoaMetric } from "@/lib/api/coa-metrics";
import {
  deleteCoaClient,
  deleteCoaEntry,
  deleteCoaEvidenceFile,
  getCoaEvidenceFileUrl,
  getMyCoaProgress,
  listCoaEntries,
  type CoaPerformanceEntry,
  type CoaProgressRow,
} from "@/lib/api/coa-performance";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(ym: string, delta: number): string {
  const [yRaw, mRaw] = ym.split("-");
  const y = Number(yRaw);
  const m = Number(mRaw);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(ym: string): string {
  const [yRaw, mRaw] = ym.split("-");
  const d = new Date(Date.UTC(Number(yRaw), Number(mRaw) - 1, 1));
  return d.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function CoaPerformanceLogPage() {
  const { user } = useAuth();
  const canUse =
    user?.role === "COMMUNITY_OPPORTUNITY_ASSOCIATE" ||
    user?.role === "ADMIN";

  const [tab, setTab] = useState("overview");
  const [month, setMonth] = useState(currentMonth);
  const [evidenceFrom, setEvidenceFrom] = useState(currentMonth);
  const [evidenceTo, setEvidenceTo] = useState(currentMonth);
  const [metricKey, setMetricKey] = useState("all");

  const [rows, setRows] = useState<CoaProgressRow[]>([]);
  const [entries, setEntries] = useState<CoaPerformanceEntry[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientMetric, setClientMetric] = useState<CoaMetric | null>(null);
  const [fileMetric, setFileMetric] = useState<CoaMetric | null>(null);
  const [viewingFileId, setViewingFileId] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    setError(null);
    try {
      const progress = await getMyCoaProgress(month);
      setRows(progress.rows);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load performance",
      );
    } finally {
      setLoadingOverview(false);
    }
  }, [month]);

  const loadEvidence = useCallback(async () => {
    setLoadingEvidence(true);
    setError(null);
    try {
      const entryList = await listCoaEntries({
        monthFrom: evidenceFrom,
        monthTo: evidenceTo,
        metricKey: metricKey === "all" ? undefined : metricKey,
      });
      setEntries(entryList);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load evidence",
      );
    } finally {
      setLoadingEvidence(false);
    }
  }, [evidenceFrom, evidenceTo, metricKey]);

  useEffect(() => {
    if (canUse) void loadOverview();
  }, [canUse, loadOverview]);

  useEffect(() => {
    if (canUse && tab === "evidence") void loadEvidence();
  }, [canUse, tab, loadEvidence]);

  const serviceOptions = useMemo(
    () =>
      rows.map((row) => ({
        key: row.metric.key,
        label: row.metric.label,
      })),
    [rows],
  );

  const groupedEvidence = useMemo(() => {
    const map = new Map<
      string,
      { label: string; key: string; entries: CoaPerformanceEntry[] }
    >();
    for (const entry of entries) {
      const key = entry.metricKey ?? entry.metricId;
      const label = entry.metricLabel ?? entry.metricKey ?? "Service line";
      const bucket = map.get(key) ?? { label, key, entries: [] };
      bucket.entries.push(entry);
      map.set(key, bucket);
    }
    return [...map.values()];
  }, [entries]);

  if (!canUse) {
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

  function openLog(metric: CoaMetric) {
    if (metric.evidenceType === "auto_irembo") return;
    if (metric.evidenceType === "file_upload") {
      setFileMetric(metric);
      return;
    }
    setClientMetric(metric);
  }

  function applyEvidencePreset(kind: "this" | "last" | "last3") {
    const now = currentMonth();
    if (kind === "this") {
      setEvidenceFrom(now);
      setEvidenceTo(now);
      return;
    }
    if (kind === "last") {
      const prev = shiftMonth(now, -1);
      setEvidenceFrom(prev);
      setEvidenceTo(prev);
      return;
    }
    setEvidenceFrom(shiftMonth(now, -2));
    setEvidenceTo(now);
  }

  async function removeEntry(id: string) {
    const result = await deleteCoaEntry(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Entry removed");
    void loadEvidence();
    void loadOverview();
  }

  async function removeClient(id: string) {
    const result = await deleteCoaClient(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Client removed");
    void loadEvidence();
    void loadOverview();
  }

  async function removeFile(id: string) {
    const result = await deleteCoaEvidenceFile(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("File removed");
    void loadEvidence();
    void loadOverview();
  }

  function onSavedLog() {
    void loadOverview();
    if (tab === "evidence") void loadEvidence();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My performance"
        description="Track monthly imihigo targets, then review clients and files you have already logged by service line and period."
      />

      <Tabs
        value={tab}
        onValueChange={(next) => {
          setTab(next);
          if (next === "evidence") {
            setEvidenceFrom(month);
            setEvidenceTo(month);
          }
        }}
      >
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="evidence">Logged evidence</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-end gap-3 pt-6">
              <div className="space-y-1.5">
                <label
                  className="text-sm text-foreground-secondary"
                  htmlFor="overview-month"
                >
                  Month
                </label>
                <Input
                  id="overview-month"
                  type="month"
                  className="w-44"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setMonth(currentMonth())}
                >
                  This month
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setMonth(shiftMonth(currentMonth(), -1))}
                >
                  Last month
                </Button>
              </div>
              <p className="w-full text-xs text-foreground-muted sm:ml-auto sm:w-auto">
                Showing targets for {formatMonthLabel(month)}
              </p>
            </CardContent>
          </Card>

          {error && tab === "overview" ? (
            <ErrorState
              title="Could not load performance"
              description={error}
              onRetry={() => void loadOverview()}
            />
          ) : loadingOverview ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-foreground-muted">
                No enabled imihigo metrics for this month. Ask an administrator
                to enable service lines in COA metrics.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {rows.map(({ metric, actual, target, remaining, percent }) => (
                <Card key={metric.id}>
                  <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-base leading-snug">
                        {metric.label}
                      </CardTitle>
                      <div className="flex flex-wrap gap-1.5">
                        <StatusBadge
                          label={evidenceTypeLabel(metric.evidenceType)}
                          tone="info"
                        />
                      </div>
                    </div>
                    {metric.evidenceType === "auto_irembo" ? (
                      <Button asChild size="sm" variant="secondary">
                        <Link href="/invite-links">Invite links</Link>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openLog(metric)}
                      >
                        Log
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-end justify-between gap-3">
                      <p className="text-2xl font-semibold tabular-nums">
                        {actual}
                        <span className="text-sm font-normal text-foreground-muted">
                          {" "}
                          / {target}
                        </span>
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {remaining} remaining · {percent}%
                      </p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary-600 transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    {metric.evidenceType === "auto_irembo" ? (
                      <p className="text-xs text-foreground-secondary">
                        Counted from agent candidates you created or who joined
                        via your invite link this month.{" "}
                        <Link
                          href="/agents"
                          className="font-medium text-primary-600 underline"
                        >
                          Open agent network
                        </Link>
                      </p>
                    ) : metric.evidenceType === "file_upload" ? (
                      <p className="text-xs text-foreground-muted">
                        Upload PDF or image proof (max 10 MB per file).
                      </p>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setMetricKey(metric.key);
                          setEvidenceFrom(month);
                          setEvidenceTo(month);
                          setTab("evidence");
                        }}
                      >
                        View logged clients
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-end gap-3 pt-6">
              <div className="space-y-1.5">
                <label
                  className="text-sm text-foreground-secondary"
                  htmlFor="evidence-from"
                >
                  From month
                </label>
                <Input
                  id="evidence-from"
                  type="month"
                  className="w-44"
                  value={evidenceFrom}
                  onChange={(e) => setEvidenceFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-sm text-foreground-secondary"
                  htmlFor="evidence-to"
                >
                  To month
                </label>
                <Input
                  id="evidence-to"
                  type="month"
                  className="w-44"
                  value={evidenceTo}
                  onChange={(e) => setEvidenceTo(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-sm text-foreground-secondary"
                  htmlFor="evidence-metric"
                >
                  Service line
                </label>
                <select
                  id="evidence-metric"
                  className="h-10 w-56 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                  value={metricKey}
                  onChange={(e) => setMetricKey(e.target.value)}
                >
                  <option value="all">All service lines</option>
                  {serviceOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => applyEvidencePreset("this")}
                >
                  This month
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => applyEvidencePreset("last")}
                >
                  Last month
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => applyEvidencePreset("last3")}
                >
                  Last 3 months
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void loadEvidence()}
                >
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && tab === "evidence" ? (
            <ErrorState
              title="Could not load evidence"
              description={error}
              onRetry={() => void loadEvidence()}
            />
          ) : loadingEvidence ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-foreground-muted">
                No evidence logged for this period
                {metricKey !== "all" ? " and service line" : ""}.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {groupedEvidence.map((group) => (
                <Card key={group.key}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{group.label}</CardTitle>
                    <p className="text-xs text-foreground-muted">
                      {group.entries.length} log
                      {group.entries.length === 1 ? "" : "s"} ·{" "}
                      {group.entries.reduce((n, e) => n + e.clientCount, 0)}{" "}
                      clients ·{" "}
                      {group.entries.reduce((n, e) => n + e.fileCount, 0)} files
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {group.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="space-y-2 rounded-md border border-border p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">
                              {entry.month} ·{" "}
                              {new Date(entry.loggedAt).toLocaleString()}
                            </p>
                            <p className="text-xs text-foreground-muted">
                              {entry.clientCount} clients · {entry.fileCount}{" "}
                              files
                            </p>
                            {entry.notes ? (
                              <p className="mt-1 text-xs text-foreground-secondary">
                                {entry.notes}
                              </p>
                            ) : null}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void removeEntry(entry.id)}
                          >
                            Delete entry
                          </Button>
                        </div>
                        {entry.clients.length > 0 ? (
                          <ul className="space-y-1.5 border-t border-border pt-2">
                            {entry.clients.map((client) => (
                              <li
                                key={client.id}
                                className="flex flex-wrap items-center justify-between gap-2 text-sm"
                              >
                                <span>
                                  {client.fullName}
                                  {client.phone ? ` · ${client.phone}` : ""}
                                  {client.accountRef
                                    ? ` · Acc ${client.accountRef}`
                                    : ""}
                                  {client.simNumber
                                    ? ` · SIM ${client.simNumber}`
                                    : ""}
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => void removeClient(client.id)}
                                >
                                  Remove
                                </Button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {entry.files.length > 0 ? (
                          <ul className="space-y-1.5 border-t border-border pt-2">
                            {entry.files.map((file) => (
                              <li
                                key={file.id}
                                className="flex flex-wrap items-center justify-between gap-2 text-sm"
                              >
                                <span className="truncate">
                                  {file.originalName} ·{" "}
                                  {(file.sizeBytes / 1024).toFixed(0)} KB
                                </span>
                                <div className="flex gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setViewingFileId(file.id)}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => void removeFile(file.id)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <LogClientsDialog
        metric={clientMetric}
        month={month}
        open={Boolean(clientMetric)}
        onOpenChange={(open) => {
          if (!open) setClientMetric(null);
        }}
        onSaved={onSavedLog}
      />
      <LogFilesDialog
        metric={fileMetric}
        month={month}
        open={Boolean(fileMetric)}
        onOpenChange={(open) => {
          if (!open) setFileMetric(null);
        }}
        onSaved={onSavedLog}
      />
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
