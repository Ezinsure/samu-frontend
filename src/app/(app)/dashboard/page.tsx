"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Handshake,
  MessageCircleHeart,
  ShoppingBag,
  UserPlus,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canManageCoap,
  getCoapDashboard,
  type CoapDashboard,
} from "@/lib/api";
import {
  ChartCard,
  HorizontalBarMetricChart,
} from "@/features/dashboard/charts";
import { MobileQuickActions } from "@/features/coap/mobile-quick-actions";
import { LEAD_STATUS_LABELS, serviceLineLabel } from "@/lib/coap/catalog";

export default function DashboardPage() {
  const { user } = useAuth();
  const isTc = user?.role === "TERRITORY_COORDINATOR";
  const isMd = user?.role === "MD_VIEWER";
  const canWrite = canManageCoap(user) && !isMd;

  const [data, setData] = useState<CoapDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getCoapDashboard(user).then((result) => {
      if (!active) return;
      setData(result);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <PageHeader
        title={isTc ? "My programme dashboard" : "Community Opportunity dashboard"}
        description={
          isTc
            ? "Track leads, education, onboarding, sales, and feedback in your territory."
            : isMd
              ? "Read-only national view of COAP delivery across service lines."
              : "National programme delivery across IREMBO, banking, internet, devices, insurance, and clean cooking."
        }
        actions={
          canWrite ? (
            <>
              <Button asChild>
                <Link href="/leads/new">New lead</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/activities/new">Log activity</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/services">Services</Link>
              </Button>
            </>
          ) : (
            <Button asChild variant="secondary">
              <Link href="/services">Browse services</Link>
            </Button>
          )
        }
      />

      {loading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            title="Open leads"
            value={data.summary.openLeads}
            context="Active community interest"
            icon={UserPlus}
          />
          <KpiCard
            title="Activities this month"
            value={data.summary.activitiesThisMonth}
            context={`${data.summary.peopleReached} people reached (all time)`}
            icon={ClipboardList}
          />
          <KpiCard
            title="Onboarding in progress"
            value={data.summary.onboardingInProgress}
            context="Cases awaiting completion"
            icon={Handshake}
          />
          <KpiCard
            title="Sales this month"
            value={data.summary.salesThisMonth}
            context={`${data.summary.salesAmountRwf.toLocaleString()} RWF`}
            icon={ShoppingBag}
          />
          <KpiCard
            title="Open feedback"
            value={data.summary.feedbackOpen}
            context="Needs, challenges, opportunities"
            icon={MessageCircleHeart}
          />
          <KpiCard
            title="Quick network"
            value="Agents"
            context="Visit compliance still available under Network"
            icon={Users}
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
              title="Work by service line"
              description="Leads recorded across the six COAP services"
            >
              <HorizontalBarMetricChart
                data={data.byService.map((row) => ({
                  name: row.label,
                  count: row.leads,
                }))}
                dataKey="count"
                color="#2563EB"
              />
            </ChartCard>
            <ChartCard
              title="Activities by service"
              description="Education, demos, mobilization, and campaigns"
            >
              <HorizontalBarMetricChart
                data={data.byService.map((row) => ({
                  name: row.label,
                  count: row.activities,
                }))}
                dataKey="count"
                color="#16A34A"
              />
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Recent leads</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/leads">View all</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.recentLeads.length === 0 ? (
                  <p className="text-sm text-foreground-secondary">
                    No leads yet — capture interest after community conversations.
                  </p>
                ) : (
                  data.recentLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-background px-3 py-2.5 text-sm hover:bg-surface"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{lead.name}</p>
                        <p className="text-xs text-foreground-secondary">
                          {serviceLineLabel(lead.serviceLine)} ·{" "}
                          {LEAD_STATUS_LABELS[lead.status]}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Recent activities</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/activities">View all</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.recentActivities.length === 0 ? (
                  <p className="text-sm text-foreground-secondary">
                    No activities yet — log education or mobilization sessions.
                  </p>
                ) : (
                  data.recentActivities.map((activity) => (
                    <Link
                      key={activity.id}
                      href={`/activities/${activity.id}`}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-background px-3 py-2.5 text-sm hover:bg-surface"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{activity.venue}</p>
                        <p className="text-xs text-foreground-secondary">
                          {serviceLineLabel(activity.serviceLine)} ·{" "}
                          {activity.date} · {activity.peopleReached} reached
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <MobileQuickActions />
    </div>
  );
}
