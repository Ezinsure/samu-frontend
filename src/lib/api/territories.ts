import { DEMO_USERS, TERRITORIES } from "@data/index";
import { delay } from "@/lib/api/helpers";
import { readDemoStore, updateDemoStore } from "@/lib/store/demo-store";
import type { Agent, SessionUser, Territory } from "@/types";

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

function userName(userId: string) {
  return DEMO_USERS.find((user) => user.id === userId)?.name ?? userId;
}

function coordinators() {
  return DEMO_USERS.filter((user) => user.role === "TERRITORY_COORDINATOR").map(
    (user) => ({ id: user.id, name: user.name }),
  );
}

export function canManageTerritories(viewer?: SessionUser | null) {
  return viewer?.role === "ADMIN";
}

function agentCountForTerritory(
  territory: Territory,
  territories: Territory[],
  agents: Agent[],
): number {
  if (territory.type === "province") {
    const districtNames = territories
      .filter((item) => item.parentId === territory.id && item.type === "district")
      .map((item) => item.name);
    return agents.filter((agent) => districtNames.includes(agent.geo.district)).length;
  }

  if (territory.type === "district") {
    return agents.filter((agent) => agent.geo.district === territory.name).length;
  }

  if (territory.type === "sector") {
    return agents.filter((agent) => agent.geo.sector === territory.name).length;
  }

  return agents.filter((agent) => agent.geo.cell === territory.name).length;
}

function buildTree(
  territories: Territory[],
  agents: Agent[],
  parentId?: string,
): TerritoryNode[] {
  return territories
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => ({
      ...item,
      tcName: item.tcUserId ? userName(item.tcUserId) : undefined,
      agentCount: agentCountForTerritory(item, territories, agents),
      children: buildTree(territories, agents, item.id),
    }));
}

export async function getTerritoryTree(viewer?: SessionUser | null) {
  const store = readDemoStore();
  let territories = store.territories;
  let agents = store.agents;

  if (viewer?.role === "TERRITORY_COORDINATOR") {
    const allowedDistrictIds = new Set(
      territories
        .filter(
          (item) =>
            item.type === "district" && item.tcUserId === viewer.userId,
        )
        .map((item) => item.id),
    );
    const allowedProvinceIds = new Set(
      territories
        .filter((item) => allowedDistrictIds.has(item.id))
        .map((item) => item.parentId)
        .filter(Boolean) as string[],
    );
    territories = territories.filter(
      (item) =>
        allowedProvinceIds.has(item.id) ||
        allowedDistrictIds.has(item.id) ||
        (item.parentId ? allowedDistrictIds.has(item.parentId) : false),
    );
    agents = agents.filter((agent) => agent.tcUserId === viewer.userId);
  }

  return delay({
    tree: buildTree(territories, agents),
    coordinators: coordinators(),
    canManage: canManageTerritories(viewer),
  });
}

export async function getTerritoryWorkspace(
  territoryId: string,
  viewer?: SessionUser | null,
): Promise<TerritoryWorkspace | null> {
  const store = readDemoStore();
  const territory = store.territories.find((item) => item.id === territoryId);
  if (!territory) return delay(null);

  if (
    viewer?.role === "TERRITORY_COORDINATOR" &&
    territory.type === "district" &&
    territory.tcUserId !== viewer.userId
  ) {
    return delay(null);
  }

  const parent = territory.parentId
    ? store.territories.find((item) => item.id === territory.parentId)
    : undefined;

  let agents = store.agents;
  if (territory.type === "province") {
    const districtNames = store.territories
      .filter((item) => item.parentId === territory.id && item.type === "district")
      .map((item) => item.name);
    agents = agents.filter((agent) => districtNames.includes(agent.geo.district));
  } else if (territory.type === "district") {
    agents = agents.filter((agent) => agent.geo.district === territory.name);
  } else if (territory.type === "sector") {
    agents = agents.filter((agent) => agent.geo.sector === territory.name);
  } else {
    agents = agents.filter((agent) => agent.geo.cell === territory.name);
  }

  if (viewer?.role === "TERRITORY_COORDINATOR") {
    agents = agents.filter((agent) => agent.tcUserId === viewer.userId);
  }

  const children = store.territories
    .filter((item) => item.parentId === territory.id)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((child) => ({
      id: child.id,
      name: child.name,
      type: child.type,
      agentCount: agentCountForTerritory(child, store.territories, store.agents),
      tcName: child.tcUserId ? userName(child.tcUserId) : undefined,
    }));

  const history = store.territoryAssignments
    .filter((item) => item.territoryId === territoryId)
    .sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    )
    .map((item) => ({
      ...item,
      territoryName: territory.name,
      tcName: userName(item.tcUserId),
    }));

  return delay({
    territory,
    parentName: parent?.name,
    tcName: territory.tcUserId ? userName(territory.tcUserId) : undefined,
    agents: agents.map((agent) => ({
      ...agent,
      tcName: userName(agent.tcUserId),
    })),
    childSummary: children,
    history,
  });
}

/**
 * Assign/reassign a TC to a district territory.
 * Closes prior territory assignment, updates district ownership,
 * and reassigns agents in that district to the new TC.
 */
export async function assignTerritoryCoordinator(
  territoryId: string,
  tcUserId: string,
  actorUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const store = readDemoStore();
  const territory = store.territories.find((item) => item.id === territoryId);

  if (!territory || territory.type !== "district") {
    return delay({ ok: false, error: "Only districts can be assigned to a coordinator." });
  }

  const tc = DEMO_USERS.find(
    (user) => user.id === tcUserId && user.role === "TERRITORY_COORDINATOR",
  );
  if (!tc) {
    return delay({ ok: false, error: "Selected user is not a territory coordinator." });
  }

  if (territory.tcUserId === tcUserId) {
    return delay({ ok: false, error: "This district is already assigned to that coordinator." });
  }

  const now = new Date().toISOString();
  const previousTc = territory.tcUserId;

  updateDemoStore((state) => {
    const territories = state.territories.map((item) =>
      item.id === territoryId ? { ...item, tcUserId } : item,
    );

    const territoryAssignments = [
      {
        id: `tasg-${territoryId}-${Date.now()}`,
        territoryId,
        tcUserId,
        startedAt: now,
        active: true,
      },
      ...state.territoryAssignments.map((item) =>
        item.territoryId === territoryId && item.active
          ? { ...item, active: false, endedAt: now }
          : item,
      ),
    ];

    const agentsInDistrict = state.agents.filter(
      (agent) => agent.geo.district === territory.name,
    );

    const agents = state.agents.map((agent) =>
      agent.geo.district === territory.name
        ? { ...agent, tcUserId }
        : agent,
    );

    const agentIds = new Set(agentsInDistrict.map((agent) => agent.id));
    const closedAssignments = state.assignments.map((item) =>
      agentIds.has(item.agentId) && item.active
        ? { ...item, active: false, endedAt: now }
        : item,
    );
    const newAssignments = agentsInDistrict.map((agent, index) => ({
      id: `asg-${agent.id}-${Date.now()}-${index}`,
      agentId: agent.id,
      tcUserId,
      startedAt: now,
      active: true,
    }));

    return {
      ...state,
      territories,
      territoryAssignments,
      agents,
      assignments: [...newAssignments, ...closedAssignments],
      auditLogs: [
        {
          id: `audit-${Date.now()}`,
          actorUserId,
          action: "territory.reassign",
          objectType: "territory",
          objectId: territoryId,
          timestamp: now,
          summary: previousTc
            ? `Reassigned ${territory.name} from ${userName(previousTc)} to ${userName(tcUserId)} (${agentsInDistrict.length} agents updated).`
            : `Assigned ${territory.name} to ${userName(tcUserId)} (${agentsInDistrict.length} agents updated).`,
        },
        ...state.auditLogs,
      ],
    };
  });

  return delay({ ok: true });
}

export async function getTerritoryCoordinators() {
  return delay(coordinators());
}
