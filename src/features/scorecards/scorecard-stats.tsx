"use client";

import { Card, CardContent } from "@/components/ui/card";
import { getScorecards } from "@/lib/api";
import { useUserData } from "@/lib/hooks/use-user-data";

/** Totals per status via `pageSize: 1` queries (the API has no stats endpoint). */
async function loadCounts() {
  const total = async (status: "draft" | "submitted") =>
    (await getScorecards({ status, page: 1, pageSize: 1 })).total;

  const [draft, submitted] = await Promise.all([
    total("draft"),
    total("submitted"),
  ]);
  return { draft, submitted };
}

/** Draft / submitted counts; TCs only ever have submitted results. */
export function ScorecardStats({ isTc }: { isTc: boolean }) {
  const { data } = useUserData(loadCounts, "scorecard-counts");

  const items = [
    {
      label: isTc ? "Available results" : "Draft evaluations",
      value: isTc ? data?.submitted : data?.draft,
    },
    { label: "Submitted", value: data?.submitted },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
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
