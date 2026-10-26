"use client";

import { useMemo } from "react";
import { FilterBar } from "@/components/shared/filter-bar";
import {
  FilterSelect,
  toFilterOptions,
  type FilterOption,
} from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { CoapListTable } from "@/features/coap/coap-list-table";
import { buildScorecardColumns } from "@/features/scorecards/scorecard-columns";
import { ScorecardStats } from "@/features/scorecards/scorecard-stats";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canEvaluateScorecards,
  getReportFilterOptions,
  getScorecards,
} from "@/lib/api";
import { filterValue, useListFilters } from "@/lib/hooks/use-list-filters";
import { useUserData } from "@/lib/hooks/use-user-data";
import type { ScorecardStatus } from "@/types";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: FilterOption[] = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
];

export default function ScorecardsPage() {
  const { user } = useAuth();
  const isTc = user?.role === "TERRITORY_COORDINATOR";
  const canEvaluate = canEvaluateScorecards(user);

  const { filters, applied, key, setFilters, setPage } = useListFilters({
    search: "",
    status: "all",
    period: "all",
  });

  // Periods come from the reports the viewer can see.
  const options = useUserData(() => getReportFilterOptions(), "report-options");
  const state = useUserData(
    () =>
      getScorecards({
        page: applied.page,
        pageSize: PAGE_SIZE,
        search: applied.search,
        status: filterValue<ScorecardStatus>(applied.status),
        period: filterValue(applied.period),
      }),
    `scorecards:${key}`,
  );

  const columns = useMemo(() => buildScorecardColumns(!isTc), [isTc]);

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

      <ScorecardStats isTc={isTc} />

      <FilterBar
        searchPlaceholder="Search period or coordinator…"
        searchValue={filters.search}
        onSearchChange={(search) => setFilters({ search })}
        filters={
          <>
            {!isTc ? (
              <FilterSelect
                value={filters.status}
                onChange={(status) => setFilters({ status })}
                placeholder="Status"
                allLabel="All statuses"
                options={STATUS_OPTIONS}
                widthClass="w-[150px]"
              />
            ) : null}
            <FilterSelect
              value={filters.period}
              onChange={(period) => setFilters({ period })}
              placeholder="Period"
              allLabel="All periods"
              options={toFilterOptions(options.data?.periods ?? [])}
              widthClass="w-[140px]"
            />
          </>
        }
      />

      <CoapListTable
        state={state}
        columns={columns}
        page={filters.page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No scorecards"
        emptyDescription={
          isTc
            ? "Submitted evaluations for your reports will appear here."
            : canEvaluate
              ? "Open a submitted monthly report and choose “Open scorecard” to start an evaluation."
              : "No evaluations available."
        }
      />
    </div>
  );
}
