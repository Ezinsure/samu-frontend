import { API_BASE_URL, apiRequest } from "@/lib/http/client";
import { runMutation } from "@/lib/http/mutation";
import type { CoaMetric } from "@/lib/api/coa-metrics";
import type { DocumentViewerSource } from "@/components/shared/document-viewer";

export interface CoaProgressRow {
  metric: CoaMetric;
  actual: number;
  target: number;
  remaining: number;
  percent: number;
  met: boolean;
}

export interface CoaProgress {
  month: string;
  rows: CoaProgressRow[];
}

export interface CoaEvidenceClient {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  nidNumber?: string;
  accountRef?: string;
  simNumber?: string;
  createdAt: string;
}

export interface CoaPerformanceEntry {
  id: string;
  metricId: string;
  metricKey?: string;
  metricLabel?: string;
  evidenceType?: string;
  month: string;
  notes?: string;
  loggedAt: string;
  createdAt: string;
  clients: CoaEvidenceClient[];
  files: Array<{
    id: string;
    originalName: string;
    contentType: string;
    sizeBytes: number;
    createdAt: string;
  }>;
  clientCount: number;
  fileCount: number;
}

export type ClientRowInput = {
  fullName: string;
  phone?: string;
  email?: string;
  nidNumber?: string;
  accountRef?: string;
  simNumber?: string;
};

export function getMyCoaProgress(month?: string): Promise<CoaProgress> {
  return apiRequest<CoaProgress>("/coa-performance/me", {
    query: { month },
  });
}

export function listCoaEntries(opts?: {
  month?: string;
  monthFrom?: string;
  monthTo?: string;
  metricKey?: string;
}): Promise<CoaPerformanceEntry[]> {
  return apiRequest<CoaPerformanceEntry[]>("/coa-performance/entries", {
    query: {
      month: opts?.month,
      monthFrom: opts?.monthFrom,
      monthTo: opts?.monthTo,
      metricKey: opts?.metricKey,
    },
  });
}

export function createCoaEntry(input: {
  metricKey: string;
  month: string;
  notes?: string;
  clients?: ClientRowInput[];
}) {
  return runMutation(() =>
    apiRequest<CoaPerformanceEntry>("/coa-performance/entries", {
      method: "POST",
      body: input,
    }),
  );
}

export function deleteCoaEntry(id: string) {
  return runMutation(() =>
    apiRequest<{ deleted: boolean }>(
      `/coa-performance/entries/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),
  );
}

export function deleteCoaClient(id: string) {
  return runMutation(() =>
    apiRequest<{ deleted: boolean }>(
      `/coa-performance/clients/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),
  );
}

export function uploadCoaEvidenceFile(input: {
  metricKey: string;
  month: string;
  notes?: string;
  file: File;
}) {
  const body = new FormData();
  body.append("file", input.file);
  body.append("metricKey", input.metricKey);
  body.append("month", input.month);
  if (input.notes) body.append("notes", input.notes);
  return runMutation(() =>
    apiRequest<CoaPerformanceEntry>("/coa-performance/evidence-files", {
      method: "POST",
      body,
    }),
  );
}

export async function getCoaEvidenceFileUrl(
  fileId: string,
): Promise<DocumentViewerSource> {
  const data = await apiRequest<{
    id: string;
    url: string;
    originalName: string;
    contentType: string;
    sizeBytes: number;
  }>(`/coa-performance/files/${encodeURIComponent(fileId)}/url`);
  return {
    url: data.url,
    originalName: data.originalName,
    contentType: data.contentType,
  };
}

export function deleteCoaEvidenceFile(id: string) {
  return runMutation(() =>
    apiRequest<{ deleted: boolean }>(
      `/coa-performance/files/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),
  );
}

export interface AdminCoaReportRow {
  coa: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    workingDistrict?: string;
  };
  progress: CoaProgressRow[];
  metricsMet: number;
  metricsTotal: number;
  overallPercent: number;
}

export interface AdminCoaMonthReport {
  month: string;
  metrics: CoaMetric[];
  rows: AdminCoaReportRow[];
  totals: { coaCount: number; averageOverallPercent: number };
}

export interface AdminCoaDetail {
  month: string;
  coa: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    workingDistrict?: string;
    workingProvince?: string;
  };
  progress: CoaProgressRow[];
  entries: CoaPerformanceEntry[];
}

export function getAdminCoaMonthReport(
  month?: string,
): Promise<AdminCoaMonthReport> {
  return apiRequest<AdminCoaMonthReport>("/coa-performance/admin/report", {
    query: { month },
  });
}

export function getAdminCoaDetail(
  coaUserId: string,
  month?: string,
): Promise<AdminCoaDetail> {
  return apiRequest<AdminCoaDetail>(
    `/coa-performance/admin/coas/${encodeURIComponent(coaUserId)}`,
    { query: { month } },
  );
}

export async function downloadAdminCoaReportCsv(month: string): Promise<void> {
  const url = new URL(
    `${API_BASE_URL}/api/v1/coa-performance/admin/report.csv`,
  );
  url.searchParams.set("month", month);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `coa-performance-${month}.csv`;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

/** Required client fields by metric key (mirrors backend). */
export const CLIENT_FIELD_REQUIREMENTS: Record<
  string,
  Array<keyof ClientRowInput>
> = {
  bk_accounts: ["phone", "email", "accountRef"],
  ezinsure_agents_applied: ["phone", "email"],
  internet_subscriptions: ["phone", "nidNumber", "simNumber"],
  internet_agents_applied: ["phone", "nidNumber"],
};
