import { ApiError, apiRequest, getErrorMessage } from "@/lib/http/client";
import type { Agent, SessionUser, Territory } from "@/types";

/** Assignment history row (one coordinator's tenure on a district). */
export interface TerritoryAssignment {
  id: string;
  territoryId: string;
  territoryName: string;
  tcUserId: string;
  tcName: string;
  startedAt: string;
  endedAt?: string;
  active: boolean;
}

export interface TerritoryNode extends Territory {
  children: TerritoryNode[];
  agentCount: number;
  tcName?: string;
}

export interface TerritoryCoordinator {
  id: string;
  name: string;
}

export interface TerritoryTreeResult {
  tree: TerritoryNode[];
  coordinators: TerritoryCoordinator[];
  /** Server-decided: only Admin may reassign coordinators. */
  canManage: boolean;
}

export interface TerritoryWorkspace {
  territory: Territory;
  parentName?: string;
  tcName?: string;
  agents: Array<Agent & { tcName: string }>;
  childSummary: Array<{
    id: string;
    name: string;
    type: Territory["type"];
    agentCount: number;
    tcName?: string;
  }>;
  history: TerritoryAssignment[];
}

/** UI hint only — the API enforces the real permission. */
export function canManageTerritories(viewer?: SessionUser | null) {
  return viewer?.role === "ADMIN";
}

/** Geo tree visible to the signed-in user (TC users receive a scoped tree). */
export function getTerritoryTree(): Promise<TerritoryTreeResult> {
  return apiRequest<TerritoryTreeResult>("/territories/tree");
}

/**
 * Detail workspace for one territory.
 * Returns `null` when the territory is missing or outside the TC's scope,
 * so the page can show an empty state instead of an error.
 */
export async function getTerritoryWorkspace(
  territoryId: string,
): Promise<TerritoryWorkspace | null> {
  try {
    return await apiRequest<TerritoryWorkspace>(
      `/territories/${encodeURIComponent(territoryId)}/workspace`,
    );
  } catch (error) {
    if (error instanceof ApiError && [403, 404].includes(error.status)) {
      return null;
    }
    throw error;
  }
}

/**
 * Assign or reassign a coordinator to a district (Admin only).
 * The API closes the previous assignment and moves the district's agents.
 */
export async function assignTerritoryCoordinator(
  territoryId: string,
  tcUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await apiRequest(`/territories/${encodeURIComponent(territoryId)}/assign`, {
      method: "POST",
      body: { tcUserId },
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function getTerritoryCoordinators(): Promise<TerritoryCoordinator[]> {
  const data = await apiRequest<{ coordinators: TerritoryCoordinator[] }>(
    "/territories/coordinators",
  );
  return data.coordinators;
}
