"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/http/client";

interface Report {
  dateFrom: string;
  dateTo: string;
  totals: { activitiesCount: number; peopleReached: number };
  rows: Array<{
    coaId: string;
    name: string;
    email: string;
    activitiesCount: number;
    peopleReached: number;
    byKind: Record<string, number>;
  }>;
}

export default function CoaPerformancePage() {
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<Report | null>(null);

  async function load() {
    try {
      const data = await apiRequest<Report>(
        `/field-work/coa-performance?dateFrom=${dateFrom}&dateTo=${dateTo}`,
      );
      setReport(data);
    } catch (error) {
      toast.error("Could not load report", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function downloadCsv() {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const res = await fetch(
        `${base}/api/v1/field-work/coa-performance.csv?dateFrom=${dateFrom}&dateTo=${dateTo}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coa-performance-${dateFrom}-${dateTo}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("CSV export failed", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="COA performance"
        description="Admin view of Community Opportunity Associate activity by date range."
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="space-y-1.5">
            <Label>From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <Button type="button" onClick={() => void load()}>
            Run report
          </Button>
          <Button type="button" variant="outline" onClick={() => void downloadCsv()}>
            Export CSV
          </Button>
        </CardContent>
      </Card>

      {report ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Totals — {report.totals.activitiesCount} activities ·{" "}
              {report.totals.peopleReached} people reached
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.rows.map((row) => (
              <div
                key={row.coaId}
                className="rounded-md border border-border p-3 text-sm"
              >
                <p className="font-medium">
                  {row.name} · {row.activitiesCount} activities ·{" "}
                  {row.peopleReached} people
                </p>
                <p className="text-foreground-muted">
                  {Object.entries(row.byKind)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ") || "No breakdown"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
