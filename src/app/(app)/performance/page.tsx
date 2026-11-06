"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LogClientsDialog } from "@/features/coa-performance/log-clients-dialog";
import { LogFilePlaceholderDialog } from "@/features/coa-performance/log-file-placeholder-dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { evidenceTypeLabel, type CoaMetric } from "@/lib/api/coa-metrics";
import {
  deleteCoaClient,
  deleteCoaEntry,
  getMyCoaProgress,
  listCoaEntries,
  type CoaPerformanceEntry,
  type CoaProgressRow,
} from "@/lib/api/coa-performance";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function CoaPerformanceLogPage() {
  const { user } = useAuth();
  const canUse =
    user?.role === "COMMUNITY_OPPORTUNITY_ASSOCIATE" ||
    user?.role === "ADMIN";

  const [month, setMonth] = useState(currentMonth);
  const [rows, setRows] = useState<CoaProgressRow[]>([]);
  const [entries, setEntries] = useState<CoaPerformanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientMetric, setClientMetric] = useState<CoaMetric | null>(null);
  const [fileMetric, setFileMetric] = useState<CoaMetric | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [progress, entryList] = await Promise.all([
        getMyCoaProgress(month),
        listCoaEntries({ month }),
      ]);
      setRows(progress.rows);
      setEntries(entryList);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load performance",
      );
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    if (canUse) void load();
  }, [canUse, load]);

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

  async function removeEntry(id: string) {
    const result = await deleteCoaEntry(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Entry removed");
    void load();
  }

  async function removeClient(id: string) {
    const result = await deleteCoaClient(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Client removed");
    void load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My performance"
        description="Log monthly imihigo evidence for each enabled service line and track progress against targets."
        actions={
          <div className="flex items-center gap-2">
            <Input
              type="month"
              className="w-40"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
        }
      />

      {error ? (
        <ErrorState
          title="Could not load performance"
          description={error}
          onRetry={() => void load()}
        />
      ) : loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : (
        <>
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
                      Document attachments open in the next release.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Logged evidence · {month}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {entries.length === 0 ? (
                <p className="text-sm text-foreground-muted">
                  No evidence logged this month yet.
                </p>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="space-y-2 rounded-md border border-border p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          {entry.metricLabel ?? entry.metricKey}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          {new Date(entry.loggedAt).toLocaleString()} ·{" "}
                          {entry.clientCount} clients · {entry.fileCount} files
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
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}

      <LogClientsDialog
        metric={clientMetric}
        month={month}
        open={Boolean(clientMetric)}
        onOpenChange={(open) => {
          if (!open) setClientMetric(null);
        }}
        onSaved={() => void load()}
      />
      <LogFilePlaceholderDialog
        metric={fileMetric}
        open={Boolean(fileMetric)}
        onOpenChange={(open) => {
          if (!open) setFileMetric(null);
        }}
      />
    </div>
  );
}
