"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/http/client";

interface Coverage {
  quarter: string;
  targetPct: number;
  coveragePct: number;
  total: number;
  visited: number;
  notVisited: number;
  meetsTarget: boolean;
  notVisitedAgents: Array<{
    id: string;
    code: string;
    name: string;
    lastVisitAt?: string;
    tcName?: string;
  }>;
  byTc: Array<{
    tcUserId: string;
    tcName: string;
    total: number;
    visited: number;
    coveragePct: number;
  }>;
}

export default function VisitCoveragePage() {
  const [data, setData] = useState<Coverage | null>(null);

  useEffect(() => {
    void apiRequest<Coverage>("/visit-coverage")
      .then(setData)
      .catch((error) =>
        toast.error("Could not load visit coverage", {
          description: error instanceof Error ? error.message : undefined,
        }),
      );
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visit coverage"
        description="Quarterly target: visit at least 30% of your assigned network, progressing toward 100% coverage."
      />

      {data ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-3 text-base">
                {data.quarter}
                <StatusBadge
                  label={
                    data.meetsTarget
                      ? `${data.coveragePct}% — on track`
                      : `${data.coveragePct}% — below ${data.targetPct}% target`
                  }
                  tone={data.meetsTarget ? "success" : "warning"}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-foreground-muted">Network size</p>
                <p className="text-2xl font-semibold">{data.total}</p>
              </div>
              <div>
                <p className="text-foreground-muted">Visited this quarter</p>
                <p className="text-2xl font-semibold">{data.visited}</p>
              </div>
              <div>
                <p className="text-foreground-muted">Not yet visited</p>
                <p className="text-2xl font-semibold">{data.notVisited}</p>
              </div>
            </CardContent>
          </Card>

          {data.byTc.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Territory Coordinator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.byTc.map((row) => (
                  <div
                    key={row.tcUserId}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span>{row.tcName}</span>
                    <span>
                      {row.visited}/{row.total} ({row.coveragePct}%)
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Not yet visited</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {data.notVisitedAgents.length === 0 ? (
                <p className="text-foreground-muted">All covered for this quarter.</p>
              ) : (
                data.notVisitedAgents.map((a) => (
                  <div key={a.id}>
                    {a.name} · {a.code}
                    {a.tcName ? ` · ${a.tcName}` : ""}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-sm text-foreground-muted">Loading…</p>
      )}
    </div>
  );
}
