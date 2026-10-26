"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import {
  defaultMapFilters,
  getMapWorkspace,
  type MapFilters,
  type MapWorkspace,
} from "@/lib/api";
import { MapFiltersBar } from "@/features/maps/map-filters";

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
  const [data, setData] = useState<MapWorkspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getMapWorkspace(user, filters).then((result) => {
      if (!active) return;
      setData(result);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user, filters]);

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

      {data ? (
        <MapFiltersBar
          value={filters}
          onChange={setFilters}
          provinces={data.filterOptions.provinces}
          districts={data.filterOptions.districts}
          coordinators={data.filterOptions.coordinators}
          showTcFilter={!isTc}
        />
      ) : (
        <Skeleton className="h-28 w-full" />
      )}

      {loading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
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
      )}

      {loading || !data ? (
        <Skeleton className="h-[560px] w-full" />
      ) : (
        <AgentMap
          points={data.points}
          center={data.bounds.center}
          zoom={data.bounds.zoom}
          showTc={!isTc}
        />
      )}
    </div>
  );
}
