import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { getDistrictStats } from "./territory-helpers";

type DistrictStats = ReturnType<typeof getDistrictStats>;

/** Summary tiles above the tree (province/district/assignment counts). */
export function TerritoryStats({
  stats,
  loading,
}: {
  stats: DistrictStats;
  loading: boolean;
}) {
  const items = [
    { label: "Provinces", value: stats.provinces },
    { label: "Districts", value: stats.districts },
    { label: "Assigned to TC", value: stats.assigned },
    { label: "Unassigned", value: stats.unassigned },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-secondary">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {loading ? "—" : item.value}
              </p>
            </div>
            <MapPin className="h-5 w-5 text-primary-600" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
