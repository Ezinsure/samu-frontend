import type { AppRole } from "@/types";

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
  uploadVisitPhoto,
  createVisit,
  canCaptureVisits,
  canViewAllVisits,
} from "@/lib/api/visits";
export type {
  VisitQuery,
  VisitListItem,
  VisitDetail,
  VisitFilterOptions,
  VisitCaptureInput,
  UploadedVisitPhoto,
} from "@/lib/api/visits";
export {
  distanceMeters,
  evaluateGpsValidation,
  simulateNearAgentLocation,
  simulateFarAgentLocation,
} from "@/lib/visits/gps";
export {
  validationTone,
  validationLabel,
  confirmationTone,
  confirmationLabel,
  VISIT_PURPOSES,
  INTERNET_TYPES,
} from "@/lib/visits/presentation";

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
  FraudFilterOptions,
  FraudReviewAction,
} from "@/lib/api/fraud";

export {
  getDashboardAnalytics,
  defaultDashboardFilters,
} from "@/lib/api/dashboard";
export type {
  DashboardAnalytics,
  DashboardFilters,
} from "@/lib/api/dashboard";

export {
  getMonthlyReports,
  getMonthlyReportWorkspace,
  getReportFilterOptions,
  createMonthlyReport,
  saveMonthlyReportDraft,
  submitMonthlyReport,
  requestReportChanges,
  refreshReportKpis,
  canReviewReport,
  canCreateReport,
} from "@/lib/api/monthly-reports";
export type {
  MonthlyReportQuery,
  MonthlyReportListItem,
  MonthlyReportFilterOptions,
  MonthlyReportWorkspace,
  MonthlyReportDraftInput,
} from "@/lib/api/monthly-reports";
export {
  NARRATIVE_PROMPTS,
  KPI_LABELS,
  EDITABLE_STATUSES,
  AWAITING_REVIEW_STATUSES,
  SCORABLE_STATUSES,
  REPORT_STATUS_OPTIONS,
  reportStatusTone,
  reportStatusLabel,
  currentPeriod,
  previousPeriod,
} from "@/lib/reports/presentation";

export {
  getScorecards,
  getScorecardWorkspace,
  saveScorecardDraft,
  submitScorecard,
  ensureScorecardForReport,
  canEvaluateScorecards,
  canViewScorecards,
} from "@/lib/api/scorecards";
export type {
  ScorecardQuery,
  ScorecardListItem,
  ScorecardWorkspace,
  ScorecardDraftInput,
} from "@/lib/api/scorecards";
export {
  calculateWeightedTotal,
  suggestDecision,
  decisionTone,
  buildBreakdown,
  SCORECARD_CRITERIA,
  SCORECARD_DECISION_RANGES,
} from "@/lib/scorecards/scoring";

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

export * from "@/lib/api/coap";
export * from "@/lib/api/users";

export {
  getSettings,
  updateSettings,
  canEditSettings,
  canViewSettings,
} from "@/lib/api/settings";
export type {
  SystemSettingsView,
  SystemSettingsPatch,
} from "@/lib/api/settings";

export { getAuditLogs, getAuditFilterOptions } from "@/lib/api/audit";
export type {
  AuditQuery,
  AuditLogItem,
  AuditFilterOptions,
} from "@/lib/api/audit";

export {
  getMessagingStatus,
  getMessages,
  sendSms,
  canUseMessaging,
  messageStatusTone,
  messageStatusLabel,
} from "@/lib/api/messaging";
export type {
  MessageQuery,
  MessageStatus,
  OutboxMessage,
  MessagingStatus,
  SendSmsInput,
} from "@/lib/api/messaging";

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
