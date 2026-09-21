"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
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
  getMonthlyReports,
  reportStatusLabel,
  reportStatusTone,
  type MonthlyReportListItem,
  type MonthlyReportQuery,
} from "@/lib/api";

export default function MonthlyReportsPage() {
  const { user } = useAuth();
  const isTc = user?.role === "TERRITORY_COORDINATOR";

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MonthlyReportListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [periods, setPeriods] = useState<string[]>([]);
  const [stats, setStats] = useState({
    draft: 0,
    dueSoon: 0,
    submitted: 0,
  });

  useEffect(() => {
    void getMonthlyReports({ page: 1, pageSize: 100 }, user).then((result) => {
      setPeriods(
        Array.from(new Set(result.data.map((item) => item.period))).sort(
          (a, b) => b.localeCompare(a),
        ),
      );
      setStats({
        draft: result.data.filter(
          (item) =>
            item.status === "draft" || item.status === "changes_requested",
        ).length,
        dueSoon: result.data.filter(
          (item) =>
            item.daysToDeadline >= 0 &&
            item.daysToDeadline <= 7 &&
            (item.status === "draft" || item.status === "changes_requested"),
        ).length,
        submitted: result.data.filter(
          (item) =>
            item.status === "submitted" ||
            item.status === "resubmitted" ||
            item.status === "under_review",
        ).length,
      });
    });
  }, [user]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const query: MonthlyReportQuery = {
      page,
      pageSize: 10,
      search,
      status: status === "all" ? undefined : status,
      period: period === "all" ? undefined : period,
    };
    void getMonthlyReports(query, user).then((result) => {
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
        title="Monthly reports"
        description="Territory coordination obligations due by the 5th of each following month."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Open drafts", value: stats.draft },
          { label: "Due within 7 days", value: stats.dueSoon },
          { label: "Awaiting review", value: stats.submitted },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-secondary">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <FilterBar
        searchPlaceholder="Search period, coordinator, territory…"
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="changes_requested">Changes requested</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="resubmitted">Resubmitted</SelectItem>
                <SelectItem value="under_review">Under review</SelectItem>
                <SelectItem value="evaluated">Evaluated</SelectItem>
              </SelectContent>
            </Select>
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
          emptyTitle="No monthly reports"
          emptyDescription="Reporting obligations will appear here by period."
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
                    href={`/monthly-reports/${row.id}`}
                    className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                  >
                    {row.period}
                  </Link>
                  <p className="text-xs text-foreground-secondary">
                    Due {format(new Date(row.deadline), "dd MMM yyyy")}
                  </p>
                </div>
              ),
            },
            ...(!isTc
              ? [
                  {
                    id: "tc",
                    header: "Coordinator",
                    cell: (row: MonthlyReportListItem) => row.tcName,
                  },
                ]
              : []),
            {
              id: "territory",
              header: "Territory",
              cell: (row) => row.territorySnapshot.join(", "),
            },
            {
              id: "kpi",
              header: "KPI met",
              cell: (row) => `${row.kpiProgressPercent}%`,
            },
            {
              id: "deadline",
              header: "Deadline",
              cell: (row) => (
                <StatusBadge
                  label={
                    row.overdue
                      ? "Overdue"
                      : row.daysToDeadline <= 7
                        ? `${row.daysToDeadline}d left`
                        : `${row.daysToDeadline}d left`
                  }
                  tone={
                    row.overdue
                      ? "danger"
                      : row.daysToDeadline <= 7
                        ? "warning"
                        : "success"
                  }
                  showIcon={false}
                />
              ),
            },
            {
              id: "status",
              header: "Status",
              cell: (row) => (
                <StatusBadge
                  label={reportStatusLabel(row.status)}
                  tone={reportStatusTone(row.status)}
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
