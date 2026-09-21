import { delay } from "@/lib/api/helpers";
import {
  defaultDashboardFilters,
  getDashboardAnalytics,
  type DashboardAnalytics,
  type DashboardFilters,
} from "@/lib/api/dashboard";
import { filterAgents } from "@/lib/api/dashboard-types";
import { readDemoStore } from "@/lib/store/demo-store";
import type { SessionUser, SmsConfirmationStatus } from "@/types";

export interface AnalyticsWorkspace extends DashboardAnalytics {
  confirmationBreakdown: Array<{
    key: SmsConfirmationStatus;
    label: string;
    value: number;
    fill: string;
  }>;
  confirmationTrend: Array<{
    month: string;
    rate: number;
    confirmed: number;
    total: number;
  }>;
}

const CONFIRMATION_COLORS: Record<SmsConfirmationStatus, string> = {
  confirmed: "#16A34A",
  pending: "#D97706",
  disputed: "#DC2626",
  expired: "#94A3B8",
  delivery_failed: "#64748B",
};

const CONFIRMATION_LABELS: Record<SmsConfirmationStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  disputed: "Disputed",
  expired: "Expired",
  delivery_failed: "Delivery failed",
};

export async function getAnalyticsWorkspace(
  viewer?: SessionUser | null,
  filters: DashboardFilters = defaultDashboardFilters(),
): Promise<AnalyticsWorkspace> {
  const base = await getDashboardAnalytics(viewer, filters);
  const store = readDemoStore();
  const scopedAgents = filterAgents(store.agents, filters, viewer);
  const agentIds = new Set(scopedAgents.map((agent) => agent.id));

  const scopedVisits = store.visits.filter((visit) => {
    if (!agentIds.has(visit.agentId)) return false;
    if (viewer?.role === "TERRITORY_COORDINATOR" && visit.tcUserId !== viewer.userId) {
      return false;
    }
    if (filters.tcUserId && visit.tcUserId !== filters.tcUserId) return false;
    const day = visit.startedAt.slice(0, 10);
    if (filters.dateFrom && day < filters.dateFrom) return false;
    if (filters.dateTo && day > filters.dateTo) return false;
    return true;
  });

  const counts = new Map<SmsConfirmationStatus, number>();
  for (const visit of scopedVisits) {
    counts.set(
      visit.confirmationStatus,
      (counts.get(visit.confirmationStatus) ?? 0) + 1,
    );
  }

  const confirmationBreakdown = (
    Object.keys(CONFIRMATION_LABELS) as SmsConfirmationStatus[]
  )
    .map((key) => ({
      key,
      label: CONFIRMATION_LABELS[key],
      value: counts.get(key) ?? 0,
      fill: CONFIRMATION_COLORS[key],
    }))
    .filter((row) => row.value > 0);

  const byMonth = new Map<string, { confirmed: number; total: number }>();
  for (const visit of scopedVisits) {
    const month = visit.startedAt.slice(0, 7);
    const entry = byMonth.get(month) ?? { confirmed: 0, total: 0 };
    entry.total += 1;
    if (visit.confirmationStatus === "confirmed") entry.confirmed += 1;
    byMonth.set(month, entry);
  }

  const confirmationTrend = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, stats]) => ({
      month: month.replace("2026-", ""),
      confirmed: stats.confirmed,
      total: stats.total,
      rate: Math.round((stats.confirmed / Math.max(stats.total, 1)) * 100),
    }));

  return delay({
    ...base,
    confirmationBreakdown,
    confirmationTrend,
  });
}

export { defaultDashboardFilters };
export type { DashboardFilters };
