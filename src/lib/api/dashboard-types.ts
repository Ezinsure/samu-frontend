import type { Agent, ComplianceTone, SessionUser } from "@/types";

export interface DashboardFilters {
  dateFrom?: string;
  dateTo?: string;
  province?: string;
  district?: string;
  tcUserId?: string;
}

export interface DashboardAnalytics {
  summary: {
    totalAgents: number;
    activeAgents: number;
    overdueAgents: number;
    dueSoonAgents: number;
    compliantAgents: number;
    visitedThisMonth: number;
    visitsInRange: number;
    confirmationRate: number;
    openFraudFlags: number;
    openActionItems: number;
    compliancePercent: number;
    agentsWithoutTelecom: number;
    agentsWithoutInternet: number;
    agentsWithoutInsurance: number;
  };
  complianceDistribution: Array<{
    key: ComplianceTone;
    label: string;
    value: number;
    fill: string;
  }>;
  visitsByTc: Array<{ name: string; visits: number }>;
  visitsByDistrict: Array<{ name: string; visits: number }>;
  monthlyTrend: Array<{ month: string; visits: number; uniqueAgents: number }>;
  serviceGaps: Array<{ name: string; count: number }>;
  overdueAgents: Array<{
    id: string;
    name: string;
    code: string;
    district: string;
    lastVisitAt?: string;
    daysOverdue: number;
    tcUserId: string;
    tcName: string;
  }>;
  leaderboard: Array<{
    tcUserId: string;
    name: string;
    compliancePercent: number;
    visits: number;
    agents: number;
  }>;
  filterOptions: {
    provinces: string[];
    districts: string[];
    coordinators: Array<{ id: string; name: string }>;
  };
}

export function defaultDashboardFilters(): DashboardFilters {
  return {
    dateFrom: "2026-03-01",
    dateTo: "2026-09-21",
  };
}

export function daysSince(dateIso?: string, now = new Date("2026-09-21")) {
  if (!dateIso) return 999;
  const then = new Date(dateIso);
  return Math.max(
    0,
    Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

export function filterAgents(
  agents: Agent[],
  filters: DashboardFilters,
  viewer?: SessionUser | null,
) {
  let items = [...agents];

  if (viewer?.role === "TERRITORY_COORDINATOR") {
    items = items.filter((agent) => agent.tcUserId === viewer.userId);
  } else if (filters.tcUserId) {
    items = items.filter((agent) => agent.tcUserId === filters.tcUserId);
  }

  if (filters.province) {
    items = items.filter((agent) => agent.geo.province === filters.province);
  }
  if (filters.district) {
    items = items.filter((agent) => agent.geo.district === filters.district);
  }

  return items;
}
