import { apiRequest } from "@/lib/http/client";
import { runMutation } from "@/lib/http/mutation";
import type { SessionUser } from "@/types";

export type CoaEvidenceType = "client_rows" | "file_upload" | "auto_irembo";

export interface CoaMetric {
  id: string;
  key: string;
  label: string;
  description?: string;
  adminNote?: string;
  monthlyTarget: number;
  evidenceType: CoaEvidenceType | string;
  enabled: boolean;
  sortOrder: number;
  updatedAt: string;
}

export type UpdateCoaMetricInput = {
  label?: string;
  description?: string | null;
  adminNote?: string | null;
  monthlyTarget?: number;
  enabled?: boolean;
  sortOrder?: number;
};

export function canManageCoaMetrics(viewer?: SessionUser | null) {
  return viewer?.role === "ADMIN";
}

export function getCoaMetrics(opts?: {
  includeDisabled?: boolean;
}): Promise<CoaMetric[]> {
  return apiRequest<CoaMetric[]>("/coa-metrics", {
    query: {
      includeDisabled: opts?.includeDisabled ? "true" : undefined,
    },
  });
}

export function updateCoaMetric(key: string, input: UpdateCoaMetricInput) {
  return runMutation(() =>
    apiRequest<CoaMetric>(`/coa-metrics/${encodeURIComponent(key)}`, {
      method: "PATCH",
      body: input,
    }),
  );
}

export function evidenceTypeLabel(type: string): string {
  if (type === "client_rows") return "Client rows";
  if (type === "file_upload") return "File upload";
  if (type === "auto_irembo") return "Auto (Irembo applicants)";
  return type;
}
