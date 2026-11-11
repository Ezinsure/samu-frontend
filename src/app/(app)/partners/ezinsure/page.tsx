"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import {
  downloadPartnerApplicantsCsv,
  getPartnerApplicantsSummary,
  getPartnerVerificationRun,
  getPartnerVerifyContract,
  listPartnerApplicants,
  partnerRunStatusTone,
  partnerVerificationLabel,
  partnerVerificationTone,
  startPartnerVerification,
  type PartnerApplicant,
  type PartnerApplicantsSummary,
  type PartnerVerificationRun,
  type PartnerVerificationStatus,
  type PartnerVerifyContract,
} from "@/lib/api/partners";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const STATUS_FILTERS: Array<{
  value: "" | PartnerVerificationStatus;
  label: string;
}> = [
  { value: "", label: "All statuses" },
  { value: "unverified", label: "Unverified" },
  { value: "verified", label: "Verified" },
  { value: "not_found", label: "Not found" },
  { value: "error", label: "Error" },
];

export default function EzinsureApplicantsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [month, setMonth] = useState(currentMonth);
  const [status, setStatus] = useState<"" | PartnerVerificationStatus>("");
  const [q, setQ] = useState("");
  const [summary, setSummary] = useState<PartnerApplicantsSummary | null>(null);
  const [rows, setRows] = useState<PartnerApplicant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeRun, setActiveRun] = useState<PartnerVerificationRun | null>(
    null,
  );
  const [verifying, setVerifying] = useState(false);
  const [contract, setContract] = useState<PartnerVerifyContract | null>(null);
  const [showContract, setShowContract] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, listData, contractData] = await Promise.all([
        getPartnerApplicantsSummary({ month }),
        listPartnerApplicants({
          month,
          verificationStatus: status || undefined,
          q: q.trim() || undefined,
          limit: 200,
        }),
        getPartnerVerifyContract().catch(() => null),
      ]);
      setSummary(summaryData);
      setRows(listData.rows);
      setTotal(listData.total);
      setContract(contractData);
      setSelected(new Set());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load applicants",
      );
    } finally {
      setLoading(false);
    }
  }, [month, q, status]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  useEffect(() => {
    if (!activeRun) return;
    if (activeRun.status === "completed" || activeRun.status === "failed") {
      return;
    }

    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const next = await getPartnerVerificationRun(activeRun.id);
          setActiveRun(next);
          if (next.status === "completed" || next.status === "failed") {
            window.clearInterval(timer);
            await load();
            if (next.status === "completed") {
              toast.success("Verification finished", {
                description: `${next.verifiedCount} verified · ${next.notFoundCount} not found · ${next.errorCount} errors`,
              });
            } else {
              toast.error("Verification failed", {
                description: next.lastError,
              });
            }
          }
        } catch {
          // keep polling; transient errors are fine
        }
      })();
    }, 1200);

    return () => window.clearInterval(timer);
  }, [activeRun, load]);

  const selectableIds = useMemo(
    () =>
      rows
        .filter((r) => r.verificationStatus !== "verified")
        .map((r) => r.id),
    [rows],
  );

  const allSelectableChecked =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selected.has(id));

  function toggleAll() {
    if (allSelectableChecked) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(selectableIds));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onExport() {
    setExporting(true);
    try {
      await downloadPartnerApplicantsCsv({
        month,
        verificationStatus: status || undefined,
        q: q.trim() || undefined,
      });
      toast.success("CSV downloaded");
    } catch (err) {
      toast.error("CSV export failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setExporting(false);
    }
  }

  async function runVerify(scope: "selected" | "unverified_all") {
    setVerifying(true);
    const result = await startPartnerVerification({
      scope,
      applicantIds: scope === "selected" ? [...selected] : undefined,
      month: scope === "unverified_all" ? month : undefined,
    });
    setVerifying(false);
    if (!result.ok) {
      toast.error("Could not start verification", { description: result.error });
      return;
    }
    setActiveRun(result.data);
    toast.message("Verification started", {
      description: `Processing ${result.data.totalCount} applicant(s) via ${result.data.adapter} adapter`,
    });
  }

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

  const runBusy =
    verifying ||
    activeRun?.status === "pending" ||
    activeRun?.status === "running";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ezinsure applicants"
        description="Log intake from COAs, then verify applicants against the Ezinsure partner API (mock until they ship the endpoint)."
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/coa-performance">COA performance</Link>
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowContract((v) => !v)}
            >
              Partner API contract
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={exporting}
              onClick={() => void onExport()}
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
          </>
        }
      />

      {showContract && contract ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Endpoint Ezinsure should implement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-foreground-secondary">
              Share <code className="text-xs">DOCs/Ezinsure-Partner-Verify-API.md</code>{" "}
              with their team. SAMU calls{" "}
              <code className="text-xs">{contract.method} {contract.pathHint}</code>{" "}
              with Bearer auth. Current adapter:{" "}
              <strong>{contract.adapter}</strong> (mode {contract.mode}).
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  Request body
                </p>
                <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs">
                  {JSON.stringify(contract.requestExample, null, 2)}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  Response examples
                </p>
                <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs">
                  {JSON.stringify(contract.responseExamples, null, 2)}
                </pre>
              </div>
            </div>
            {contract.mode === "mock" ? (
              <p className="text-xs text-foreground-muted">
                Mock rules — verified: {contract.mockRules.verified}. Not found:{" "}
                {contract.mockRules.not_found}. Error: {contract.mockRules.error}.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

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
              htmlFor="status"
            >
              Verification
            </label>
            <select
              id="status"
              className="h-10 w-44 rounded-md border border-border bg-background px-3 text-sm"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "" | PartnerVerificationStatus)
              }
            >
              {STATUS_FILTERS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-foreground-secondary" htmlFor="q">
              Search
            </label>
            <Input
              id="q"
              className="w-56"
              placeholder="Name, phone, email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button type="button" onClick={() => void load()}>
            Refresh
          </Button>
          <Button
            type="button"
            disabled={runBusy || selected.size === 0}
            onClick={() => void runVerify("selected")}
          >
            <ShieldCheck className="h-4 w-4" />
            Verify selected ({selected.size})
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={runBusy}
            onClick={() => void runVerify("unverified_all")}
          >
            Verify all unverified
          </Button>
        </CardContent>
      </Card>

      {activeRun ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base">Verification run</CardTitle>
            <StatusBadge
              label={activeRun.status}
              tone={partnerRunStatusTone(activeRun.status)}
            />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-4 text-sm tabular-nums">
              <span>
                {activeRun.processedCount}/{activeRun.totalCount} processed
              </span>
              <span>{activeRun.verifiedCount} verified</span>
              <span>{activeRun.notFoundCount} not found</span>
              <span>{activeRun.errorCount} errors</span>
              <span>{activeRun.skippedCount} skipped</span>
              <span className="text-foreground-muted">
                adapter: {activeRun.adapter}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary-600 transition-all"
                style={{ width: `${activeRun.percent}%` }}
              />
            </div>
            {activeRun.lastError ? (
              <p className="text-sm text-destructive">{activeRun.lastError}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <ErrorState
          title="Could not load Ezinsure applicants"
          description={error}
          onRetry={() => void load()}
        />
      ) : loading || !summary ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-foreground-muted">Logged</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {summary.totals.logged}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-foreground-muted">Verified</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {summary.totals.verified}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-foreground-muted">Unverified</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {summary.totals.unverified}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-foreground-muted">
                  Not found / error
                </p>
                <p className="text-2xl font-semibold tabular-nums">
                  {summary.totals.notFound + summary.totals.error}
                </p>
              </CardContent>
            </Card>
          </div>

          {summary.rows.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Logged vs verified by COA
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="text-xs text-foreground-muted">
                    <tr className="border-b border-border">
                      <th className="pb-2 pr-3 font-medium">COA</th>
                      <th className="pb-2 pr-3 font-medium">District</th>
                      <th className="pb-2 pr-3 font-medium tabular-nums">
                        Logged
                      </th>
                      <th className="pb-2 font-medium tabular-nums">
                        Verified
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.rows.map((row) => (
                      <tr
                        key={row.coa.id}
                        className="border-b border-border/60 last:border-0"
                      >
                        <td className="py-2 pr-3">
                          <p className="font-medium">{row.coa.name}</p>
                          <p className="text-xs text-foreground-muted">
                            {row.coa.email}
                          </p>
                        </td>
                        <td className="py-2 pr-3 text-foreground-secondary">
                          {row.coa.workingDistrict ?? "—"}
                        </td>
                        <td className="py-2 pr-3 tabular-nums">{row.logged}</td>
                        <td className="py-2 tabular-nums">{row.verified}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-base">Applicants</CardTitle>
              <div className="flex items-center gap-3 text-xs text-foreground-muted">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allSelectableChecked}
                    onChange={toggleAll}
                    disabled={selectableIds.length === 0}
                  />
                  Select unverified on page
                </label>
                <span>
                  Showing {rows.length} of {total}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {rows.length === 0 ? (
                <p className="py-8 text-center text-sm text-foreground-muted">
                  No applicants match these filters.
                </p>
              ) : (
                rows.map((row) => {
                  const canSelect = row.verificationStatus !== "verified";
                  return (
                    <div
                      key={row.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-border p-3 text-sm"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selected.has(row.id)}
                          disabled={!canSelect}
                          onChange={() => toggleOne(row.id)}
                          aria-label={`Select ${row.fullName}`}
                        />
                        <div className="min-w-0 space-y-1">
                          <p className="font-medium">{row.fullName}</p>
                          <p className="text-xs text-foreground-muted">
                            {[row.phone, row.email].filter(Boolean).join(" · ")}
                          </p>
                          <p className="text-xs text-foreground-secondary">
                            {[row.province, row.district, row.sector, row.cell]
                              .filter(Boolean)
                              .join(" · ") || "No location"}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            Logged by {row.loggedBy?.name ?? "—"} · {row.month}
                            {row.externalRef
                              ? ` · ref ${row.externalRef}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <StatusBadge
                        label={partnerVerificationLabel(row.verificationStatus)}
                        tone={partnerVerificationTone(row.verificationStatus)}
                      />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
