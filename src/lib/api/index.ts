import { DEMO_ACCOUNT_PICKS, DEMO_USERS } from "@data/index";
import { delay } from "@/lib/api/helpers";
import { readDemoStore } from "@/lib/store/demo-store";
import { getDashboardAnalytics } from "@/lib/api/dashboard";
import type { AppRole, SessionUser, Territory, User } from "@/types";

export async function getDemoAccounts() {
  return delay(DEMO_ACCOUNT_PICKS);
}

export async function getUsers(): Promise<Omit<User, "password">[]> {
  return delay(
    DEMO_USERS.map(({ password: _password, ...rest }) => rest),
  );
}

export async function getTerritories(): Promise<Territory[]> {
  return delay(readDemoStore().territories);
}

export {
  getTerritoryTree,
  getTerritoryWorkspace,
  assignTerritoryCoordinator,
  getTerritoryCoordinators,
  canManageTerritories,
} from "@/lib/api/territories";
export type {
  TerritoryNode,
  TerritoryWorkspace,
  TerritoryAssignment,
} from "@/lib/api/territories";

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

export {
  getVisits,
  getVisitDetail,
  getVisitFilterOptions,
  getGpsThreshold,
  createVisit,
  canCaptureVisits,
  canViewAllVisits,
  distanceMeters,
  evaluateGpsValidation,
  validationTone,
  validationLabel,
  confirmationTone,
  confirmationLabel,
  simulateNearAgentLocation,
  simulateFarAgentLocation,
  VISIT_PURPOSES,
  INTERNET_TYPES,
} from "@/lib/api/visits";
export type {
  VisitQuery,
  VisitListItem,
  VisitDetail,
  VisitCaptureInput,
} from "@/lib/api/visits";

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
