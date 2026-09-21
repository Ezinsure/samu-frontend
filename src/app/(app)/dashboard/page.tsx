"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, ListTodo, ShieldAlert, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { getDashboardSummary } from "@/lib/api";

type Summary = Awaited<ReturnType<typeof getDashboardSummary>>;

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getDashboardSummary(user).then((data) => {
      if (!active) return;
      setSummary(data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const isTc = user?.role === "TERRITORY_COORDINATOR";
  const isMd = user?.role === "MD_VIEWER";

  return (
    <div className="space-y-6">
      <PageHeader
        title={isTc ? "Territory dashboard" : "Dashboard"}
        description={
          isTc
            ? "Your assigned agents, visit compliance, and open actions."
            : "National overview with role-scoped metrics from the demo data layer."
        }
        actions={
          !isMd ? (
            <Button asChild>
              <Link href="/visits">Open field visits</Link>
            </Button>
          ) : undefined
        }
      />

      {loading || !summary ? (
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
            value={summary.totalAgents}
            context={isTc ? "Assigned to you" : "Across visible scope"}
            icon={Users}
          />
          <KpiCard
            title="Visited this month"
            value={summary.visitedThisMonth}
            context={`${summary.visitsThisMonth} total visits`}
            icon={ClipboardCheck}
          />
          <KpiCard
            title="Overdue agents"
            value={summary.overdueAgents}
            context={`${summary.dueSoonAgents} due soon`}
          />
          <KpiCard
            title="Open actions"
            value={summary.openActionItems}
            context={
              summary.openFraudFlags > 0
                ? `${summary.openFraudFlags} fraud flags open`
                : "No open fraud flags"
            }
            icon={summary.openFraudFlags > 0 ? ShieldAlert : ListTodo}
          />
        </div>
      )}

      <EmptyState
        title="Charts arrive in Phase 3"
        description="Phase 2 wires auth, seeded data, and live KPI counts from /data through API adapters."
        action={
          user?.role === "ADMIN" ? (
            <Button asChild variant="secondary">
              <Link href="/design-system">Open design system</Link>
            </Button>
          ) : (
            <Button asChild variant="secondary">
              <Link href="/agents">Browse agents</Link>
            </Button>
          )
        }
      />
    </div>
  );
}
