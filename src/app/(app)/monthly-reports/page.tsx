"use client";

import { useMemo } from "react";
import { FilterBar } from "@/components/shared/filter-bar";
import {
  FilterSelect,
  toFilterOptions,
} from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { CoapListTable } from "@/features/coap/coap-list-table";
import { CreateReportDialog } from "@/features/reports/create-report-dialog";
import { buildReportColumns } from "@/features/reports/report-columns";
import { ReportStats } from "@/features/reports/report-stats";
import { useAuth } from "@/lib/auth/auth-context";
import {
  REPORT_STATUS_OPTIONS,
  canCreateReport,
  getMonthlyReports,
  getReportFilterOptions,
} from "@/lib/api";
import { filterValue, useListFilters } from "@/lib/hooks/use-list-filters";
import { useUserData } from "@/lib/hooks/use-user-data";
import type { ReportStatus } from "@/types";

const PAGE_SIZE = 10;

export default function MonthlyReportsPage() {
  const { user } = useAuth();
  const isTc = user?.role === "TERRITORY_COORDINATOR";

  const { filters, applied, key, setFilters, setPage } = useListFilters({
    search: "",
    status: "all",
    period: "all",
    tcUserId: "all",
  });

  const options = useUserData(() => getReportFilterOptions(), "report-options");
  const state = useUserData(
    () =>
      getMonthlyReports({
        page: applied.page,
        pageSize: PAGE_SIZE,
        search: applied.search,
        status: filterValue<ReportStatus>(applied.status),
        period: filterValue(applied.period),
        tcUserId: filterValue(applied.tcUserId),
      }),
    `reports:${key}`,
  );

  const columns = useMemo(() => buildReportColumns(!isTc), [isTc]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly reports"
        description="Territory coordination obligations due by the 5th of each following month."
        actions={canCreateReport(user) ? <CreateReportDialog /> : undefined}
      />

      <ReportStats />

      <FilterBar
        searchPlaceholder="Search period or coordinator…"
        searchValue={filters.search}
        onSearchChange={(search) => setFilters({ search })}
        filters={
          <>
            <FilterSelect
              value={filters.status}
              onChange={(status) => setFilters({ status })}
              placeholder="Status"
              allLabel="All statuses"
              options={REPORT_STATUS_OPTIONS}
              widthClass="w-[180px]"
            />
            <FilterSelect
              value={filters.period}
              onChange={(period) => setFilters({ period })}
              placeholder="Period"
              allLabel="All periods"
              options={toFilterOptions(options.data?.periods ?? [])}
              widthClass="w-[140px]"
            />
            {!isTc ? (
              <FilterSelect
                value={filters.tcUserId}
                onChange={(tcUserId) => setFilters({ tcUserId })}
                placeholder="Coordinator"
                allLabel="All coordinators"
                options={(options.data?.coordinators ?? []).map((tc) => ({
                  value: tc.id,
                  label: tc.name,
                }))}
                widthClass="w-[200px]"
              />
            ) : null}
          </>
        }
      />

      <CoapListTable
        state={state}
        columns={columns}
        page={filters.page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No monthly reports"
        emptyDescription={
          canCreateReport(user)
            ? "Use “New report” to start a reporting period."
            : "Reporting obligations will appear here by period."
        }
      />
    </div>
  );
}
