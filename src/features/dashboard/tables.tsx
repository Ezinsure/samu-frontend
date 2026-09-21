"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardAnalytics } from "@/lib/api";

interface OverdueAgentsTableProps {
  rows: DashboardAnalytics["overdueAgents"];
  showTcColumn?: boolean;
}

export function OverdueAgentsTable({
  rows,
  showTcColumn = true,
}: OverdueAgentsTableProps) {
  return (
    <DataTable
      data={rows}
      getRowId={(row) => row.id}
      emptyTitle="No overdue agents"
      emptyDescription="All agents in this scope are within the visit compliance window."
      columns={[
        {
          id: "name",
          header: "Agent",
          cell: (row) => (
            <div>
              <p className="font-medium text-foreground">{row.name}</p>
              <p className="text-xs text-foreground-muted">{row.code}</p>
            </div>
          ),
        },
        {
          id: "district",
          header: "District",
          cell: (row) => row.district,
        },
        ...(showTcColumn
          ? [
              {
                id: "tc",
                header: "Coordinator",
                cell: (row: (typeof rows)[number]) => row.tcName,
              },
            ]
          : []),
        {
          id: "lastVisit",
          header: "Last visit",
          cell: (row) =>
            row.lastVisitAt
              ? new Date(row.lastVisitAt).toLocaleDateString()
              : "Never",
        },
        {
          id: "overdue",
          header: "Overdue",
          align: "right" as const,
          cell: (row) => (
            <StatusBadge
              label={`${row.daysOverdue}d`}
              tone="danger"
            />
          ),
        },
        {
          id: "actions",
          header: "",
          cell: (row) => (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/agents/${row.id}`}>View</Link>
            </Button>
          ),
        },
      ]}
    />
  );
}

interface LeaderboardProps {
  rows: DashboardAnalytics["leaderboard"];
}

export function TcLeaderboard({ rows }: LeaderboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>TC performance leaderboard</CardTitle>
        <CardDescription>
          Compliance share of assigned agents (green status).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-foreground-secondary">No coordinators in scope.</p>
        ) : (
          rows.map((row, index) => (
            <div
              key={row.tcUserId}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-background px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  #{index + 1} {row.name}
                </p>
                <p className="text-xs text-foreground-secondary">
                  {row.agents} agents · {row.visits} visits in range
                </p>
              </div>
              <StatusBadge
                label={`${row.compliancePercent}%`}
                tone={
                  row.compliancePercent >= 90
                    ? "success"
                    : row.compliancePercent >= 70
                      ? "warning"
                      : "danger"
                }
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
