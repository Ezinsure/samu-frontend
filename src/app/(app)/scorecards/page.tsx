"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canEvaluateScorecards,
  decisionTone,
  getScorecards,
  type ScorecardListItem,
  type ScorecardQuery,
} from "@/lib/api";

export default function ScorecardsPage() {
  const { user } = useAuth();
  const isTc = user?.role === "TERRITORY_COORDINATOR";
  const canEvaluate = canEvaluateScorecards(user);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ScorecardListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [periods, setPeriods] = useState<string[]>([]);
  const [stats, setStats] = useState({ draft: 0, submitted: 0 });

  useEffect(() => {
    void getScorecards({ page: 1, pageSize: 100 }, user).then((result) => {
      setPeriods(
        Array.from(new Set(result.data.map((item) => item.period))).sort((a, b) =>
          b.localeCompare(a),
        ),
      );
      setStats({
        draft: result.data.filter((item) => item.status === "draft").length,
        submitted: result.data.filter((item) => item.status === "submitted")
          .length,
      });
    });
  }, [user]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const query: ScorecardQuery = {
      page,
      pageSize: 10,
      search,
      status: status === "all" ? undefined : status,
      period: period === "all" ? undefined : period,
    };
    void getScorecards(query, user).then((result) => {
      if (!active) return;
      setRows(result.data);
      setTotal(result.total);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user, search, status, period, page]);

  useEffect(() => {
    setPage(1);
  }, [search, status, period]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scorecards"
        description={
          isTc
            ? "Your submitted Head Office evaluations of programme delivery."
            : "Weighted Head Office evaluations linked to monthly territory and COAP performance."
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-secondary">
              {isTc ? "Available results" : "Draft evaluations"}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {isTc ? stats.submitted : stats.draft}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-secondary">
              Submitted
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {stats.submitted}
            </p>
          </CardContent>
        </Card>
      </div>

      <FilterBar
        searchPlaceholder="Search period, coordinator, decision…"
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <>
            {!isTc ? (
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All periods</SelectItem>
                {periods.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          data={rows}
          getRowId={(row) => row.id}
          emptyTitle="No scorecards"
          emptyDescription={
            isTc
              ? "Submitted evaluations for your reports will appear here."
              : canEvaluate
                ? "Create evaluations from submitted monthly reports."
                : "No evaluations available."
          }
          page={page}
          pageSize={10}
          total={total}
          onPageChange={setPage}
          columns={[
            {
              id: "period",
              header: "Period",
              cell: (row) => (
                <div>
                  <Link
                    href={`/scorecards/${row.id}`}
                    className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                  >
                    {row.period}
                  </Link>
                  <p className="text-xs text-foreground-secondary">
                    Template {row.templateVersion}
                  </p>
                </div>
              ),
            },
            ...(!isTc
              ? [
                  {
                    id: "tc",
                    header: "Coordinator",
                    cell: (row: ScorecardListItem) => row.tcName,
                  },
                ]
              : []),
            {
              id: "total",
              header: "Weighted total",
              cell: (row) => (
                <span className="font-semibold tabular-nums">
                  {row.weightedTotal.toFixed(2)} / 5
                </span>
              ),
            },
            {
              id: "decision",
              header: "Decision",
              cell: (row) =>
                row.decision ? (
                  <StatusBadge
                    label={row.decision}
                    tone={decisionTone(row.decision)}
                    showIcon={false}
                  />
                ) : (
                  <span className="text-foreground-secondary">—</span>
                ),
            },
            {
              id: "status",
              header: "Status",
              cell: (row) => (
                <StatusBadge
                  label={row.status === "draft" ? "Draft" : "Submitted"}
                  tone={row.status === "draft" ? "neutral" : "success"}
                  showIcon={false}
                />
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
