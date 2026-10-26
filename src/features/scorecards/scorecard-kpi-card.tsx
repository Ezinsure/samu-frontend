"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KPI_LABELS, getMonthlyReportWorkspace } from "@/lib/api";
import { useUserData } from "@/lib/hooks/use-user-data";

/** KPI actuals of the evaluated report (loaded from the reports endpoint). */
export function ScorecardKpiCard({ reportId }: { reportId: string }) {
  const { data, loading } = useUserData(
    () => getMonthlyReportWorkspace(reportId),
    `report:${reportId}`,
  );

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Report KPI snapshot</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : !data ? (
          <p className="text-sm text-foreground-secondary">
            Linked report unavailable.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(data.report.kpiActuals).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm"
              >
                <span className="text-foreground-secondary">
                  {KPI_LABELS[key] ?? key}
                </span>
                <span className="font-medium tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
