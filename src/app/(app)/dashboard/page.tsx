import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="National overview shell. Charts and live metrics arrive in Phase 3."
        actions={
          <Button asChild variant="secondary">
            <Link href="/design-system">Open design system</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total agents"
          value="1,284"
          context="Illustrative placeholder"
          icon={Users}
          trend={{ direction: "up", label: "+12 this month" }}
        />
        <KpiCard
          title="Visit compliance"
          value="92.4%"
          context="Illustrative placeholder"
          trend={{ direction: "up", label: "+1.2 pts" }}
        />
        <KpiCard
          title="Visits this month"
          value="246"
          context="Illustrative placeholder"
          trend={{ direction: "flat", label: "On pace" }}
        />
        <KpiCard
          title="Overdue agents"
          value="18"
          context="Illustrative placeholder"
          trend={{ direction: "down", label: "-3 vs last week" }}
        />
      </div>

      <EmptyState
        title="Analytics widgets coming in Phase 3"
        description="This shell confirms layout, navigation, and KPI cards. Connect dummy data next."
        action={
          <Button asChild>
            <Link href="/design-system">Browse UI kit</Link>
          </Button>
        }
      />
    </div>
  );
}
