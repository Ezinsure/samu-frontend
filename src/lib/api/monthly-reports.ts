import { apiRequest } from "@/lib/http/client";
import { apiRequestList } from "@/lib/http/list";
import {
  apiRequestOrNull,
  runMutation,
  type MutationResult,
} from "@/lib/http/mutation";
import type {
  ListQuery,
  MonthlyReport,
  MonthlyReportNarrative,
  Paginated,
  ReportStatus,
  SessionUser,
} from "@/types";

const BASE = "/monthly-reports";

export interface MonthlyReportQuery extends ListQuery {
  search?: string;
  status?: ReportStatus;
  /** `YYYY-MM` */
  period?: string;
  tcUserId?: string;
}

export interface MonthlyReportListItem extends MonthlyReport {
  tcName?: string;
  daysToDeadline: number;
  overdue: boolean;
  kpiProgressPercent: number;
}

export interface MonthlyReportFilterOptions {
  periods: string[];
  statuses: ReportStatus[];
  coordinators: Array<{ id: string; name: string }>;
  targets: Record<string, number>;
}

export interface MonthlyReportWorkspace {
  report: MonthlyReportListItem;
  targets: Record<string, number>;
  linkedActivities: {
    visits: number;
    sensitizations: Array<{ id: string; date: string; venue: string; peopleReached: number }>;
    trainings: Array<{ id: string; date: string; topic: string; agentsTrained: number }>;
    meetings: Array<{ id: string; date: string; meetingType: string; location: string }>;
    actionItems: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      dueDate: string;
    }>;
  };
  canEdit: boolean;
  canRequestChanges: boolean;
  historyEnriched: Array<{
    id: string;
    at: string;
    byName: string;
    action: string;
    notes?: string;
    status: ReportStatus;
  }>;
}

export interface MonthlyReportDraftInput {
  narrative: MonthlyReportNarrative;
  kpiActuals?: Record<string, number>;
}

/** UI hints only — the API enforces the real permissions. */
export function canReviewReport(viewer?: SessionUser | null) {
  return viewer?.role === "ADMIN" || viewer?.role === "OPERATIONS_MANAGER";
}

/** Reports can be started by TCs (for themselves) and Admin / Ops (for a TC). */
export function canCreateReport(viewer?: SessionUser | null) {
  return (
    viewer?.role === "TERRITORY_COORDINATOR" || canReviewReport(viewer)
  );
}

/** Periods, statuses, coordinators and KPI targets for the filter bar. */
export function getReportFilterOptions(): Promise<MonthlyReportFilterOptions> {
  return apiRequest(`${BASE}/filters`);
}

export function getMonthlyReports(
  query: MonthlyReportQuery = {},
): Promise<Paginated<MonthlyReportListItem>> {
  return apiRequestList<MonthlyReportListItem>(BASE, { query: { ...query } });
}

/** Report with KPIs, linked activity and history; `null` if missing or not permitted. */
export function getMonthlyReportWorkspace(
  id: string,
): Promise<MonthlyReportWorkspace | null> {
  return apiRequestOrNull<MonthlyReportWorkspace>(
    `${BASE}/${encodeURIComponent(id)}`,
  );
}

/**
 * Starts a report for a period. Idempotent: the API returns the existing
 * report if one is already there. Admin / Ops must pass `tcUserId`.
 */
export function createMonthlyReport(input: {
  period: string;
  tcUserId?: string;
}): Promise<MutationResult<MonthlyReportListItem>> {
  return runMutation(async () => {
    const data = await apiRequest<{ report: MonthlyReportListItem }>(BASE, {
      method: "POST",
      body: input,
    });
    return data.report;
  });
}

export function saveMonthlyReportDraft(
  id: string,
  input: MonthlyReportDraftInput,
): Promise<MutationResult<MonthlyReportListItem>> {
  return runMutation(async () => {
    const data = await apiRequest<{ report: MonthlyReportListItem }>(
      `${BASE}/${encodeURIComponent(id)}`,
      { method: "PATCH", body: input },
    );
    return data.report;
  });
}

/** Recomputes KPI actuals from visits and COAP records. */
export function refreshReportKpis(
  id: string,
): Promise<MutationResult<MonthlyReportListItem>> {
  return postReportAction(id, "refresh-kpis");
}

/** Submit (or resubmit after changes were requested). All G1–G7 are required. */
export function submitMonthlyReport(
  id: string,
): Promise<MutationResult<MonthlyReportListItem>> {
  return postReportAction(id, "submit");
}

export function requestReportChanges(
  id: string,
  notes: string,
): Promise<MutationResult<MonthlyReportListItem>> {
  return postReportAction(id, "request-changes", { notes: notes.trim() });
}

function postReportAction(
  id: string,
  action: "refresh-kpis" | "submit" | "request-changes",
  body?: object,
): Promise<MutationResult<MonthlyReportListItem>> {
  return runMutation(async () => {
    const data = await apiRequest<{ report: MonthlyReportListItem }>(
      `${BASE}/${encodeURIComponent(id)}/${action}`,
      { method: "POST", body },
    );
    return data.report;
  });
}
