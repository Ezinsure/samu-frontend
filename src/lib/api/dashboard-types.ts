import type { ComplianceTone } from "@/types";

/** Query filters shared by the analytics dashboard (dates are `YYYY-MM-DD`). */
export interface DashboardFilters {
  dateFrom?: string;
  dateTo?: string;
  province?: string;
  district?: string;
  tcUserId?: string;
}

/** Response of `GET /insights/dashboard` (also the base of the analytics workspace). */
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
    /** Always 0 until action items are persisted by the API. */
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
  /** `month` is the two-digit month (`"09"`) of the visit date. */
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

/** No date limits: the dashboard starts on all recorded activity. */
export function defaultDashboardFilters(): DashboardFilters {
  return {};
}
