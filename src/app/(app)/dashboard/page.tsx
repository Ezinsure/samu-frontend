"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  ListTodo,
  Percent,
  ShieldAlert,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import {
  defaultDashboardFilters,
  getDashboardAnalytics,
  type DashboardAnalytics,
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
import { OverdueAgentsTable, TcLeaderboard } from "@/features/dashboard/tables";

export default function DashboardPage() {
  const { user } = useAuth();
  const isTc = user?.role === "TERRITORY_COORDINATOR";
  const isMd = user?.role === "MD_VIEWER";
  const isOpsOrAdmin =
    user?.role === "ADMIN" || user?.role === "OPERATIONS_MANAGER";

  const [filters, setFilters] = useState<DashboardFilters>(
    defaultDashboardFilters(),
  );
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getDashboardAnalytics(user, filters).then((result) => {
      if (!active) return;
      setData(result);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={isTc ? "Territory dashboard" : "Executive dashboard"}
        description={
          isTc
            ? "Monitor assigned agents, visit progress, and overdue follow-ups."
            : isMd
              ? "Read-only national performance overview for leadership."
              : "National agent monitoring, compliance, and coordinator performance."
        }
        actions={
          isMd ? undefined : (
            <>
              {isTc ? (
                <Button asChild>
                  <Link href="/visits/new">Capture visit</Link>
                </Button>
              ) : null}
              <Button asChild variant={isTc ? "secondary" : "default"}>
                <Link href="/agents">Browse agents</Link>
              </Button>
              {isOpsOrAdmin ? (
                <Button asChild variant="secondary">
                  <Link href="/fraud">Fraud review</Link>
                </Button>
              ) : null}
            </>
          )
        }
      />

      {data ? (
        <DashboardFiltersBar
          value={filters}
          onChange={setFilters}
          provinces={data.filterOptions.provinces}
          districts={data.filterOptions.districts}
          coordinators={data.filterOptions.coordinators}
          showTcFilter={!isTc}
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
            title="Total agents"
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
            title="Visits in range"
            value={data.summary.visitsInRange}
            context={`${data.summary.visitedThisMonth} agents visited in Sep`}
            icon={ClipboardCheck}
          />
          <KpiCard
            title={isTc ? "Open action items" : "Exceptions"}
            value={
              isTc
                ? data.summary.openActionItems
                : data.summary.overdueAgents
            }
            context={
              isTc
                ? `${data.summary.confirmationRate}% SMS confirmation`
                : `${data.summary.openFraudFlags} fraud flags · ${data.summary.openActionItems} actions`
            }
            icon={
              !isTc && data.summary.openFraudFlags > 0 ? ShieldAlert : ListTodo
            }
          />
        </div>
      )}

      {loading || !data ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-[340px]" />
          <Skeleton className="h-[340px]" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title="Compliance distribution"
              description="Red / yellow / green agent visit status"
            >
              <ComplianceDonutChart data={data.complianceDistribution} />
            </ChartCard>
            <ChartCard
              title="Monthly visit trend"
              description="Visits and unique agents over time"
            >
              <VisitTrendChart data={monthLabel} />
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {!isTc ? (
              <ChartCard
                title="Visits by coordinator"
                description="Activity volume in the selected date range"
              >
                <HorizontalBarMetricChart data={data.visitsByTc} />
              </ChartCard>
            ) : (
              <ChartCard
                title="Service readiness gaps"
                description="Agents missing critical tools in your territory"
              >
                <HorizontalBarMetricChart
                  data={data.serviceGaps}
                  dataKey="count"
                  color="#D97706"
                />
              </ChartCard>
            )}
            <ChartCard
              title="Visits by district"
              description="Where field activity is concentrated"
            >
              <VisitsByDistrictChart data={data.visitsByDistrict} />
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              <div>
                <h2 className="text-[20px] font-semibold text-foreground">
                  Overdue agents
                </h2>
                <p className="mt-1 text-sm text-foreground-secondary">
                  No valid monitoring visit for more than 60 days.
                </p>
              </div>
              <OverdueAgentsTable
                rows={data.overdueAgents}
                showTcColumn={!isTc}
              />
            </div>
            <div className="space-y-4">
              {!isTc ? <TcLeaderboard rows={data.leaderboard} /> : null}
              <Card>
                <CardHeader>
                  <CardTitle>Service readiness</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-foreground-secondary">No telecom</span>
                    <span className="font-medium tabular-nums">
                      {data.summary.agentsWithoutTelecom}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-foreground-secondary">No internet</span>
                    <span className="font-medium tabular-nums">
                      {data.summary.agentsWithoutInternet}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-foreground-secondary">
                      No insurance tools
                    </span>
                    <span className="font-medium tabular-nums">
                      {data.summary.agentsWithoutInsurance}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-border pt-2">
                    <span className="text-foreground-secondary">
                      SMS confirmation rate
                    </span>
                    <span className="font-medium tabular-nums text-success">
                      {data.summary.confirmationRate}%
                    </span>
                  </div>
                </CardContent>
              </Card>
              {isTc ? (
                <ChartCard
                  title="Coordinator visits"
                  description="Your visits in the selected range"
                  className="xl:hidden"
                >
                  <HorizontalBarMetricChart data={data.visitsByTc} />
                </ChartCard>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
