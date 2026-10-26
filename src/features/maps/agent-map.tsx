"use client";

import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import Map, {
  Layer,
  NavigationControl,
  Popup,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import { useTheme } from "next-themes";
import { useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  complianceLabel,
  complianceTone,
  type MapAgentPoint,
} from "@/lib/api";

const LIGHT_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const DARK_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const COMPLIANCE_COLOR: [
  "match",
  ["get", "compliance"],
  "green",
  "#16A34A",
  "yellow",
  "#D97706",
  "red",
  "#DC2626",
  "#2563EB",
] = [
  "match",
  ["get", "compliance"],
  "green",
  "#16A34A",
  "yellow",
  "#D97706",
  "red",
  "#DC2626",
  "#2563EB",
];

/** `useSyncExternalStore` subscription that never fires (value is static). */
const subscribeNoop = () => () => {};

interface AgentMapProps {
  points: MapAgentPoint[];
  center: { lat: number; lng: number };
  zoom: number;
  showTc?: boolean;
}

export function AgentMap({ points, center, zoom, showTc = true }: AgentMapProps) {
  const { resolvedTheme } = useTheme();
  const mapRef = useRef<MapRef>(null);
  // Store only the id: when filters replace `points`, a stale popup disappears.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = points.find((point) => point.id === selectedId) ?? null;
  const setSelected = useCallback(
    (point: MapAgentPoint | null) => setSelectedId(point?.id ?? null),
    [],
  );
  // false during SSR/hydration, true in the browser (theme is client-only).
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: points.map((point) => ({
        type: "Feature" as const,
        properties: {
          id: point.id,
          code: point.code,
          name: point.name,
          compliance: point.compliance,
          status: point.status,
          district: point.district,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [point.lng, point.lat] as [number, number],
        },
      })),
    }),
    [points],
  );

  const mapStyle = mounted && resolvedTheme === "dark" ? DARK_STYLE : LIGHT_STYLE;

  const onClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature) {
        setSelected(null);
        return;
      }

      if (feature.layer?.id === "clusters") {
        const clusterId = feature.properties?.cluster_id as number | undefined;
        const source = mapRef.current?.getSource("agents") as
          | {
              getClusterExpansionZoom: (
                id: number,
                cb: (err: Error | null, zoom: number) => void,
              ) => void;
            }
          | undefined;
        if (clusterId != null && source) {
          source.getClusterExpansionZoom(clusterId, (err, nextZoom) => {
            if (err) return;
            const coords = (feature.geometry as GeoJSON.Point).coordinates;
            mapRef.current?.easeTo({
              center: [coords[0], coords[1]],
              zoom: nextZoom,
              duration: 400,
            });
          });
        }
        return;
      }

      if (feature.layer?.id === "unclustered-point") {
        const id = feature.properties?.id as string;
        const match = points.find((point) => point.id === id) ?? null;
        setSelected(match);
      }
    },
    [points, setSelected],
  );

  useEffect(() => {
    mapRef.current?.flyTo({
      center: [center.lng, center.lat],
      zoom,
      duration: 600,
    });
  }, [center.lat, center.lng, zoom, points.length]);

  if (!mounted) {
    return (
      <div className="flex h-[560px] items-center justify-center rounded-[var(--radius-lg)] border border-border bg-surface text-sm text-foreground-secondary">
        Loading map…
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border shadow-[var(--samu-shadow-card)]">
      <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2 rounded-[var(--radius-md)] border border-border bg-surface/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
        <LegendDot color="#16A34A" label="Compliant" />
        <LegendDot color="#D97706" label="Due soon" />
        <LegendDot color="#DC2626" label="Overdue" />
        <LegendDot color="#2563EB" label="Cluster" />
      </div>

      <Map
        ref={mapRef}
        initialViewState={{
          longitude: center.lng,
          latitude: center.lat,
          zoom,
        }}
        mapStyle={mapStyle}
        style={{ width: "100%", height: 560 }}
        interactiveLayerIds={["clusters", "unclustered-point"]}
        cursor="pointer"
        onClick={onClick}
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="top-right" />
        <Source
          id="agents"
          type="geojson"
          data={geojson}
          cluster
          clusterMaxZoom={14}
          clusterRadius={48}
        >
          <Layer
            id="clusters"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": "#2563EB",
              "circle-radius": [
                "step",
                ["get", "point_count"],
                18,
                8,
                24,
                20,
                32,
              ],
              "circle-opacity": 0.85,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            filter={["has", "point_count"]}
            layout={{
              "text-field": ["get", "point_count_abbreviated"],
              "text-size": 12,
            }}
            paint={{
              "text-color": "#ffffff",
            }}
          />
          <Layer
            id="unclustered-point"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": COMPLIANCE_COLOR,
              "circle-radius": 8,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            }}
          />
        </Source>

        {selected ? (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            anchor="bottom"
            offset={14}
            onClose={() => setSelected(null)}
            closeOnClick={false}
            className="samu-map-popup"
          >
            <div className="min-w-[220px] space-y-2 p-1">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {selected.name}
                </p>
                <p className="text-xs text-foreground-muted">{selected.code}</p>
              </div>
              <StatusBadge
                label={complianceLabel(selected.compliance)}
                tone={complianceTone(selected.compliance)}
              />
              <dl className="space-y-1 text-xs text-foreground-secondary">
                <div className="flex justify-between gap-3">
                  <dt>Location</dt>
                  <dd className="text-right text-foreground">
                    {selected.district}, {selected.sector}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Status</dt>
                  <dd className="text-foreground">{selected.status}</dd>
                </div>
                {showTc ? (
                  <div className="flex justify-between gap-3">
                    <dt>Coordinator</dt>
                    <dd className="text-right text-foreground">
                      {selected.tcName}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <dt>Last visit</dt>
                  <dd className="text-foreground">
                    {selected.lastVisitAt
                      ? new Date(selected.lastVisitAt).toLocaleDateString()
                      : "Never"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Phone</dt>
                  <dd className="text-foreground">{selected.phone}</dd>
                </div>
              </dl>
              <Button asChild size="sm" className="w-full">
                <Link href={`/agents/${selected.id}`}>Open agent</Link>
              </Button>
            </div>
          </Popup>
        ) : null}
      </Map>

      {points.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-surface/60">
          <p className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2 text-sm text-foreground-secondary shadow-sm">
            No agents match the current filters.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-foreground-secondary">
      <span
        className="inline-block size-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
