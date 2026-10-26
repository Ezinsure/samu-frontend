"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { FilterBar } from "@/components/shared/filter-bar";
import {
  FilterSelect,
  type FilterOption,
} from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { CoapListTable, OpenLink } from "@/features/coap/coap-list-table";
import { MobileQuickActions } from "@/features/coap/mobile-quick-actions";
import { ServiceSelect } from "@/features/coap/service-select";
import { useInitialService } from "@/features/coap/use-initial-service";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCoap, getLeads, leadStatusTone } from "@/lib/api";
import {
  LEAD_STATUS_LABELS,
  labelsToOptions,
  serviceLineLabel,
} from "@/lib/coap/catalog";
import { filterValue, useListFilters } from "@/lib/hooks/use-list-filters";
import { useUserData } from "@/lib/hooks/use-user-data";
import type { LeadStatus, ServiceLine } from "@/types";

const PAGE_SIZE = 10;
const STATUS_OPTIONS: FilterOption[] = labelsToOptions(LEAD_STATUS_LABELS);

export default function LeadsPage() {
  const { user } = useAuth();
  const canWrite = canManageCoap(user);
  const initialService = useInitialService("all");

  const { filters, applied, key, setFilters, setPage } = useListFilters({
    search: "",
    service: initialService as string,
    status: "all",
  });

  const state = useUserData(
    () =>
      getLeads({
        page: applied.page,
        pageSize: PAGE_SIZE,
        search: applied.search,
        serviceLine: filterValue<ServiceLine>(applied.service),
        status: filterValue<LeadStatus>(applied.status),
      }),
    `leads:${key}`,
  );

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <PageHeader
        title="Community leads"
        description="Track people, households, and businesses interested in Solektra services."
        actions={
          canWrite ? (
            <Button asChild>
              <Link href="/leads/new">
                <Plus className="h-4 w-4" />
                New lead
              </Link>
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchValue={filters.search}
        onSearchChange={(search) => setFilters({ search })}
        searchPlaceholder="Search name, phone, district…"
        filters={
          <>
            <ServiceSelect
              value={filters.service as ServiceLine | "all"}
              onChange={(service) => setFilters({ service })}
              allowAll
            />
            <FilterSelect
              value={filters.status}
              onChange={(status) => setFilters({ status })}
              placeholder="Status"
              allLabel="All statuses"
              options={STATUS_OPTIONS}
            />
          </>
        }
      />

      <CoapListTable
        state={state}
        page={filters.page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No leads match these filters"
        emptyDescription="Log a conversation or sensitization follow-up as a new lead."
        columns={[
          {
            id: "name",
            header: "Lead",
            cell: (row) => (
              <div>
                <p className="font-medium text-foreground">{row.name}</p>
                <p className="text-xs text-foreground-muted">{row.phone}</p>
              </div>
            ),
          },
          {
            id: "service",
            header: "Service",
            cell: (row) => serviceLineLabel(row.serviceLine),
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => (
              <StatusBadge
                label={LEAD_STATUS_LABELS[row.status]}
                tone={leadStatusTone(row.status)}
              />
            ),
          },
          {
            id: "district",
            header: "Location",
            cell: (row) => `${row.geo.district} · ${row.geo.sector}`,
          },
          {
            id: "actions",
            header: "",
            cell: (row) => <OpenLink href={`/leads/${row.id}`} />,
          },
        ]}
      />

      <MobileQuickActions />
    </div>
  );
}
