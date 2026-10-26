"use client";

import { FilterBar } from "@/components/shared/filter-bar";
import {
  FilterSelect,
  toFilterOptions,
  type FilterOption,
} from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { CoapListTable } from "@/features/coap/coap-list-table";
import { FRAUD_COLUMNS } from "@/features/fraud/fraud-columns";
import { FraudStats } from "@/features/fraud/fraud-stats";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canReviewFraud,
  getFraudFilterOptions,
  getFraudFlags,
} from "@/lib/api";
import { filterValue, useListFilters } from "@/lib/hooks/use-list-filters";
import { useUserData } from "@/lib/hooks/use-user-data";
import type { FraudFlag } from "@/types";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: FilterOption[] = [
  { value: "open", label: "Open" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

const SEVERITY_OPTIONS: FilterOption[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function FraudQueuePage() {
  const { user } = useAuth();
  const canReview = canReviewFraud(user);
  const isMd = user?.role === "MD_VIEWER";

  // The queue opens on unresolved flags.
  const { filters, applied, key, setFilters, setPage } = useListFilters({
    search: "",
    status: "open",
    severity: "all",
    type: "all",
  });

  const options = useUserData(() => getFraudFilterOptions(), "fraud-options");
  const state = useUserData(
    () =>
      getFraudFlags({
        page: applied.page,
        pageSize: PAGE_SIZE,
        search: applied.search,
        status: filterValue<FraudFlag["status"]>(applied.status),
        severity: filterValue<FraudFlag["severity"]>(applied.severity),
        type: filterValue(applied.type),
      }),
    `fraud:${key}`,
  );

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

      <FraudStats />

      <FilterBar
        searchPlaceholder="Search agent, type, coordinator…"
        searchValue={filters.search}
        onSearchChange={(search) => setFilters({ search })}
        filters={
          <>
            <FilterSelect
              value={filters.status}
              onChange={(status) => setFilters({ status })}
              placeholder="Status"
              allLabel="All statuses"
              options={STATUS_OPTIONS}
              widthClass="w-[150px]"
            />
            <FilterSelect
              value={filters.severity}
              onChange={(severity) => setFilters({ severity })}
              placeholder="Severity"
              allLabel="All severities"
              options={SEVERITY_OPTIONS}
              widthClass="w-[140px]"
            />
            <FilterSelect
              value={filters.type}
              onChange={(type) => setFilters({ type })}
              placeholder="Type"
              allLabel="All types"
              options={toFilterOptions(options.data?.types ?? [])}
              widthClass="w-[200px]"
            />
          </>
        }
      />

      <CoapListTable
        state={state}
        columns={FRAUD_COLUMNS}
        page={filters.page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No fraud flags"
        emptyDescription="No flags match the current filters."
      />
    </div>
  );
}
