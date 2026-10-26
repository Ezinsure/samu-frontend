"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { FilterBar } from "@/components/shared/filter-bar";
import { FilterSelect } from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { CoapListTable, OpenLink } from "@/features/coap/coap-list-table";
import { MobileQuickActions } from "@/features/coap/mobile-quick-actions";
import { ServiceSelect } from "@/features/coap/service-select";
import { useInitialService } from "@/features/coap/use-initial-service";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canManageCoap,
  feedbackSeverityTone,
  feedbackStatusTone,
  getCommunityFeedback,
} from "@/lib/api";
import {
  FEEDBACK_KIND_LABELS,
  FEEDBACK_STATUS_LABELS,
  labelsToOptions,
  serviceLineLabel,
} from "@/lib/coap/catalog";
import { filterValue, useListFilters } from "@/lib/hooks/use-list-filters";
import { useUserData } from "@/lib/hooks/use-user-data";
import type { FeedbackKind, FeedbackStatus, ServiceLine } from "@/types";

const PAGE_SIZE = 10;
const KIND_OPTIONS = labelsToOptions(FEEDBACK_KIND_LABELS);
const STATUS_OPTIONS = labelsToOptions(FEEDBACK_STATUS_LABELS);

export default function FeedbackPage() {
  const { user } = useAuth();
  const canWrite = canManageCoap(user);
  const initialService = useInitialService("all");

  const { filters, applied, key, setFilters, setPage } = useListFilters({
    search: "",
    service: initialService as string,
    kind: "all",
    status: "all",
  });

  const state = useUserData(
    () =>
      getCommunityFeedback({
        page: applied.page,
        pageSize: PAGE_SIZE,
        search: applied.search,
        serviceLine: filterValue<ServiceLine>(applied.service),
        kind: filterValue<FeedbackKind>(applied.kind),
        status: filterValue<FeedbackStatus>(applied.status),
      }),
    `feedback:${key}`,
  );

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
        searchValue={filters.search}
        onSearchChange={(search) => setFilters({ search })}
        searchPlaceholder="Search title or description…"
        filters={
          <>
            <ServiceSelect
              value={filters.service as ServiceLine | "all"}
              onChange={(service) => setFilters({ service })}
              allowAll
            />
            <FilterSelect
              value={filters.kind}
              onChange={(kind) => setFilters({ kind })}
              placeholder="Kind"
              allLabel="All kinds"
              options={KIND_OPTIONS}
              widthClass="w-[150px]"
            />
            <FilterSelect
              value={filters.status}
              onChange={(status) => setFilters({ status })}
              placeholder="Status"
              allLabel="All statuses"
              options={STATUS_OPTIONS}
              widthClass="w-[150px]"
            />
          </>
        }
      />

      <CoapListTable
        state={state}
        page={filters.page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No feedback yet"
        emptyDescription="Log community needs, challenges, or opportunities after field work."
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
            cell: (row) => <OpenLink href={`/feedback/${row.id}`} />,
          },
        ]}
      />

      <MobileQuickActions />
    </div>
  );
}
