import { DEMO_USERS } from "@data/index";
import { delay } from "@/lib/api/helpers";
import { readDemoStore } from "@/lib/store/demo-store";
import type {
  AgentStatus,
  ComplianceTone,
  SessionUser,
} from "@/types";

export interface MapFilters {
  province?: string;
  district?: string;
  tcUserId?: string;
  compliance?: ComplianceTone;
  status?: AgentStatus;
}

export interface MapAgentPoint {
  id: string;
  code: string;
  name: string;
  phone: string;
  status: AgentStatus;
  compliance: ComplianceTone;
  province: string;
  district: string;
  sector: string;
  lat: number;
  lng: number;
  tcUserId: string;
  tcName: string;
  lastVisitAt?: string;
}

export interface MapWorkspace {
  points: MapAgentPoint[];
  summary: {
    total: number;
    green: number;
    yellow: number;
    red: number;
  };
  filterOptions: {
    provinces: string[];
    districts: string[];
    coordinators: Array<{ id: string; name: string }>;
  };
  bounds: {
    center: { lat: number; lng: number };
    zoom: number;
  };
}

function tcName(userId: string) {
  return DEMO_USERS.find((user) => user.id === userId)?.name ?? userId;
}

function scopeAgents(
  agents: ReturnType<typeof readDemoStore>["agents"],
  viewer?: SessionUser | null,
) {
  if (viewer?.role === "TERRITORY_COORDINATOR") {
    return agents.filter((agent) => agent.tcUserId === viewer.userId);
  }
  return agents;
}

export function defaultMapFilters(): MapFilters {
  return {};
}

export async function getMapWorkspace(
  viewer?: SessionUser | null,
  filters: MapFilters = defaultMapFilters(),
): Promise<MapWorkspace> {
  const store = readDemoStore();
  const scoped = scopeAgents(store.agents, viewer);

  let filtered = scoped;
  if (filters.province) {
    filtered = filtered.filter((agent) => agent.geo.province === filters.province);
  }
  if (filters.district) {
    filtered = filtered.filter((agent) => agent.geo.district === filters.district);
  }
  if (filters.tcUserId) {
    filtered = filtered.filter((agent) => agent.tcUserId === filters.tcUserId);
  }
  if (filters.compliance) {
    filtered = filtered.filter((agent) => agent.compliance === filters.compliance);
  }
  if (filters.status) {
    filtered = filtered.filter((agent) => agent.status === filters.status);
  }

  const points: MapAgentPoint[] = filtered.map((agent) => ({
    id: agent.id,
    code: agent.code,
    name: agent.name,
    phone: agent.phone,
    status: agent.status,
    compliance: agent.compliance,
    province: agent.geo.province,
    district: agent.geo.district,
    sector: agent.geo.sector,
    lat: agent.registeredLocation.lat,
    lng: agent.registeredLocation.lng,
    tcUserId: agent.tcUserId,
    tcName: tcName(agent.tcUserId),
    lastVisitAt: agent.lastVisitAt,
  }));

  const provinces = Array.from(
    new Set(scoped.map((agent) => agent.geo.province)),
  ).sort();
  const districts = Array.from(
    new Set(
      scoped
        .filter((agent) =>
          filters.province ? agent.geo.province === filters.province : true,
        )
        .map((agent) => agent.geo.district),
    ),
  ).sort();

  const avgLat =
    points.reduce((sum, point) => sum + point.lat, 0) / Math.max(points.length, 1);
  const avgLng =
    points.reduce((sum, point) => sum + point.lng, 0) / Math.max(points.length, 1);

  return delay({
    points,
    summary: {
      total: points.length,
      green: points.filter((point) => point.compliance === "green").length,
      yellow: points.filter((point) => point.compliance === "yellow").length,
      red: points.filter((point) => point.compliance === "red").length,
    },
    filterOptions: {
      provinces,
      districts,
      coordinators: DEMO_USERS.filter(
        (user) => user.role === "TERRITORY_COORDINATOR",
      ).map((user) => ({ id: user.id, name: user.name })),
    },
    bounds: {
      center: {
        lat: Number.isFinite(avgLat) ? avgLat : -1.95,
        lng: Number.isFinite(avgLng) ? avgLng : 30.06,
      },
      zoom: viewer?.role === "TERRITORY_COORDINATOR" ? 11 : 9.5,
    },
  });
}
