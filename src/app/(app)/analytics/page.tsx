"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  Percent,
  ShieldAlert,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import {
  defaultDashboardFilters,
  getAnalyticsWorkspace,
  getCoapDashboard,
  type AnalyticsWorkspace,
  type CoapDashboard,
  type DashboardFilters,
} from "@/lib/api";
import { DashboardFiltersBar } from "@/features/dashboard/filters-bar";
import {
  ChartCard,
  ComplianceDonutChart,
  HorizontalBarMetricChart,
  VisitTrendChart,
  VisitsByDistrictChart,
} from "@/features/dashboard/charts";
import { TcLeaderboard } from "@/features/dashboard/tables";
import {
  ConfirmationRateTrendChart,
  LeaderboardBarChart,
} from "@/features/analytics/charts";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const isMd = user?.role === "MD_VIEWER";

  const [filters, setFilters] = useState<DashboardFilters>(
    defaultDashboardFilters(),
  );
  const [data, setData] = useState<AnalyticsWorkspace | null>(null);
  const [coap, setCoap] = useState<CoapDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void Promise.all([
      getAnalyticsWorkspace(user, filters),
      getCoapDashboard(user),
    ]).then(([result, coapResult]) => {
      if (!active) return;
      setData(result);
      setCoap(coapResult);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user, filters]);

  const monthLabel = useMemo(() => {
    const names: Record<string, string> = {
      "03": "Mar",
      "04": "Apr",
      "05": "May",
      "06": "Jun",
      "07": "Jul",
      "08": "Aug",
      "09": "Sep",
    };
    return (data?.monthlyTrend ?? []).map((row) => ({
      ...row,
      month: names[row.month] ?? row.month,
    }));
  }, [data]);

  const confirmationTrendLabel = useMemo(() => {
    const names: Record<string, string> = {
      "03": "Mar",
      "04": "Apr",
      "05": "May",
      "06": "Jun",
      "07": "Jul",
      "08": "Aug",
      "09": "Sep",
    };
    return (data?.confirmationTrend ?? []).map((row) => ({
      ...row,
      month: names[row.month] ?? row.month,
    }));
  }, [data]);

  const leaderboardChart = useMemo(
    () =>
      (data?.leaderboard ?? []).map((row) => ({
        name: row.name.split(" ")[0] ?? row.name,
        compliancePercent: row.compliancePercent,
        visits: row.visits,
      })),
    [data],
  );

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

      {data ? (
        <DashboardFiltersBar
          value={filters}
          onChange={setFilters}
          provinces={data.filterOptions.provinces}
          districts={data.filterOptions.districts}
          coordinators={data.filterOptions.coordinators}
          showTcFilter
        />
      ) : (
        <Skeleton className="h-28 w-full" />
      )}

      {loading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Agents in scope"
            value={data.summary.totalAgents}
            context={`${data.summary.activeAgents} active`}
            icon={Users}
          />
          <KpiCard
            title="Visit compliance"
            value={`${data.summary.compliancePercent}%`}
            context={`${data.summary.compliantAgents} green agents`}
            icon={Percent}
          />
          <KpiCard
            title="SMS confirmation"
            value={`${data.summary.confirmationRate}%`}
            context={`${data.summary.visitsInRange} visits in range`}
            icon={ClipboardCheck}
          />
          <KpiCard
            title="Exceptions"
            value={data.summary.overdueAgents}
            context={`${data.summary.openFraudFlags} open fraud flags`}
            icon={ShieldAlert}
          />
        </div>
      )}

      {loading || !data || !coap ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-[340px]" />
          <Skeleton className="h-[340px]" />
        </div>
      ) : (
        <>
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
              <ConfirmationRateTrendChart data={confirmationTrendLabel} />
            </ChartCard>
            <ChartCard
              title="Monthly visit trend"
              description="Visits and unique agents over time"
            >
              <VisitTrendChart data={monthLabel} />
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
      )}
    </div>
  );
}
