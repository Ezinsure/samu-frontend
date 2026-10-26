"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { FilterBar } from "@/components/shared/filter-bar";
import { FilterSelect } from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CoapListTable, OpenLink } from "@/features/coap/coap-list-table";
import { MobileQuickActions } from "@/features/coap/mobile-quick-actions";
import { ServiceSelect } from "@/features/coap/service-select";
import { useInitialService } from "@/features/coap/use-initial-service";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCoap, getFieldActivities } from "@/lib/api";
import {
  ACTIVITY_TYPE_LABELS,
  labelsToOptions,
  serviceLineLabel,
} from "@/lib/coap/catalog";
import { filterValue, useListFilters } from "@/lib/hooks/use-list-filters";
import { useUserData } from "@/lib/hooks/use-user-data";
import type { FieldActivityType, ServiceLine } from "@/types";

const PAGE_SIZE = 10;
const TYPE_OPTIONS = labelsToOptions(ACTIVITY_TYPE_LABELS);

export default function ActivitiesPage() {
  const { user } = useAuth();
  const canWrite = canManageCoap(user);
  const initialService = useInitialService("all");

  const { filters, applied, key, setFilters, setPage } = useListFilters({
    search: "",
    service: initialService as string,
    activityType: "all",
  });

  const state = useUserData(
    () =>
      getFieldActivities({
        page: applied.page,
        pageSize: PAGE_SIZE,
        search: applied.search,
        serviceLine: filterValue<ServiceLine>(applied.service),
        activityType: filterValue<FieldActivityType>(applied.activityType),
      }),
    `activities:${key}`,
  );

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <PageHeader
        title="Field activities"
        description="Log education, demos, mobilization, support, and local campaigns by service line."
        actions={
          canWrite ? (
            <Button asChild>
              <Link href="/activities/new">
                <Plus className="h-4 w-4" />
                Log activity
              </Link>
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchValue={filters.search}
        onSearchChange={(search) => setFilters({ search })}
        searchPlaceholder="Search venue, summary, district…"
        filters={
          <>
            <ServiceSelect
              value={filters.service as ServiceLine | "all"}
              onChange={(service) => setFilters({ service })}
              allowAll
            />
            <FilterSelect
              value={filters.activityType}
              onChange={(activityType) => setFilters({ activityType })}
              placeholder="Type"
              allLabel="All types"
              options={TYPE_OPTIONS}
            />
          </>
        }
      />

      <CoapListTable
        state={state}
        page={filters.page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No activities yet"
        emptyDescription="Log an education session or community mobilization for any service line."
        columns={[
          { id: "date", header: "Date", cell: (row) => row.date },
          {
            id: "type",
            header: "Type",
            cell: (row) => ACTIVITY_TYPE_LABELS[row.activityType],
          },
          {
            id: "service",
            header: "Service",
            cell: (row) => serviceLineLabel(row.serviceLine),
          },
          {
            id: "venue",
            header: "Venue",
            cell: (row) => (
              <div>
                <p className="font-medium">{row.venue}</p>
                <p className="text-xs text-foreground-muted">
                  {row.geo.district} · {row.peopleReached} reached
                </p>
              </div>
            ),
          },
          {
            id: "actions",
            header: "",
            cell: (row) => <OpenLink href={`/activities/${row.id}`} />,
          },
        ]}
      />

      <MobileQuickActions />
    </div>
  );
}
