import { apiRequest } from "@/lib/http/client";
import type { AgentStatus, ComplianceTone } from "@/types";

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

export function defaultMapFilters(): MapFilters {
  return {};
}

/** Agent points (never NID) with compliance summary, scoped to the viewer by the API. */
export function getMapWorkspace(
  filters: MapFilters = {},
): Promise<MapWorkspace> {
  return apiRequest("/maps/workspace", { query: { ...filters } });
}
