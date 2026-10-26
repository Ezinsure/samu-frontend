"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { FilterBar } from "@/components/shared/filter-bar";
import {
  FilterSelect,
  toFilterOptions,
  type FilterOption,
} from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CoapListTable } from "@/features/coap/coap-list-table";
import { buildVisitColumns } from "@/features/visits/visit-columns";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canCaptureVisits,
  getVisitFilterOptions,
  getVisits,
} from "@/lib/api";
import { filterValue, useListFilters } from "@/lib/hooks/use-list-filters";
import { useUserData } from "@/lib/hooks/use-user-data";
import type { SmsConfirmationStatus, VisitPurpose, VisitValidation } from "@/types";

const PAGE_SIZE = 10;

const VALIDATION_OPTIONS: FilterOption[] = [
  { value: "accepted", label: "Accepted" },
  { value: "flagged", label: "Flagged" },
  { value: "rejected", label: "Rejected" },
];

const CONFIRMATION_OPTIONS: FilterOption[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "disputed", label: "Disputed" },
  { value: "expired", label: "Expired" },
  { value: "delivery_failed", label: "Delivery failed" },
];

export default function VisitsPage() {
  const { user } = useAuth();
  const canCapture = canCaptureVisits(user);
  const isTc = user?.role === "TERRITORY_COORDINATOR";

  const { filters, applied, key, setFilters, setPage } = useListFilters({
    search: "",
    validation: "all",
    confirmation: "all",
    purpose: "all",
    tcUserId: "all",
  });

  const options = useUserData(() => getVisitFilterOptions(), "visit-options");
  const state = useUserData(
    () =>
      getVisits({
        page: applied.page,
        pageSize: PAGE_SIZE,
        search: applied.search,
        validation: filterValue<VisitValidation>(applied.validation),
        confirmation: filterValue<SmsConfirmationStatus>(applied.confirmation),
        purpose: filterValue<VisitPurpose>(applied.purpose),
        tcUserId: filterValue(applied.tcUserId),
      }),
    `visits:${key}`,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field visits"
        description={
          isTc
            ? "Capture and review visits for agents in your territory."
            : "Verified field visit history with GPS validation and SMS confirmation."
        }
        actions={
          canCapture ? (
            <Button asChild>
              <Link href="/visits/new">
                <Plus className="h-4 w-4" />
                Capture visit
              </Link>
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchPlaceholder="Search agent, purpose, district…"
        searchValue={filters.search}
        onSearchChange={(search) => setFilters({ search })}
        filters={
          <>
            <FilterSelect
              value={filters.validation}
              onChange={(validation) => setFilters({ validation })}
              placeholder="Validation"
              allLabel="All validation"
              options={VALIDATION_OPTIONS}
              widthClass="w-[150px]"
            />
            <FilterSelect
              value={filters.confirmation}
              onChange={(confirmation) => setFilters({ confirmation })}
              placeholder="SMS"
              allLabel="All SMS status"
              options={CONFIRMATION_OPTIONS}
            />
            <FilterSelect
              value={filters.purpose}
              onChange={(purpose) => setFilters({ purpose })}
              placeholder="Purpose"
              allLabel="All purposes"
              options={toFilterOptions(options.data?.purposes ?? [])}
              widthClass="w-[170px]"
            />
            {!isTc ? (
              <FilterSelect
                value={filters.tcUserId}
                onChange={(tcUserId) => setFilters({ tcUserId })}
                placeholder="Coordinator"
                allLabel="All coordinators"
                options={(options.data?.coordinators ?? []).map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
                widthClass="w-[180px]"
              />
            ) : null}
          </>
        }
      />

      <CoapListTable
        state={state}
        columns={buildVisitColumns(!isTc)}
        page={filters.page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No visits found"
        emptyDescription="Adjust filters or capture a new field visit."
      />
    </div>
  );
}
