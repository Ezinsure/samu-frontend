/** Shared domain types for the SAMU frontend. */

export type AppRole =
  | "ADMIN"
  | "OPERATIONS_MANAGER"
  | "MD_VIEWER"
  | "TERRITORY_COORDINATOR"
  | "AGENT";

export type AgentStatus = "Active" | "Inactive" | "Suspended" | "Pending verification";
export type ComplianceTone = "green" | "yellow" | "red";

export type VisitPurpose =
  | "Ezinsure Support"
  | "Performance Review"
  | "Problem Solving"
  | "COAP Education"
  | "COAP Onboarding Support"
  | "COAP Sales Follow-up"
  | "Community Feedback";

export type VisitValidation = "accepted" | "flagged" | "rejected";
export type SmsConfirmationStatus =
  | "pending"
  | "confirmed"
  | "disputed"
  | "expired"
  | "delivery_failed";

export type ReportStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "resubmitted"
  | "reviewed"
  | "evaluated";

export interface GeoLocation {
  province: string;
  district: string;
  sector: string;
  cell: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
  accuracyMeters?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: AppRole;
  roleLabel: string;
  active: boolean;
  territoryIds: string[];
  agentId?: string;
  avatarInitials: string;
}

export interface Territory {
  id: string;
  name: string;
  type: "province" | "district" | "sector" | "cell";
  parentId?: string;
  tcUserId?: string;
}

export interface AgentServices {
  iremboTools: boolean;
  insuranceTools: boolean;
  telecomTools: boolean;
  bkTools: boolean;
  smartphone: boolean;
  printer: boolean;
  internetAvailable: boolean;
  internetType?: string;
  brandingVisible: boolean;
  trainedOnServices: boolean;
  activelySelling: boolean;
  /** COAP: clean cooking readiness */
  cleanCookingTools?: boolean;
  /** COAP: can support Starlink offering */
  starlinkReady?: boolean;
}

/** COAP programme service lines */
export type ServiceLine =
  | "irembo"
  | "bk"
  | "internet"
  | "device_financing"
  | "insurance"
  | "clean_cooking";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "converted"
  | "lost";

export type LeadEntityType = "person" | "household" | "business";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  entityType: LeadEntityType;
  serviceLine: ServiceLine;
  status: LeadStatus;
  geo: Pick<GeoLocation, "province" | "district" | "sector">;
  tcUserId: string;
  notes?: string;
  interestSummary?: string;
  createdAt: string;
  updatedAt: string;
  convertedAt?: string;
}

export type FieldActivityType =
  | "education"
  | "demo"
  | "mobilization"
  | "support"
  | "campaign";

export interface FieldActivity {
  id: string;
  tcUserId: string;
  serviceLine: ServiceLine;
  activityType: FieldActivityType;
  date: string;
  geo: Pick<GeoLocation, "province" | "district" | "sector">;
  venue: string;
  peopleReached: number;
  summary: string;
  outcome: string;
  leadId?: string;
  agentId?: string;
  createdAt: string;
}

export type OnboardingKind =
  | "customer"
  | "irembo_agent"
  | "insurance_agent"
  | "bk_account"
  | "internet_activation"
  | "device_registration"
  | "cooker_purchase";

export type OnboardingStatus =
  | "not_started"
  | "in_progress"
  | "pending_partner"
  | "completed"
  | "cancelled";

export interface OnboardingCase {
  id: string;
  tcUserId: string;
  serviceLine: ServiceLine;
  kind: OnboardingKind;
  status: OnboardingStatus;
  customerName: string;
  customerPhone: string;
  leadId?: string;
  agentId?: string;
  geo: Pick<GeoLocation, "province" | "district" | "sector">;
  stageLabel: string;
  notes?: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type SaleProductCategory =
  | "internet_4g"
  | "internet_starlink"
  | "smartphone"
  | "induction_cooker"
  | "insurance_policy"
  | "other";

export interface SaleRecord {
  id: string;
  tcUserId: string;
  serviceLine: ServiceLine;
  productCategory: SaleProductCategory;
  productName: string;
  quantity: number;
  amountRwf: number;
  customerName: string;
  customerPhone: string;
  leadId?: string;
  onboardingId?: string;
  /** Device financing */
  depositRwf?: number;
  installmentMonths?: number;
  geo: Pick<GeoLocation, "province" | "district" | "sector">;
  soldAt: string;
  notes?: string;
}

export type FeedbackKind = "need" | "challenge" | "opportunity";
export type FeedbackSeverity = "low" | "medium" | "high";
export type FeedbackStatus = "open" | "acknowledged" | "resolved";

export interface CommunityFeedback {
  id: string;
  tcUserId: string;
  serviceLine?: ServiceLine;
  kind: FeedbackKind;
  severity: FeedbackSeverity;
  status: FeedbackStatus;
  title: string;
  description: string;
  geo: Pick<GeoLocation, "province" | "district" | "sector">;
  leadId?: string;
  createdAt: string;
  updatedAt: string;
  resolutionNotes?: string;
}

export interface Agent {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  nidMasked: string;
  nidVerified: boolean;
  status: AgentStatus;
  geo: GeoLocation;
  registeredLocation: Coordinates;
  tcUserId: string;
  services: AgentServices;
  lastVisitAt?: string;
  compliance: ComplianceTone;
  clientsRegistered: number;
  recruitedThisMonth: boolean;
  reactivatedThisMonth: boolean;
  createdAt: string;
}

export interface Visit {
  id: string;
  agentId: string;
  tcUserId: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  purpose: VisitPurpose;
  activities: string;
  outcome: string;
  location: Coordinates;
  distanceFromRegisteredMeters: number;
  validation: VisitValidation;
  confirmationStatus: SmsConfirmationStatus;
  photoCount: number;
  challenges?: string;
  supportNeeded?: string;
  flaggedReason?: string;
  /** Snapshot of readiness checklist at visit time */
  checklist?: AgentServices;
  photos?: Array<{
    id: string;
    name: string;
    contentType?: string;
    sizeBytes?: number;
    /** Short-lived signed URL; absent when the file is missing from storage. */
    url?: string;
  }>;
  deviceInfo?: string;
  /** COAP service lines touched during the visit */
  serviceLines?: ServiceLine[];
}

export interface SensitizationEvent {
  id: string;
  tcUserId: string;
  date: string;
  geo: Pick<GeoLocation, "province" | "district" | "sector">;
  venue: string;
  eventType: string;
  peopleReached: number;
  approach: string;
  outcome: string;
}

export interface TrainingSession {
  id: string;
  tcUserId: string;
  date: string;
  geo: Pick<GeoLocation, "province" | "district" | "sector">;
  topic: string;
  format: string;
  agentsTrained: number;
  approach: string;
  outcome: string;
  attendeeAgentIds: string[];
}

export interface Meeting {
  id: string;
  tcUserId: string;
  date: string;
  location: string;
  meetingType: "Agent Meeting" | "Partner / Authority" | "Head Office";
  participantCount: number;
  agenda: string;
  decisions: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  sourceType: "visit" | "sensitization" | "training" | "meeting" | "report";
  sourceId: string;
  ownerUserId: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  status: "open" | "in_progress" | "done";
  territoryId?: string;
  completionDate?: string;
  resolutionNotes?: string;
}

export interface MonthlyReportNarrative {
  g1: string;
  g2: string;
  g3: string;
  g4: string;
  g5: string;
  g6: string;
  g7: string;
}

export interface MonthlyReportAgentSnapshot {
  agentId: string;
  code: string;
  name: string;
  district: string;
  sector: string;
  status: AgentStatus;
  compliance: ComplianceTone;
  lastVisitAt?: string;
  recruitedThisMonth: boolean;
  reactivatedThisMonth: boolean;
}

export interface MonthlyReportHistoryEvent {
  id: string;
  at: string;
  byUserId: string;
  action: "save_draft" | "submit" | "request_changes" | "resubmit" | "review";
  notes?: string;
  status: ReportStatus;
}

export interface MonthlyReport {
  id: string;
  tcUserId: string;
  period: string;
  status: ReportStatus;
  deadline: string;
  submittedAt?: string;
  territorySnapshot: string[];
  kpiActuals: Record<string, number>;
  narrative: MonthlyReportNarrative;
  agentMappingSnapshot: MonthlyReportAgentSnapshot[];
  reviewNotes?: string;
  history: MonthlyReportHistoryEvent[];
}

export type ScorecardStatus = "draft" | "submitted";

export type ScorecardDecision =
  | "Outstanding"
  | "Meets expectations"
  | "Needs improvement"
  | "Unsatisfactory";

export interface ScorecardCriterionDef {
  id: string;
  label: string;
  weight: number;
}

export interface ScorecardCriterionScore {
  criterionId: string;
  score: number;
  comment: string;
}

export interface Scorecard {
  id: string;
  monthlyReportId: string;
  tcUserId: string;
  period: string;
  status: ScorecardStatus;
  templateVersion: string;
  criteria: ScorecardCriterionScore[];
  overallComment: string;
  decision?: ScorecardDecision;
  weightedTotal: number;
  evaluatorUserId?: string;
  submittedAt?: string;
  updatedAt: string;
}


export interface FraudReviewEvent {
  id: string;
  at: string;
  byUserId: string;
  action: "accept" | "escalate" | "dismiss" | "note";
  notes?: string;
}

export interface FraudFlag {
  id: string;
  visitId: string;
  type: string;
  severity: "low" | "medium" | "high";
  status: "open" | "escalated" | "resolved" | "dismissed";
  detectedAt: string;
  notes?: string;
  assignedReviewerId?: string;
  resolution?: string;
  reviewedAt?: string;
  reviewedByUserId?: string;
  reviewHistory?: FraudReviewEvent[];
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  action: string;
  objectType: string;
  objectId: string;
  timestamp: string;
  summary: string;
}

export interface SystemSettings {
  gpsDistanceMeters: number;
  agentGreenDays: number;
  agentYellowDays: number;
  tcComplianceGreen: number;
  tcComplianceYellow: number;
  monthlyReportDueDay: number;
  kpiTargets: Record<string, number>;
}

export interface SessionUser {
  userId: string;
  role: AppRole;
  name: string;
  email: string;
  phone: string;
  roleLabel: string;
  territoryIds: string[];
  agentId?: string;
  avatarInitials: string;
  loggedInAt: string;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}
