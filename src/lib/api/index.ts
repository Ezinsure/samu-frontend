import { DEMO_ACCOUNT_PICKS, DEMO_USERS, TERRITORIES } from "@data/index";
import { delay, paginate } from "@/lib/api/helpers";
import { readDemoStore, updateDemoStore } from "@/lib/store/demo-store";
import { getDashboardAnalytics } from "@/lib/api/dashboard";
import type {
  AppRole,
  ListQuery,
  Paginated,
  SessionUser,
  Territory,
  User,
  Visit,
} from "@/types";

export async function getDemoAccounts() {
  return delay(DEMO_ACCOUNT_PICKS);
}

export async function getUsers(): Promise<Omit<User, "password">[]> {
  return delay(
    DEMO_USERS.map(({ password: _password, ...rest }) => rest),
  );
}

export async function getTerritories(): Promise<Territory[]> {
  return delay(TERRITORIES);
}

export {
  getAgents,
  getAgentById,
  getAgentDetail,
  getAgentFilterOptions,
  createAgent,
  updateAgent,
  canManageAgents,
  complianceTone,
  complianceLabel,
  DEFAULT_AGENT_SERVICES,
} from "@/lib/api/agents";
export type {
  AgentQuery,
  AgentDetail,
  AgentInput,
  AgentAssignment,
} from "@/lib/api/agents";

export interface VisitQuery extends ListQuery {
  tcUserId?: string;
  agentId?: string;
  validation?: string;
}

export async function getVisits(
  query: VisitQuery = {},
  viewer?: SessionUser | null,
): Promise<Paginated<Visit>> {
  const store = readDemoStore();
  let items = [...store.visits];

  if (viewer?.role === "TERRITORY_COORDINATOR") {
    items = items.filter((visit) => visit.tcUserId === viewer.userId);
  }
  if (query.tcUserId) {
    items = items.filter((visit) => visit.tcUserId === query.tcUserId);
  }
  if (query.agentId) {
    items = items.filter((visit) => visit.agentId === query.agentId);
  }
  if (query.validation) {
    items = items.filter((visit) => visit.validation === query.validation);
  }

  items.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

  return delay(paginate(items, query));
}

export async function createVisit(
  visit: Omit<Visit, "id">,
  actorUserId: string,
): Promise<Visit> {
  const created: Visit = {
    ...visit,
    id: `visit-${Date.now()}`,
  };

  updateDemoStore((state) => {
    const agents = state.agents.map((agent) =>
      agent.id === created.agentId
        ? {
            ...agent,
            lastVisitAt: created.endedAt,
            compliance: "green" as const,
          }
        : agent,
    );

    return {
      ...state,
      visits: [created, ...state.visits],
      agents,
      auditLogs: [
        {
          id: `audit-${Date.now()}`,
          actorUserId,
          action: "visit.submit",
          objectType: "visit",
          objectId: created.id,
          timestamp: new Date().toISOString(),
          summary: `Visit submitted for agent ${created.agentId}.`,
        },
        ...state.auditLogs,
      ],
    };
  });

  return delay(created);
}

export async function getDashboardSummary(viewer?: SessionUser | null) {
  const analytics = await getDashboardAnalytics(viewer);
  return {
    totalAgents: analytics.summary.totalAgents,
    activeAgents: analytics.summary.activeAgents,
    overdueAgents: analytics.summary.overdueAgents,
    dueSoonAgents: analytics.summary.dueSoonAgents,
    visitedThisMonth: analytics.summary.visitedThisMonth,
    visitsThisMonth: analytics.summary.visitsInRange,
    confirmationRate: analytics.summary.confirmationRate,
    openFraudFlags: analytics.summary.openFraudFlags,
    openActionItems: analytics.summary.openActionItems,
  };
}

export {
  getDashboardAnalytics,
  defaultDashboardFilters,
} from "@/lib/api/dashboard";
export type {
  DashboardAnalytics,
  DashboardFilters,
} from "@/lib/api/dashboard";

export async function getMonthlyReports(viewer?: SessionUser | null) {
  const store = readDemoStore();
  let reports = store.monthlyReports;
  if (viewer?.role === "TERRITORY_COORDINATOR") {
    reports = reports.filter((report) => report.tcUserId === viewer.userId);
  }
  return delay(reports);
}

export async function getActionItems(viewer?: SessionUser | null) {
  const store = readDemoStore();
  let items = store.actionItems;
  if (viewer?.role === "TERRITORY_COORDINATOR") {
    items = items.filter((item) => item.ownerUserId === viewer.userId);
  }
  return delay(items);
}

export async function getFraudFlags() {
  return delay(readDemoStore().fraudFlags);
}

export async function getSettings() {
  return delay(readDemoStore().settings);
}

export async function getAuditLogs() {
  return delay(readDemoStore().auditLogs);
}

export function canAccessPath(role: AppRole, pathname: string): boolean {
  if (role === "AGENT") {
    return (
      pathname === "/agent" ||
      pathname.startsWith("/agent/") ||
      pathname === "/profile" ||
      pathname.startsWith("/profile/")
    );
  }

  const restricted: Record<string, AppRole[]> = {
    "/territories": ["ADMIN", "OPERATIONS_MANAGER", "MD_VIEWER"],
    "/analytics": ["ADMIN", "OPERATIONS_MANAGER", "MD_VIEWER"],
    "/messaging": ["ADMIN", "OPERATIONS_MANAGER"],
    "/users": ["ADMIN"],
    "/fraud": ["ADMIN", "OPERATIONS_MANAGER", "MD_VIEWER"],
    "/settings": ["ADMIN"],
    "/audit": ["ADMIN", "OPERATIONS_MANAGER"],
    "/design-system": ["ADMIN"],
  };

  for (const [prefix, roles] of Object.entries(restricted)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return roles.includes(role);
    }
  }

  return true;
}
