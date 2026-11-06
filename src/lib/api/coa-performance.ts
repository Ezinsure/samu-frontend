import { apiRequest } from "@/lib/http/client";
import { runMutation } from "@/lib/http/mutation";
import type { CoaMetric } from "@/lib/api/coa-metrics";

export interface CoaProgressRow {
  metric: CoaMetric;
  actual: number;
  target: number;
  remaining: number;
  percent: number;
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
  metricKey?: string;
}): Promise<CoaPerformanceEntry[]> {
  return apiRequest<CoaPerformanceEntry[]>("/coa-performance/entries", {
    query: {
      month: opts?.month,
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
