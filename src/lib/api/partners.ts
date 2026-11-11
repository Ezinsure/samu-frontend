import type { StatusTone } from "@/components/shared/status-badge";
import { API_BASE_URL, apiRequest } from "@/lib/http/client";
import { runMutation } from "@/lib/http/mutation";

export type PartnerVerificationStatus =
  | "unverified"
  | "verified"
  | "not_found"
  | "error";

export interface PartnerApplicant {
  id: string;
  partnerKey: string;
  fullName: string;
  phone?: string;
  email?: string;
  nidNumber?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  month: string;
  loggedByUserId: string;
  entryId?: string;
  clientRowId?: string;
  verificationStatus: PartnerVerificationStatus;
  externalRef?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  loggedBy?: { id: string; name: string; email: string };
}

export interface PartnerApplicantsList {
  total: number;
  limit: number;
  offset: number;
  rows: PartnerApplicant[];
}

export interface PartnerApplicantsSummary {
  month: string;
  partnerKey: string;
  rows: Array<{
    coa: {
      id: string;
      name: string;
      email: string;
      workingDistrict?: string;
    };
    logged: number;
    verified: number;
    notFound: number;
    error: number;
    unverified: number;
  }>;
  totals: {
    logged: number;
    verified: number;
    notFound: number;
    error: number;
    unverified: number;
  };
}

export function listPartnerApplicants(opts?: {
  partnerKey?: string;
  month?: string;
  coaUserId?: string;
  verificationStatus?: PartnerVerificationStatus;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<PartnerApplicantsList> {
  return apiRequest<PartnerApplicantsList>("/partners/applicants", {
    query: {
      partnerKey: opts?.partnerKey ?? "ezinsure",
      month: opts?.month,
      coaUserId: opts?.coaUserId,
      verificationStatus: opts?.verificationStatus,
      q: opts?.q,
      limit: opts?.limit,
      offset: opts?.offset,
    },
  });
}

export function getPartnerApplicantsSummary(opts?: {
  partnerKey?: string;
  month?: string;
}): Promise<PartnerApplicantsSummary> {
  return apiRequest<PartnerApplicantsSummary>("/partners/applicants/summary", {
    query: {
      partnerKey: opts?.partnerKey ?? "ezinsure",
      month: opts?.month,
    },
  });
}

export async function downloadPartnerApplicantsCsv(opts?: {
  partnerKey?: string;
  month?: string;
  coaUserId?: string;
  verificationStatus?: PartnerVerificationStatus;
  q?: string;
}): Promise<void> {
  const url = new URL(`${API_BASE_URL}/api/v1/partners/applicants/export.csv`);
  url.searchParams.set("partnerKey", opts?.partnerKey ?? "ezinsure");
  if (opts?.month) url.searchParams.set("month", opts.month);
  if (opts?.coaUserId) url.searchParams.set("coaUserId", opts.coaUserId);
  if (opts?.verificationStatus) {
    url.searchParams.set("verificationStatus", opts.verificationStatus);
  }
  if (opts?.q) url.searchParams.set("q", opts.q);

  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `${opts?.partnerKey ?? "ezinsure"}-applicants-${opts?.month ?? "all"}.csv`;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export type PartnerVerificationRunStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export type PartnerVerificationRunScope = "selected" | "unverified_all";

export interface PartnerVerificationRun {
  id: string;
  partnerKey: string;
  triggeredByUserId: string;
  scope: PartnerVerificationRunScope;
  status: PartnerVerificationRunStatus;
  applicantIds: string[];
  month?: string;
  totalCount: number;
  processedCount: number;
  verifiedCount: number;
  notFoundCount: number;
  errorCount: number;
  skippedCount: number;
  adapter: string;
  lastError?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
  percent: number;
  triggeredBy?: { id: string; name: string; email: string };
}

export interface PartnerVerifyContract {
  partner: string;
  adapter: string;
  mode: string;
  configuredUrl: string | null;
  method: string;
  pathHint: string;
  auth: string;
  docs: string;
  requestExample: Record<string, unknown>;
  responseExamples: Record<string, unknown>;
  mockRules: Record<string, string>;
}

export function startPartnerVerification(input: {
  partnerKey?: string;
  scope: PartnerVerificationRunScope;
  applicantIds?: string[];
  month?: string;
}) {
  return runMutation(() =>
    apiRequest<PartnerVerificationRun>("/partners/applicants/verify", {
      method: "POST",
      body: {
        partnerKey: input.partnerKey ?? "ezinsure",
        scope: input.scope,
        applicantIds: input.applicantIds,
        month: input.month,
      },
    }),
  );
}

export function getPartnerVerificationRun(
  runId: string,
): Promise<PartnerVerificationRun> {
  return apiRequest<PartnerVerificationRun>(
    `/partners/verification-runs/${encodeURIComponent(runId)}`,
  );
}

export function listPartnerVerificationRuns(opts?: {
  partnerKey?: string;
  limit?: number;
}): Promise<PartnerVerificationRun[]> {
  return apiRequest<PartnerVerificationRun[]>("/partners/verification-runs", {
    query: {
      partnerKey: opts?.partnerKey ?? "ezinsure",
      limit: opts?.limit,
    },
  });
}

export function getPartnerVerifyContract(): Promise<PartnerVerifyContract> {
  return apiRequest<PartnerVerifyContract>("/partners/ezinsure/verify-contract");
}

export function partnerVerificationLabel(
  status: PartnerVerificationStatus,
): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "not_found":
      return "Not found";
    case "error":
      return "Error";
    default:
      return "Unverified";
  }
}

export function partnerVerificationTone(
  status: PartnerVerificationStatus,
): StatusTone {
  switch (status) {
    case "verified":
      return "success";
    case "not_found":
      return "warning";
    case "error":
      return "danger";
    default:
      return "neutral";
  }
}

export function partnerRunStatusTone(
  status: PartnerVerificationRunStatus,
): StatusTone {
  switch (status) {
    case "completed":
      return "success";
    case "running":
    case "pending":
      return "info";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}
