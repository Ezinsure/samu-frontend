import { ClipboardCheck, Percent, ShieldAlert, Users } from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsWorkspace } from "@/lib/api";

/** Headline numbers for the analytics page (skeletons while `data` is null). */
export function AnalyticsKpis({ data }: { data: AnalyticsWorkspace | null }) {
  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
    );
  }

  const { summary } = data;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Agents in scope"
        value={summary.totalAgents}
        context={`${summary.activeAgents} active`}
        icon={Users}
      />
      <KpiCard
        title="Visit compliance"
        value={`${summary.compliancePercent}%`}
        context={`${summary.compliantAgents} green agents`}
        icon={Percent}
      />
      <KpiCard
        title="SMS confirmation"
        value={`${summary.confirmationRate}%`}
        context={`${summary.visitsInRange} visits in range`}
        icon={ClipboardCheck}
      />
      <KpiCard
        title="Exceptions"
        value={summary.overdueAgents}
        context={`${summary.openFraudFlags} open fraud flags`}
        icon={ShieldAlert}
      />
    </div>
  );
}
