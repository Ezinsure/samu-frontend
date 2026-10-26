import { apiRequest } from "@/lib/http/client";
import { apiRequestList } from "@/lib/http/list";
import {
  apiRequestOrNull,
  runMutation,
  stripBlankValues,
  type MutationResult,
} from "@/lib/http/mutation";
import type {
  Agent,
  AgentServices,
  Coordinates,
  ListQuery,
  Paginated,
  ServiceLine,
  SessionUser,
  SmsConfirmationStatus,
  Visit,
  VisitPurpose,
  VisitValidation,
} from "@/types";

export interface VisitQuery extends ListQuery {
  tcUserId?: string;
  agentId?: string;
  validation?: VisitValidation;
  confirmation?: SmsConfirmationStatus;
  purpose?: VisitPurpose;
}

export interface VisitListItem extends Visit {
  agentName: string;
  agentCode: string;
  agentDistrict: string;
  tcName: string;
}

export interface VisitDetail extends VisitListItem {
  agent: Agent;
  fraudFlags: Array<{
    id: string;
    type: string;
    severity: "low" | "medium" | "high";
    status: "open" | "escalated" | "resolved" | "dismissed";
    detectedAt: string;
    notes?: string;
  }>;
  gpsThresholdMeters: number;
}

export interface VisitFilterOptions {
  agents: Array<{ id: string; name: string; code: string }>;
  coordinators: Array<{ id: string; name: string }>;
  purposes: VisitPurpose[];
  validations: VisitValidation[];
  confirmations: SmsConfirmationStatus[];
  gpsThresholdMeters: number;
}

/** Storage reference returned by the photo upload endpoint. */
export interface UploadedVisitPhoto {
  storageKey: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface VisitCaptureInput {
  agentId: string;
  purpose: VisitPurpose;
  startedAt: string;
  endedAt: string;
  /** The API recomputes distance vs the agent's registered location. */
  location: Coordinates;
  activities: string;
  outcome: string;
  challenges?: string;
  supportNeeded?: string;
  checklist: AgentServices;
  photos: UploadedVisitPhoto[];
  deviceInfo?: string;
  serviceLines?: ServiceLine[];
}

/** UI hint only — the API enforces the real permission. */
export function canCaptureVisits(viewer?: SessionUser | null) {
  return viewer?.role === "TERRITORY_COORDINATOR" || viewer?.role === "ADMIN";
}

export function canViewAllVisits(viewer?: SessionUser | null) {
  return (
    viewer?.role === "ADMIN" ||
    viewer?.role === "OPERATIONS_MANAGER" ||
    viewer?.role === "MD_VIEWER"
  );
}

/** Agents, coordinators, enum values and the GPS threshold for visit UIs. */
export function getVisitFilterOptions(): Promise<VisitFilterOptions> {
  return apiRequest("/visits/filters");
}

/** Paginated visits; TC users only receive their own visits. */
export function getVisits(
  query: VisitQuery = {},
): Promise<Paginated<VisitListItem>> {
  return apiRequestList<VisitListItem>("/visits", { query: { ...query } });
}

/** Visit with agent snapshot, fraud flags and signed photo URLs; `null` if missing/out of scope. */
export function getVisitDetail(id: string): Promise<VisitDetail | null> {
  return apiRequestOrNull<VisitDetail>(`/visits/${encodeURIComponent(id)}`);
}

/** Uploads one evidence photo and returns the storage reference for `createVisit`. */
export function uploadVisitPhoto(
  file: File,
): Promise<MutationResult<UploadedVisitPhoto>> {
  const body = new FormData();
  body.append("photo", file);
  return runMutation(() =>
    apiRequest<UploadedVisitPhoto>("/visits/photos", { method: "POST", body }),
  );
}

/**
 * Submits a visit. `idempotencyKey` makes retries (double tap, flaky network)
 * return the original visit instead of creating a duplicate.
 */
export function createVisit(
  input: VisitCaptureInput,
  idempotencyKey: string,
): Promise<MutationResult<Visit>> {
  return runMutation(async () => {
    const data = await apiRequest<{ visit: Visit }>("/visits", {
      method: "POST",
      body: stripBlankValues(input),
      headers: { "Idempotency-Key": idempotencyKey },
    });
    return data.visit;
  });
}
