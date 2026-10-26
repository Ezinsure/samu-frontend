"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, MapPin, ShieldAlert, ShieldCheck } from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { MapFiltersBar } from "@/features/maps/map-filters";
import { useAuth } from "@/lib/auth/auth-context";
import {
  defaultMapFilters,
  getMapWorkspace,
  type MapFilters,
} from "@/lib/api";
import { useRetainedData } from "@/lib/hooks/use-retained-data";
import { useUserData } from "@/lib/hooks/use-user-data";

const AgentMap = dynamic(
  () =>
    import("@/features/maps/agent-map").then((mod) => ({
      default: mod.AgentMap,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[560px] w-full" />,
  },
);

export default function MapsPage() {
  const { user } = useAuth();
  const isTc = user?.role === "TERRITORY_COORDINATOR";

  const [filters, setFilters] = useState<MapFilters>(defaultMapFilters());
  const state = useUserData(
    () => getMapWorkspace(filters),
    `map:${JSON.stringify(filters)}`,
  );
  const { data } = state;

  // Keep the filter bar populated while a filter change is reloading.
  const options = useRetainedData(data)?.filterOptions;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent map"
        description={
          isTc
            ? "Map of agents delivering COAP services in your territory, colored by visit compliance."
            : "National agent distribution for programme delivery assurance. NID is never shown on the map."
        }
      />

      {options ? (
        <MapFiltersBar
          value={filters}
          onChange={setFilters}
          provinces={options.provinces}
          districts={options.districts}
          coordinators={options.coordinators}
          showTcFilter={!isTc}
        />
      ) : (
        <Skeleton className="h-28 w-full" />
      )}

      {state.error ? (
        <ErrorState
          title="Could not load the map"
          description={state.error}
          onRetry={state.reload}
        />
      ) : !data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-[560px] w-full" />
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Agents on map"
              value={data.summary.total}
              context="Matching current filters"
              icon={MapPin}
            />
            <KpiCard
              title="Compliant"
              value={data.summary.green}
              context="Green visit status"
              icon={ShieldCheck}
            />
            <KpiCard
              title="Due soon"
              value={data.summary.yellow}
              context="Yellow visit status"
              icon={AlertTriangle}
            />
            <KpiCard
              title="Overdue"
              value={data.summary.red}
              context="Red visit status"
              icon={ShieldAlert}
            />
          </div>
          <AgentMap
            points={data.points}
            center={data.bounds.center}
            zoom={data.bounds.zoom}
            showTc={!isTc}
          />
        </>
      )}
    </div>
  );
}
