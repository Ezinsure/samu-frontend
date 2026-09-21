"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canReviewFraud,
  fraudStatusLabel,
  fraudStatusTone,
  getFraudFilterOptions,
  getFraudFlags,
  severityTone,
  type FraudListItem,
  type FraudQuery,
} from "@/lib/api";

export default function FraudQueuePage() {
  const { user } = useAuth();
  const canReview = canReviewFraud(user);
  const isMd = user?.role === "MD_VIEWER";

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("open");
  const [severity, setSeverity] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<FraudListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [types, setTypes] = useState<string[]>([]);
  const [stats, setStats] = useState({
    open: 0,
    escalated: 0,
    resolved: 0,
  });

  useEffect(() => {
    void getFraudFilterOptions().then((result) => setTypes([...result.types]));
    void getFraudFlags({ page: 1, pageSize: 100 }, user).then((result) => {
      setStats({
        open: result.data.filter((item) => item.status === "open").length,
        escalated: result.data.filter((item) => item.status === "escalated")
          .length,
        resolved: result.data.filter(
          (item) => item.status === "resolved" || item.status === "dismissed",
        ).length,
      });
    });
  }, [user]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const query: FraudQuery = {
      page,
      pageSize: 10,
      search,
      status: status === "all" ? undefined : status,
      severity: severity === "all" ? undefined : severity,
      type: type === "all" ? undefined : type,
    };
    void getFraudFlags(query, user).then((result) => {
      if (!active) return;
      setRows(result.data);
      setTotal(result.total);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user, search, status, severity, type, page]);

  useEffect(() => {
    setPage(1);
  }, [search, status, severity, type]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fraud review"
        description={
          isMd
            ? "Read-only view of suspicious visit flags requiring management attention."
            : canReview
              ? "Review flagged visits, evidence, and resolution outcomes."
              : "Suspicious visit flags."
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Open", value: stats.open },
          { label: "Escalated", value: stats.escalated },
          { label: "Closed", value: stats.resolved },
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
        searchPlaceholder="Search agent, type, coordinator…"
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {types.map((item) => (
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
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          data={rows}
          getRowId={(row) => row.id}
          emptyTitle="No fraud flags"
          emptyDescription="No flags match the current filters."
          page={page}
          pageSize={10}
          total={total}
          onPageChange={setPage}
          columns={[
            {
              id: "flag",
              header: "Flag",
              cell: (row) => (
                <div>
                  <Link
                    href={`/fraud/${row.id}`}
                    className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                  >
                    {row.type}
                  </Link>
                  <p className="text-xs text-foreground-secondary">
                    {format(new Date(row.detectedAt), "dd MMM yyyy HH:mm")}
                  </p>
                </div>
              ),
            },
            {
              id: "agent",
              header: "Agent / visit",
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.agentName}</p>
                  <p className="text-xs text-foreground-secondary">
                    {row.visitPurpose} · {row.distanceFromRegisteredMeters}m GPS
                  </p>
                </div>
              ),
            },
            {
              id: "tc",
              header: "Coordinator",
              cell: (row) => row.tcName,
            },
            {
              id: "severity",
              header: "Severity",
              cell: (row) => (
                <StatusBadge
                  label={row.severity}
                  tone={severityTone(row.severity)}
                  showIcon={false}
                />
              ),
            },
            {
              id: "status",
              header: "Status",
              cell: (row) => (
                <StatusBadge
                  label={fraudStatusLabel(row.status)}
                  tone={fraudStatusTone(row.status)}
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
