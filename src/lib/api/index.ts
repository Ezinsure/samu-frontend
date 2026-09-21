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

export {
  getFraudFlags,
  getFraudDetail,
  getFraudFilterOptions,
  reviewFraudFlag,
  canReviewFraud,
  canViewFraud,
  fraudStatusTone,
  fraudStatusLabel,
  severityTone,
} from "@/lib/api/fraud";
export type {
  FraudQuery,
  FraudListItem,
  FraudDetail,
  FraudReviewAction,
} from "@/lib/api/fraud";

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

export {
  getActivityGeoOptions,
  getSensitizations,
  getSensitizationDetail,
  createSensitization,
  getTrainings,
  getTrainingDetail,
  createTraining,
  getMeetings,
  getMeetingDetail,
  createMeeting,
  getActionItems,
  updateActionItemStatus,
  createActionItem,
  canCreateActivities,
  canManageActionItems,
  actionPriorityTone,
  actionStatusTone,
  SENSITIZATION_EVENT_TYPES,
  TRAINING_TOPICS,
  TRAINING_FORMATS,
  MEETING_TYPES,
} from "@/lib/api/activities";
export type {
  SensitizationQuery,
  SensitizationListItem,
  SensitizationInput,
  TrainingQuery,
  TrainingListItem,
  TrainingInput,
  MeetingQuery,
  MeetingListItem,
  MeetingInput,
  ActionQuery,
  ActionListItem,
} from "@/lib/api/activities";

export {
  getMonthlyReports,
  getMonthlyReportWorkspace,
  saveMonthlyReportDraft,
  submitMonthlyReport,
  requestReportChanges,
  refreshReportKpis,
  canEditReport,
  canReviewReport,
  reportStatusTone,
  reportStatusLabel,
  NARRATIVE_PROMPTS,
  KPI_LABELS,
} from "@/lib/api/monthly-reports";
export type {
  MonthlyReportQuery,
  MonthlyReportListItem,
  MonthlyReportWorkspace,
} from "@/lib/api/monthly-reports";

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
