"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canManageCoap,
  feedbackSeverityTone,
  feedbackStatusTone,
  getCommunityFeedback,
  type FeedbackListItem,
} from "@/lib/api";
import {
  FEEDBACK_KIND_LABELS,
  serviceLineLabel,
} from "@/lib/coap/catalog";
import { ServiceSelect } from "@/features/coap/service-select";
import { MobileQuickActions } from "@/features/coap/mobile-quick-actions";
import type { FeedbackKind, FeedbackStatus, ServiceLine } from "@/types";

export default function FeedbackPage() {
  const { user } = useAuth();
  const canWrite = canManageCoap(user) && user?.role !== "MD_VIEWER";

  const [search, setSearch] = useState("");
  const [service, setService] = useState<ServiceLine | "all">("all");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<FeedbackListItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getCommunityFeedback(
      {
        page,
        pageSize: 10,
        search,
        serviceLine: service === "all" ? undefined : service,
        kind: kind === "all" ? undefined : (kind as FeedbackKind),
        status: status === "all" ? undefined : (status as FeedbackStatus),
      },
      user,
    ).then((result) => {
      if (!active) return;
      setRows(result.data);
      setTotal(result.total);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user, search, service, kind, status, page]);

  useEffect(() => setPage(1), [search, service, kind, status]);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <PageHeader
        title="Community feedback"
        description="Capture needs, challenges, and opportunities from the field."
        actions={
          canWrite ? (
            <Button asChild>
              <Link href="/feedback/new">
                <Plus className="h-4 w-4" />
                Log feedback
              </Link>
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search title or description…"
        filters={
          <>
            <ServiceSelect value={service} onChange={setService} allowAll />
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Kind" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All kinds</SelectItem>
                {Object.entries(FEEDBACK_KIND_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      {loading ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <DataTable
          data={rows}
          getRowId={(row) => row.id}
          emptyTitle="No feedback yet"
          emptyDescription="Log community needs, challenges, or opportunities after field work."
          page={page}
          pageSize={10}
          total={total}
          onPageChange={setPage}
          columns={[
            {
              id: "title",
              header: "Feedback",
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.title}</p>
                  <p className="text-xs text-foreground-muted">
                    {FEEDBACK_KIND_LABELS[row.kind]}
                    {row.serviceLine
                      ? ` · ${serviceLineLabel(row.serviceLine)}`
                      : ""}
                  </p>
                </div>
              ),
            },
            {
              id: "severity",
              header: "Severity",
              cell: (row) => (
                <StatusBadge
                  label={row.severity}
                  tone={feedbackSeverityTone(row.severity)}
                />
              ),
            },
            {
              id: "status",
              header: "Status",
              cell: (row) => (
                <StatusBadge
                  label={row.status}
                  tone={feedbackStatusTone(row.status)}
                />
              ),
            },
            {
              id: "location",
              header: "Location",
              cell: (row) => `${row.geo.district} · ${row.geo.sector}`,
            },
            {
              id: "actions",
              header: "",
              cell: (row) => (
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/feedback/${row.id}`}>Open</Link>
                </Button>
              ),
            },
          ]}
        />
      )}

      <MobileQuickActions />
    </div>
  );
}
