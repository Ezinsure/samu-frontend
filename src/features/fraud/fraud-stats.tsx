"use client";

import { Card, CardContent } from "@/components/ui/card";
import { getFraudFlags } from "@/lib/api";
import { useUserData } from "@/lib/hooks/use-user-data";

/** Totals per status via `pageSize: 1` queries (the API has no stats endpoint). */
async function loadCounts() {
  const total = async (status: "open" | "escalated" | "resolved" | "dismissed") =>
    (await getFraudFlags({ status, page: 1, pageSize: 1 })).total;

  const [open, escalated, resolved, dismissed] = await Promise.all([
    total("open"),
    total("escalated"),
    total("resolved"),
    total("dismissed"),
  ]);
  return { open, escalated, closed: resolved + dismissed };
}

/** Open / escalated / closed summary cards for the fraud queue. */
export function FraudStats() {
  const { data } = useUserData(loadCounts, "fraud-counts");

  const items = [
    { label: "Open", value: data?.open },
    { label: "Escalated", value: data?.escalated },
    { label: "Closed", value: data?.closed },
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
