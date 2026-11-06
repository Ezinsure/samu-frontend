"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { MetricEditDialog } from "@/features/coa-metrics/metric-edit-dialog";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canManageCoaMetrics,
  evidenceTypeLabel,
  getCoaMetrics,
  updateCoaMetric,
  type CoaMetric,
} from "@/lib/api/coa-metrics";

export default function CoaMetricsPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<CoaMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CoaMetric | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCoaMetrics({ includeDisabled: true });
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManageCoaMetrics(user)) void load();
  }, [user, load]);

  if (!canManageCoaMetrics(user)) {
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

  async function toggleEnabled(metric: CoaMetric, enabled: boolean) {
    setTogglingKey(metric.key);
    const result = await updateCoaMetric(metric.key, { enabled });
    setTogglingKey(null);
    if (!result.ok) {
      toast.error("Could not update status", { description: result.error });
      return;
    }
    setMetrics((rows) =>
      rows.map((row) => (row.key === metric.key ? result.data : row)),
    );
    toast.success(enabled ? "Metric enabled" : "Metric disabled");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="COA metrics"
        description="Shared monthly imihigo targets for all Community Opportunity Associates. Disable a metric to hide it from COA logging."
        actions={
          <Button asChild variant="secondary">
            <Link href="/coa-performance">View performance</Link>
          </Button>
        }
      />

      {error ? (
        <ErrorState
          title="Could not load metrics"
          description={error}
          onRetry={() => void load()}
        />
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {metrics.map((metric) => (
            <Card
              key={metric.id}
              className={
                metric.enabled
                  ? "border-border"
                  : "border-border/60 opacity-80"
              }
            >
              <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-foreground">
                      {metric.label}
                    </h2>
                    <StatusBadge
                      label={metric.enabled ? "Enabled" : "Disabled"}
                      tone={metric.enabled ? "success" : "inactive"}
                    />
                    <StatusBadge
                      label={evidenceTypeLabel(metric.evidenceType)}
                      tone="info"
                    />
                  </div>
                  <p className="text-xs text-foreground-muted">
                    Key: {metric.key} · Target:{" "}
                    <span className="font-medium text-foreground">
                      {metric.monthlyTarget}/month
                    </span>
                  </p>
                  {metric.description ? (
                    <p className="text-sm text-foreground-secondary">
                      {metric.description}
                    </p>
                  ) : null}
                  {metric.adminNote ? (
                    <p className="text-xs text-warning">
                      Note: {metric.adminNote}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={metric.enabled}
                      disabled={togglingKey === metric.key}
                      onCheckedChange={(next) =>
                        void toggleEnabled(metric, next)
                      }
                      aria-label={`Enable ${metric.label}`}
                    />
                    <span className="text-xs text-foreground-muted">
                      {metric.enabled ? "On" : "Off"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditing(metric)}
                  >
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MetricEditDialog
        metric={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSaved={(updated) => {
          setMetrics((rows) =>
            rows.map((row) => (row.key === updated.key ? updated : row)),
          );
          setEditing(null);
        }}
      />
    </div>
  );
}
