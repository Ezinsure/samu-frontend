import { DEMO_USERS } from "@data/index";
import { delay, matchesSearch, paginate } from "@/lib/api/helpers";
import { readDemoStore, updateDemoStore } from "@/lib/store/demo-store";
import type {
  Agent,
  AgentServices,
  AgentStatus,
  ComplianceTone,
  GeoLocation,
  ListQuery,
  Paginated,
  SessionUser,
  Visit,
} from "@/types";

export interface AgentQuery extends ListQuery {
  province?: string;
  district?: string;
  status?: string;
  tcUserId?: string;
  compliance?: string;
}

export interface AgentAssignment {
  id: string;
  agentId: string;
  tcUserId: string;
  tcName: string;
  startedAt: string;
  endedAt?: string;
  active: boolean;
}

export interface AgentDetail {
  agent: Agent;
  visits: Visit[];
  assignments: AgentAssignment[];
  tcName: string;
}

export interface AgentInput {
  name: string;
  phone: string;
  email?: string;
  code?: string;
  status: AgentStatus;
  geo: GeoLocation;
  registeredLocation: { lat: number; lng: number };
  tcUserId: string;
  services: AgentServices;
  clientsRegistered?: number;
  recruitedThisMonth?: boolean;
  reactivatedThisMonth?: boolean;
  nidVerified?: boolean;
}

function tcName(userId: string) {
  return DEMO_USERS.find((user) => user.id === userId)?.name ?? userId;
}

function maskNidFromPhone(phone: string) {
  return `1********${phone.replace(/\D/g, "").slice(-3)}`;
}

function nextAgentCode(agents: Agent[]) {
  const max = agents.reduce((acc, agent) => {
    const match = agent.code.match(/(\d+)$/);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);
  return `AGT-NEW-${String(max + 1).padStart(3, "0")}`;
}

function scopeAgents(agents: Agent[], viewer?: SessionUser | null) {
  if (viewer?.role === "TERRITORY_COORDINATOR") {
    return agents.filter((agent) => agent.tcUserId === viewer.userId);
  }
  return agents;
}

function canViewAgent(agent: Agent, viewer?: SessionUser | null) {
  if (!viewer) return false;
  if (viewer.role === "TERRITORY_COORDINATOR") {
    return agent.tcUserId === viewer.userId;
  }
  return true;
}

export function canManageAgents(viewer?: SessionUser | null) {
  return viewer?.role === "ADMIN";
}

export async function getAgentFilterOptions(viewer?: SessionUser | null) {
  const agents = scopeAgents(readDemoStore().agents, viewer);
  const provinces = Array.from(new Set(agents.map((a) => a.geo.province))).sort();
  const districts = Array.from(new Set(agents.map((a) => a.geo.district))).sort();
  const statuses = Array.from(new Set(agents.map((a) => a.status))).sort();
  const coordinators = DEMO_USERS.filter((u) => u.role === "TERRITORY_COORDINATOR").map(
    (u) => ({ id: u.id, name: u.name }),
  );

  return delay({ provinces, districts, statuses, coordinators });
}

export async function getAgents(
  query: AgentQuery = {},
  viewer?: SessionUser | null,
): Promise<Paginated<Agent & { tcName: string }>> {
  const store = readDemoStore();
  let items = scopeAgents(store.agents, viewer);

  if (query.tcUserId) items = items.filter((a) => a.tcUserId === query.tcUserId);
  if (query.province) items = items.filter((a) => a.geo.province === query.province);
  if (query.district) items = items.filter((a) => a.geo.district === query.district);
  if (query.status) items = items.filter((a) => a.status === query.status);
  if (query.compliance) items = items.filter((a) => a.compliance === query.compliance);
  if (query.search) {
    items = items.filter((agent) =>
      matchesSearch(
        `${agent.name} ${agent.code} ${agent.phone} ${agent.geo.district} ${agent.geo.sector}`,
        query.search,
      ),
    );
  }

  const sortBy = query.sortBy ?? "name";
  const sortDir = query.sortDir ?? "asc";
  items = [...items].sort((a, b) => {
    const left =
      sortBy === "lastVisit"
        ? a.lastVisitAt ?? ""
        : sortBy === "status"
          ? a.status
          : a.name;
    const right =
      sortBy === "lastVisit"
        ? b.lastVisitAt ?? ""
        : sortBy === "status"
          ? b.status
          : b.name;
    const cmp = left.localeCompare(right);
    return sortDir === "desc" ? -cmp : cmp;
  });

  const page = paginate(items, query);
  return delay({
    ...page,
    data: page.data.map((agent) => ({
      ...agent,
      tcName: tcName(agent.tcUserId),
    })),
  });
}

export async function getAgentById(
  id: string,
  viewer?: SessionUser | null,
): Promise<Agent | null> {
  const agent = readDemoStore().agents.find((item) => item.id === id) ?? null;
  if (!agent || !canViewAgent(agent, viewer)) return delay(null);
  return delay(agent);
}

export async function getAgentDetail(
  id: string,
  viewer?: SessionUser | null,
): Promise<AgentDetail | null> {
  const store = readDemoStore();
  const agent = store.agents.find((item) => item.id === id);
  if (!agent || !canViewAgent(agent, viewer)) return delay(null);

  const visits = store.visits
    .filter((visit) => visit.agentId === id)
    .sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );

  const assignments: AgentAssignment[] = store.assignments
    .filter((item) => item.agentId === id)
    .sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    )
    .map((item) => ({
      ...item,
      tcName: tcName(item.tcUserId),
    }));

  return delay({
    agent,
    visits,
    assignments,
    tcName: tcName(agent.tcUserId),
  });
}

export async function createAgent(
  input: AgentInput,
  actorUserId: string,
): Promise<Agent> {
  const created: Agent = {
    id: `agent-${Date.now()}`,
    code: input.code?.trim() || nextAgentCode(readDemoStore().agents),
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    nidMasked: maskNidFromPhone(input.phone),
    nidVerified: input.nidVerified ?? false,
    status: input.status,
    geo: input.geo,
    registeredLocation: {
      lat: input.registeredLocation.lat,
      lng: input.registeredLocation.lng,
      accuracyMeters: 5,
    },
    tcUserId: input.tcUserId,
    services: input.services,
    compliance: "yellow",
    clientsRegistered: input.clientsRegistered ?? 0,
    recruitedThisMonth: input.recruitedThisMonth ?? true,
    reactivatedThisMonth: input.reactivatedThisMonth ?? false,
    createdAt: new Date().toISOString(),
  };

  updateDemoStore((state) => ({
    ...state,
    agents: [created, ...state.agents],
    assignments: [
      {
        id: `asg-${created.id}`,
        agentId: created.id,
        tcUserId: created.tcUserId,
        startedAt: created.createdAt,
        active: true,
      },
      ...state.assignments,
    ],
    auditLogs: [
      {
        id: `audit-${Date.now()}`,
        actorUserId,
        action: "agent.create",
        objectType: "agent",
        objectId: created.id,
        timestamp: new Date().toISOString(),
        summary: `Created agent ${created.name} (${created.code}).`,
      },
      ...state.auditLogs,
    ],
  }));

  return delay(created);
}

export async function updateAgent(
  id: string,
  input: AgentInput,
  actorUserId: string,
): Promise<Agent | null> {
  const existing = readDemoStore().agents.find((agent) => agent.id === id);
  if (!existing) return delay(null);

  const previousTc = existing.tcUserId;
  const updated: Agent = {
    ...existing,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    code: input.code?.trim() || existing.code,
    nidMasked: maskNidFromPhone(input.phone),
    nidVerified: input.nidVerified ?? existing.nidVerified,
    status: input.status,
    geo: input.geo,
    registeredLocation: {
      ...existing.registeredLocation,
      lat: input.registeredLocation.lat,
      lng: input.registeredLocation.lng,
    },
    tcUserId: input.tcUserId,
    services: input.services,
    clientsRegistered: input.clientsRegistered ?? existing.clientsRegistered,
    recruitedThisMonth:
      input.recruitedThisMonth ?? existing.recruitedThisMonth,
    reactivatedThisMonth:
      input.reactivatedThisMonth ?? existing.reactivatedThisMonth,
  };

  updateDemoStore((state) => {
    const now = new Date().toISOString();
    let assignments = state.assignments;

    if (previousTc !== updated.tcUserId) {
      assignments = [
        {
          id: `asg-${id}-${Date.now()}`,
          agentId: id,
          tcUserId: updated.tcUserId,
          startedAt: now,
          active: true,
        },
        ...assignments.map((item) =>
          item.agentId === id && item.active
            ? { ...item, active: false, endedAt: now }
            : item,
        ),
      ];
    }

    return {
      ...state,
      agents: state.agents.map((agent) => (agent.id === id ? updated : agent)),
      assignments,
      auditLogs: [
        {
          id: `audit-${Date.now()}`,
          actorUserId,
          action:
            previousTc !== updated.tcUserId ? "agent.reassign" : "agent.update",
          objectType: "agent",
          objectId: id,
          timestamp: now,
          summary:
            previousTc !== updated.tcUserId
              ? `Reassigned ${updated.name} from ${tcName(previousTc)} to ${tcName(updated.tcUserId)}.`
              : `Updated agent ${updated.name}.`,
        },
        ...state.auditLogs,
      ],
    };
  });

  return delay(updated);
}

export function complianceTone(compliance: ComplianceTone) {
  if (compliance === "green") return "success" as const;
  if (compliance === "yellow") return "warning" as const;
  return "danger" as const;
}

export function complianceLabel(compliance: ComplianceTone) {
  if (compliance === "green") return "Compliant";
  if (compliance === "yellow") return "Due soon";
  return "Overdue";
}

export const DEFAULT_AGENT_SERVICES: AgentServices = {
  iremboTools: true,
  insuranceTools: true,
  telecomTools: true,
  bkTools: false,
  smartphone: true,
  printer: true,
  internetAvailable: true,
  internetType: "Solektra Telecom",
  brandingVisible: true,
  trainedOnServices: true,
  activelySelling: true,
};
