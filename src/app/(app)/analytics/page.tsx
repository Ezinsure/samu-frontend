"use client";

import { useState } from "react";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsCharts } from "@/features/analytics/analytics-charts";
import { AnalyticsKpis } from "@/features/analytics/analytics-kpis";
import { DashboardFiltersBar } from "@/features/dashboard/filters-bar";
import { useAuth } from "@/lib/auth/auth-context";
import {
  defaultDashboardFilters,
  getAnalyticsWorkspace,
  getCoapDashboard,
  type DashboardFilters,
} from "@/lib/api";
import { useRetainedData } from "@/lib/hooks/use-retained-data";
import { useUserData } from "@/lib/hooks/use-user-data";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const isMd = user?.role === "MD_VIEWER";

  const [filters, setFilters] = useState<DashboardFilters>(
    defaultDashboardFilters(),
  );

  const state = useUserData(
    () => getAnalyticsWorkspace(filters),
    `analytics:${JSON.stringify(filters)}`,
  );
  // Programme totals are not filtered by this page's filters — load once.
  const coap = useUserData(() => getCoapDashboard(), "analytics-coap");

  // Keep the filter bar populated while a filter change is reloading.
  const options = useRetainedData(state.data)?.filterOptions;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description={
          isMd
            ? "Read-only deep-dive into COAP delivery, visit compliance, and coordinator performance."
            : "Programme delivery plus visit compliance, SMS confirmation, and TC leaderboard."
        }
      />

      {options ? (
        <DashboardFiltersBar
          value={filters}
          onChange={setFilters}
          provinces={options.provinces}
          districts={options.districts}
          coordinators={options.coordinators}
          showTcFilter={user?.role !== "TERRITORY_COORDINATOR"}
        />
      ) : (
        <Skeleton className="h-28 w-full" />
      )}

      {state.error ? (
        <ErrorState
          title="Could not load analytics"
          description={state.error}
          onRetry={state.reload}
        />
      ) : (
        <>
          <AnalyticsKpis data={state.data} />
          {state.data ? (
            <AnalyticsCharts data={state.data} coap={coap.data} />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              <Skeleton className="h-[340px]" />
              <Skeleton className="h-[340px]" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
