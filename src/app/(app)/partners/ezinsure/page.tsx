"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
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
  listPartnerApplicants,
  partnerVerificationLabel,
  partnerVerificationTone,
  type PartnerApplicant,
  type PartnerApplicantsSummary,
  type PartnerVerificationStatus,
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, listData] = await Promise.all([
        getPartnerApplicantsSummary({ month }),
        listPartnerApplicants({
          month,
          verificationStatus: status || undefined,
          q: q.trim() || undefined,
          limit: 200,
        }),
      ]);
      setSummary(summaryData);
      setRows(listData.rows);
      setTotal(listData.total);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ezinsure applicants"
        description="Applicants logged by COAs for insurance agent applications. Verification runs in a later phase."
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/coa-performance">COA performance</Link>
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
        </CardContent>
      </Card>

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
              <p className="text-xs text-foreground-muted">
                Showing {rows.length} of {total}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {rows.length === 0 ? (
                <p className="py-8 text-center text-sm text-foreground-muted">
                  No applicants match these filters.
                </p>
              ) : (
                rows.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-border p-3 text-sm"
                  >
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
                      </p>
                    </div>
                    <StatusBadge
                      label={partnerVerificationLabel(row.verificationStatus)}
                      tone={partnerVerificationTone(row.verificationStatus)}
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
