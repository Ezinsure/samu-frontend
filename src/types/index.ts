/** Shared domain types for SAMU UI demo. */

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
  | "Problem Solving";

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
    dataUrl?: string;
  }>;
  deviceInfo?: string;
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

export interface MonthlyReport {
  id: string;
  tcUserId: string;
  period: string;
  status: ReportStatus;
  deadline: string;
  submittedAt?: string;
  territorySnapshot: string[];
  kpiActuals: Record<string, number>;
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
