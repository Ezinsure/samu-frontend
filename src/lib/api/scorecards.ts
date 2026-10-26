import { apiRequest } from "@/lib/http/client";
import { apiRequestList } from "@/lib/http/list";
import {
  apiRequestOrNull,
  runMutation,
  type MutationResult,
} from "@/lib/http/mutation";
import type {
  ListQuery,
  Paginated,
  ReportStatus,
  Scorecard,
  ScorecardCriterionDef,
  ScorecardCriterionScore,
  ScorecardDecision,
  SessionUser,
} from "@/types";

const BASE = "/scorecards";

export interface ScorecardQuery extends ListQuery {
  search?: string;
  status?: Scorecard["status"];
  /** `YYYY-MM` */
  period?: string;
  tcUserId?: string;
}

export interface ScorecardListItem extends Scorecard {
  tcName?: string;
  evaluatorName?: string;
  suggestedDecision: ScorecardDecision;
}

export interface ScorecardWorkspace {
  scorecard: ScorecardListItem;
  criteriaDefs: ScorecardCriterionDef[];
  /** Slim link to the evaluated report (KPIs come from the report endpoint). */
  report: {
    id: string;
    period: string;
    status: ReportStatus;
    tcUserId: string;
  };
  canEdit: boolean;
}

export interface ScorecardDraftInput {
  criteria: ScorecardCriterionScore[];
  overallComment: string;
  decision?: ScorecardDecision;
}

/** UI hints only — the API enforces the real permissions. */
export function canEvaluateScorecards(viewer?: SessionUser | null) {
  return viewer?.role === "ADMIN" || viewer?.role === "OPERATIONS_MANAGER";
}

export function canViewScorecards(viewer?: SessionUser | null) {
  return Boolean(viewer && viewer.role !== "AGENT");
}

export function getScorecards(
  query: ScorecardQuery = {},
): Promise<Paginated<ScorecardListItem>> {
  return apiRequestList<ScorecardListItem>(BASE, { query: { ...query } });
}

/** Scorecard with criteria definitions; `null` if missing or not permitted. */
export function getScorecardWorkspace(
  id: string,
): Promise<ScorecardWorkspace | null> {
  return apiRequestOrNull<ScorecardWorkspace>(`${BASE}/${encodeURIComponent(id)}`);
}

export function saveScorecardDraft(
  id: string,
  input: ScorecardDraftInput,
): Promise<MutationResult<ScorecardListItem>> {
  return runMutation(async () => {
    const data = await apiRequest<{ scorecard: ScorecardListItem }>(
      `${BASE}/${encodeURIComponent(id)}`,
      { method: "PATCH", body: input },
    );
    return data.scorecard;
  });
}

/** Locks the scorecard and marks the monthly report as evaluated. */
export function submitScorecard(
  id: string,
): Promise<MutationResult<ScorecardListItem>> {
  return runMutation(async () => {
    const data = await apiRequest<{ scorecard: ScorecardListItem }>(
      `${BASE}/${encodeURIComponent(id)}/submit`,
      { method: "POST" },
    );
    return data.scorecard;
  });
}

/** Returns the draft scorecard for a submitted report, creating it if needed. */
export function ensureScorecardForReport(
  monthlyReportId: string,
): Promise<MutationResult<{ id: string }>> {
  return runMutation(() =>
    apiRequest<{ id: string }>(`${BASE}/ensure`, {
      method: "POST",
      body: { monthlyReportId },
    }),
  );
}
