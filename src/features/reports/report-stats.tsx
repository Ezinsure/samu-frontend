"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  AWAITING_REVIEW_STATUSES,
  EDITABLE_STATUSES,
  getMonthlyReports,
} from "@/lib/api";
import { useUserData } from "@/lib/hooks/use-user-data";

/** Summary from the 100 most recent reports (the API has no stats endpoint). */
async function loadStats() {
  const { data } = await getMonthlyReports({ page: 1, pageSize: 100 });
  const open = data.filter((item) => EDITABLE_STATUSES.includes(item.status));
  return {
    open: open.length,
    dueSoon: open.filter(
      (item) => item.daysToDeadline >= 0 && item.daysToDeadline <= 7,
    ).length,
    awaiting: data.filter((item) =>
      AWAITING_REVIEW_STATUSES.includes(item.status),
    ).length,
  };
}

/** Open drafts / due soon / awaiting review cards for the reports list. */
export function ReportStats() {
  const { data } = useUserData(loadStats, "report-stats");

  const items = [
    { label: "Open drafts", value: data?.open },
    { label: "Due within 7 days", value: data?.dueSoon },
    { label: "Awaiting review", value: data?.awaiting },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-secondary">
              {item.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {item.value ?? "—"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
