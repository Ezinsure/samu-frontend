"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ConfirmationRateTrendChart,
  LeaderboardBarChart,
} from "@/features/analytics/charts";
import {
  ChartCard,
  ComplianceDonutChart,
  HorizontalBarMetricChart,
  VisitTrendChart,
  VisitsByDistrictChart,
} from "@/features/dashboard/charts";
import { TcLeaderboard } from "@/features/dashboard/tables";
import type { AnalyticsWorkspace, CoapDashboard } from "@/lib/api";
import { withMonthLabels } from "@/lib/format/month-label";

interface AnalyticsChartsProps {
  data: AnalyticsWorkspace;
  /** Programme (COAP) totals; charts that need it show a skeleton until loaded. */
  coap: CoapDashboard | null;
}

/** Chart grid for the analytics page. */
export function AnalyticsCharts({ data, coap }: AnalyticsChartsProps) {
  const visitTrend = useMemo(
    () => withMonthLabels(data.monthlyTrend),
    [data.monthlyTrend],
  );
  const confirmationTrend = useMemo(
    () => withMonthLabels(data.confirmationTrend),
    [data.confirmationTrend],
  );
  const leaderboardChart = useMemo(
    () =>
      data.leaderboard.map((row) => ({
        name: row.name.split(" ")[0] ?? row.name,
        compliancePercent: row.compliancePercent,
        visits: row.visits,
      })),
    [data.leaderboard],
  );

  return (
    <>
      {coap ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard
            title="COAP leads by service"
            description="Community opportunity pipeline across six service lines"
          >
            <HorizontalBarMetricChart
              data={coap.byService.map((row) => ({
                name: row.label,
                count: row.leads,
              }))}
              dataKey="count"
              color="#2563EB"
            />
          </ChartCard>
          <ChartCard
            title="COAP sales by service"
            description="Recorded sales volume by programme line"
          >
            <HorizontalBarMetricChart
              data={coap.byService.map((row) => ({
                name: row.label,
                count: row.sales,
              }))}
              dataKey="count"
              color="#16A34A"
            />
          </ChartCard>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-[340px]" />
          <Skeleton className="h-[340px]" />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Service readiness gaps"
          description="Agents missing tools that block field performance"
        >
          <HorizontalBarMetricChart
            data={data.serviceGaps}
            dataKey="count"
            color="#D97706"
          />
        </ChartCard>
        <ChartCard
          title="SMS confirmation mix"
          description="Outcome of visit confirmation messages"
        >
          <ComplianceDonutChart data={data.confirmationBreakdown} />
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Confirmation rate trend"
          description="Share of visits confirmed by SMS over time"
        >
          <ConfirmationRateTrendChart data={confirmationTrend} />
        </ChartCard>
        <ChartCard
          title="Monthly visit trend"
          description="Visits and unique agents over time"
        >
          <VisitTrendChart data={visitTrend} />
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Coordinator compliance leaderboard"
          description="Green-status share of assigned agents"
          className="min-h-[340px]"
        >
          <LeaderboardBarChart data={leaderboardChart} />
        </ChartCard>
        <ChartCard
          title="Visits by district"
          description="Where field activity is concentrated"
        >
          <VisitsByDistrictChart data={data.visitsByDistrict} />
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard
            title="Compliance distribution"
            description="Red / yellow / green agent visit status"
          >
            <ComplianceDonutChart data={data.complianceDistribution} />
          </ChartCard>
        </div>
        <TcLeaderboard rows={data.leaderboard} />
      </div>
    </>
  );
}
