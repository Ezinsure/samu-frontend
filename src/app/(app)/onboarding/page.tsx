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
  getOnboardingCases,
  onboardingStatusTone,
} from "@/lib/api";
import {
  ONBOARDING_STATUS_LABELS,
  labelsToOptions,
  serviceLineLabel,
} from "@/lib/coap/catalog";
import { filterValue, useListFilters } from "@/lib/hooks/use-list-filters";
import { useUserData } from "@/lib/hooks/use-user-data";
import type { OnboardingStatus, ServiceLine } from "@/types";

const PAGE_SIZE = 10;
const STATUS_OPTIONS = labelsToOptions(ONBOARDING_STATUS_LABELS);

export default function OnboardingPage() {
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
      getOnboardingCases({
        page: applied.page,
        pageSize: PAGE_SIZE,
        search: applied.search,
        serviceLine: filterValue<ServiceLine>(applied.service),
        status: filterValue<OnboardingStatus>(applied.status),
      }),
    `onboarding:${key}`,
  );

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <PageHeader
        title="Onboarding"
        description="Help customers and agents register, activate, and complete service onboarding."
        actions={
          canWrite ? (
            <Button asChild>
              <Link href="/onboarding/new">
                <Plus className="h-4 w-4" />
                New case
              </Link>
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchValue={filters.search}
        onSearchChange={(search) => setFilters({ search })}
        searchPlaceholder="Search customer, phone, stage…"
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
              widthClass="w-[170px]"
            />
          </>
        }
      />

      <CoapListTable
        state={state}
        page={filters.page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No onboarding cases"
        emptyDescription="Start onboarding from a qualified lead or create a case directly."
        columns={[
          {
            id: "customer",
            header: "Customer",
            cell: (row) => (
              <div>
                <p className="font-medium">{row.customerName}</p>
                <p className="text-xs text-foreground-muted">
                  {row.customerPhone}
                </p>
              </div>
            ),
          },
          {
            id: "service",
            header: "Service",
            cell: (row) => serviceLineLabel(row.serviceLine),
          },
          { id: "stage", header: "Stage", cell: (row) => row.stageLabel },
          {
            id: "status",
            header: "Status",
            cell: (row) => (
              <StatusBadge
                label={ONBOARDING_STATUS_LABELS[row.status]}
                tone={onboardingStatusTone(row.status)}
              />
            ),
          },
          {
            id: "actions",
            header: "",
            cell: (row) => <OpenLink href={`/onboarding/${row.id}`} />,
          },
        ]}
      />

      <MobileQuickActions />
    </div>
  );
}
