"use client";

import { FilterBar } from "@/components/shared/filter-bar";
import {
  FilterSelect,
  toFilterOptions,
} from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { CoapListTable } from "@/features/coap/coap-list-table";
import { AUDIT_COLUMNS } from "@/features/audit/audit-columns";
import { getAuditFilterOptions, getAuditLogs } from "@/lib/api";
import { filterValue, useListFilters } from "@/lib/hooks/use-list-filters";
import { useUserData } from "@/lib/hooks/use-user-data";

const PAGE_SIZE = 20;

export default function AuditLogPage() {
  const { filters, applied, key, setFilters, setPage } = useListFilters({
    search: "",
    action: "all",
    objectType: "all",
  });

  const options = useUserData(() => getAuditFilterOptions(), "audit-options");
  const state = useUserData(
    () =>
      getAuditLogs({
        page: applied.page,
        pageSize: PAGE_SIZE,
        search: applied.search,
        action: filterValue(applied.action),
        objectType: filterValue(applied.objectType),
      }),
    `audit:${key}`,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit logs"
        description="Sensitive operations recorded across SAMU, newest first."
      />

      <FilterBar
        searchPlaceholder="Search summary, action, object…"
        searchValue={filters.search}
        onSearchChange={(search) => setFilters({ search })}
        filters={
          <>
            <FilterSelect
              value={filters.action}
              onChange={(action) => setFilters({ action })}
              placeholder="Action"
              allLabel="All actions"
              options={toFilterOptions(options.data?.actions ?? [])}
              widthClass="w-[220px]"
            />
            <FilterSelect
              value={filters.objectType}
              onChange={(objectType) => setFilters({ objectType })}
              placeholder="Object"
              allLabel="All objects"
              options={toFilterOptions(options.data?.objectTypes ?? [])}
              widthClass="w-[200px]"
            />
          </>
        }
      />

      <CoapListTable
        state={state}
        columns={AUDIT_COLUMNS}
        page={filters.page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No audit entries"
        emptyDescription="Nothing matches the current filters."
      />
    </div>
  );
}
