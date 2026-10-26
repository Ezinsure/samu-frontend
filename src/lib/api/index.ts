import { DEMO_USERS } from "@data/index";
import { delay } from "@/lib/api/helpers";
import { readDemoStore } from "@/lib/store/demo-store";
import { getDashboardAnalytics } from "@/lib/api/dashboard";
import type { AppRole, SessionUser, User } from "@/types";

export async function getUsers(): Promise<Omit<User, "password">[]> {
  return delay(
    DEMO_USERS.map(({ password: _password, ...rest }) => rest),
  );
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
  TerritoryCoordinator,
  TerritoryTreeResult,
} from "@/lib/api/territories";

export {
  getAgents,
  getAgentById,
  getAgentDetail,
  getAgentFilterOptions,
  createAgent,
  updateAgent,
  canManageAgents,
  agentStatusTone,
  complianceTone,
  complianceLabel,
  DEFAULT_AGENT_SERVICES,
} from "@/lib/api/agents";
export type {
  AgentQuery,
  AgentDetail,
  AgentInput,
  AgentAssignment,
  AgentRow,
  AgentFilterOptions,
  AgentMutationResult,
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

export {
  getScorecards,
  getScorecardWorkspace,
  saveScorecardDraft,
  submitScorecard,
  ensureScorecardForReport,
  canEvaluateScorecards,
  canViewScorecards,
  calculateWeightedTotal,
  suggestDecision,
  decisionTone,
  SCORECARD_CRITERIA,
  SCORECARD_DECISION_RANGES,
} from "@/lib/api/scorecards";
export type {
  ScorecardQuery,
  ScorecardListItem,
  ScorecardWorkspace,
} from "@/lib/api/scorecards";

export {
  getMapWorkspace,
  defaultMapFilters,
} from "@/lib/api/maps";
export type {
  MapFilters,
  MapAgentPoint,
  MapWorkspace,
} from "@/lib/api/maps";

export {
  getAnalyticsWorkspace,
} from "@/lib/api/analytics";
export type {
  AnalyticsWorkspace,
} from "@/lib/api/analytics";

export {
  canManageCoap,
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  getFieldActivities,
  getFieldActivityById,
  createFieldActivity,
  getOnboardingCases,
  getOnboardingById,
  createOnboardingCase,
  updateOnboardingCase,
  getSales,
  getSaleById,
  createSale,
  getCommunityFeedback,
  getFeedbackById,
  createCommunityFeedback,
  updateCommunityFeedback,
  getServicesWorkspace,
  getCoapDashboard,
  getCoapFilterOptions,
  leadStatusTone,
  onboardingStatusTone,
  feedbackStatusTone,
  feedbackSeverityTone,
} from "@/lib/api/coap";
export type {
  LeadQuery,
  LeadListItem,
  LeadInput,
  ActivityQuery,
  ActivityListItem,
  ActivityInput,
  OnboardingQuery,
  OnboardingListItem,
  OnboardingInput,
  SaleQuery,
  SaleListItem,
  SaleInput,
  FeedbackQuery,
  FeedbackListItem,
  FeedbackInput,
  ServiceLineSummary,
  CoapDashboard,
} from "@/lib/api/coap";

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
    "/reports": ["ADMIN", "OPERATIONS_MANAGER", "MD_VIEWER"],
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
