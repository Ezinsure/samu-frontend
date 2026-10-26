import { apiRequest } from "@/lib/http/client";
import { apiRequestList } from "@/lib/http/list";
import { apiRequestOrNull, runMutation, type MutationResult } from "@/lib/http/mutation";
import type {
  FraudFlag,
  FraudReviewEvent,
  ListQuery,
  Paginated,
  SessionUser,
  Visit,
  VisitValidation,
} from "@/types";

export type FraudReviewAction = "accept" | "escalate" | "dismiss";

export interface FraudQuery extends ListQuery {
  status?: FraudFlag["status"];
  severity?: FraudFlag["severity"];
  type?: string;
}

export interface FraudListItem extends FraudFlag {
  agentId: string;
  agentName: string;
  agentCode: string;
  tcName: string;
  tcUserId: string;
  visitPurpose: string;
  visitStartedAt: string;
  visitValidation: VisitValidation;
  distanceFromRegisteredMeters: number;
  photoCount: number;
}

export interface FraudDetail extends FraudListItem {
  /** Visit summary (photos are loaded separately from `/visits/:id`). */
  visit: Visit;
  reviewerName?: string;
  assignedReviewerName?: string;
  reviewHistoryEnriched: Array<FraudReviewEvent & { byName: string }>;
}

export interface FraudFilterOptions {
  types: string[];
  statuses: FraudFlag["status"][];
  severities: FraudFlag["severity"][];
}

/** UI hints only — the API enforces the real permissions. */
export function canReviewFraud(viewer?: SessionUser | null) {
  return viewer?.role === "ADMIN" || viewer?.role === "OPERATIONS_MANAGER";
}

export function canViewFraud(viewer?: SessionUser | null) {
  return canReviewFraud(viewer) || viewer?.role === "MD_VIEWER";
}

export function fraudStatusTone(status: FraudFlag["status"]) {
  if (status === "open") return "warning" as const;
  if (status === "escalated") return "danger" as const;
  if (status === "resolved") return "success" as const;
  return "neutral" as const;
}

export function fraudStatusLabel(status: FraudFlag["status"]) {
  if (status === "open") return "Open";
  if (status === "escalated") return "Escalated";
  if (status === "resolved") return "Resolved";
  return "Dismissed";
}

export function severityTone(severity: FraudFlag["severity"]) {
  if (severity === "high") return "danger" as const;
  if (severity === "medium") return "warning" as const;
  return "info" as const;
}

/** Flag types, statuses and severities for filter dropdowns. */
export function getFraudFilterOptions(): Promise<FraudFilterOptions> {
  return apiRequest("/fraud/filters");
}

/** Paginated flags, open first, then escalated, then closed. */
export function getFraudFlags(
  query: FraudQuery = {},
): Promise<Paginated<FraudListItem>> {
  return apiRequestList<FraudListItem>("/fraud", { query: { ...query } });
}

/** Flag with linked visit and review history; `null` if missing or not permitted. */
export function getFraudDetail(id: string): Promise<FraudDetail | null> {
  return apiRequestOrNull<FraudDetail>(`/fraud/${encodeURIComponent(id)}`);
}

/**
 * Accept / escalate / dismiss a flag. Notes are required. The API rejects
 * reviews of your own visits and of already-closed flags.
 */
export function reviewFraudFlag(
  flagId: string,
  action: FraudReviewAction,
  notes: string,
): Promise<MutationResult<FraudListItem>> {
  return runMutation(async () => {
    const data = await apiRequest<{ flag: FraudListItem }>(
      `/fraud/${encodeURIComponent(flagId)}/review`,
      { method: "POST", body: { action, notes: notes.trim() } },
    );
    return data.flag;
  });
}
