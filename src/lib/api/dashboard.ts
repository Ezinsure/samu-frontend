import { DEMO_USERS } from "@data/index";
import { delay } from "@/lib/api/helpers";
import { readDemoStore } from "@/lib/store/demo-store";
import type { SessionUser, Visit } from "@/types";
import {
  daysSince,
  defaultDashboardFilters,
  filterAgents,
  type DashboardAnalytics,
  type DashboardFilters,
} from "@/lib/api/dashboard-types";

export type {
  DashboardAnalytics,
  DashboardFilters,
} from "@/lib/api/dashboard-types";
export { defaultDashboardFilters } from "@/lib/api/dashboard-types";

const COMPLIANCE_COLORS = {
  green: "#16A34A",
  yellow: "#D97706",
  red: "#DC2626",
} as const;

/** Extra historical visit volume so trend charts look realistic in the demo. */
const HISTORICAL_TREND = [
  { month: "2026-03", visits: 38, uniqueAgents: 28 },
  { month: "2026-04", visits: 44, uniqueAgents: 31 },
  { month: "2026-05", visits: 41, uniqueAgents: 29 },
  { month: "2026-06", visits: 49, uniqueAgents: 34 },
  { month: "2026-07", visits: 53, uniqueAgents: 36 },
  { month: "2026-08", visits: 58, uniqueAgents: 39 },
];

function inDateRange(iso: string, filters: DashboardFilters) {
  const day = iso.slice(0, 10);
  if (filters.dateFrom && day < filters.dateFrom) return false;
  if (filters.dateTo && day > filters.dateTo) return false;
  return true;
}

function filterVisits(
  visits: Visit[],
  agentIds: Set<string>,
  filters: DashboardFilters,
  viewer?: SessionUser | null,
) {
  return visits.filter((visit) => {
    if (!agentIds.has(visit.agentId)) return false;
    if (viewer?.role === "TERRITORY_COORDINATOR" && visit.tcUserId !== viewer.userId) {
      return false;
    }
    if (filters.tcUserId && visit.tcUserId !== filters.tcUserId) return false;
    return inDateRange(visit.startedAt, filters);
  });
}

function tcName(userId: string) {
  return DEMO_USERS.find((user) => user.id === userId)?.name ?? userId;
}

export async function getDashboardAnalytics(
  viewer?: SessionUser | null,
  filters: DashboardFilters = defaultDashboardFilters(),
): Promise<DashboardAnalytics> {
  const store = readDemoStore();
  const scopedAgents = filterAgents(store.agents, filters, viewer);
  const agentIds = new Set(scopedAgents.map((agent) => agent.id));
  const scopedVisits = filterVisits(store.visits, agentIds, filters, viewer);

  const activeAgents = scopedAgents.filter((a) => a.status === "Active").length;
  const overdueAgents = scopedAgents.filter((a) => a.compliance === "red").length;
  const dueSoonAgents = scopedAgents.filter((a) => a.compliance === "yellow").length;
  const compliantAgents = scopedAgents.filter((a) => a.compliance === "green").length;

  const visitedThisMonth = scopedAgents.filter((agent) =>
    agent.lastVisitAt?.startsWith("2026-09"),
  ).length;

  const confirmationRate = Math.round(
    (scopedVisits.filter((v) => v.confirmationStatus === "confirmed").length /
      Math.max(scopedVisits.length, 1)) *
      100,
  );

  const compliancePercent = Math.round(
    (compliantAgents / Math.max(scopedAgents.length, 1)) * 100,
  );

  const visitsByTcMap = new Map<string, number>();
  for (const visit of scopedVisits) {
    visitsByTcMap.set(visit.tcUserId, (visitsByTcMap.get(visit.tcUserId) ?? 0) + 1);
  }

  const visitsByDistrictMap = new Map<string, number>();
  for (const visit of scopedVisits) {
    const agent = store.agents.find((item) => item.id === visit.agentId);
    const district = agent?.geo.district ?? "Unknown";
    visitsByDistrictMap.set(district, (visitsByDistrictMap.get(district) ?? 0) + 1);
  }

  const liveTrendMap = new Map<string, { visits: number; agents: Set<string> }>();
  for (const visit of store.visits) {
    if (!agentIds.has(visit.agentId)) continue;
    if (viewer?.role === "TERRITORY_COORDINATOR" && visit.tcUserId !== viewer.userId) {
      continue;
    }
    if (filters.tcUserId && visit.tcUserId !== filters.tcUserId) continue;
    const month = visit.startedAt.slice(0, 7);
    const entry = liveTrendMap.get(month) ?? { visits: 0, agents: new Set<string>() };
    entry.visits += 1;
    entry.agents.add(visit.agentId);
    liveTrendMap.set(month, entry);
  }

  const monthlyTrend = [
    ...HISTORICAL_TREND.map((row) => ({
      month: row.month,
      visits:
        viewer?.role === "TERRITORY_COORDINATOR"
          ? Math.round(row.visits * 0.45)
          : row.visits,
      uniqueAgents:
        viewer?.role === "TERRITORY_COORDINATOR"
          ? Math.round(row.uniqueAgents * 0.5)
          : row.uniqueAgents,
    })),
    {
      month: "2026-09",
      visits: liveTrendMap.get("2026-09")?.visits ?? scopedVisits.length,
      uniqueAgents: liveTrendMap.get("2026-09")?.agents.size ?? visitedThisMonth,
    },
  ].filter((row) => {
    const monthStart = `${row.month}-01`;
    const monthEnd = `${row.month}-28`;
    if (filters.dateFrom && monthEnd < filters.dateFrom) return false;
    if (filters.dateTo && monthStart > filters.dateTo) return false;
    return true;
  });

  const overdueList = scopedAgents
    .filter((agent) => agent.compliance === "red")
    .map((agent) => ({
      id: agent.id,
      name: agent.name,
      code: agent.code,
      district: agent.geo.district,
      lastVisitAt: agent.lastVisitAt,
      daysOverdue: Math.max(0, daysSince(agent.lastVisitAt) - 60),
      tcUserId: agent.tcUserId,
      tcName: tcName(agent.tcUserId),
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  const tcIds = Array.from(
    new Set(scopedAgents.map((agent) => agent.tcUserId)),
  );

  const leaderboard = tcIds
    .map((tcUserId) => {
      const tcAgents = scopedAgents.filter((agent) => agent.tcUserId === tcUserId);
      const green = tcAgents.filter((agent) => agent.compliance === "green").length;
      return {
        tcUserId,
        name: tcName(tcUserId),
        agents: tcAgents.length,
        visits: visitsByTcMap.get(tcUserId) ?? 0,
        compliancePercent: Math.round((green / Math.max(tcAgents.length, 1)) * 100),
      };
    })
    .sort((a, b) => b.compliancePercent - a.compliancePercent);

  const allAgentsForFilters =
    viewer?.role === "TERRITORY_COORDINATOR"
      ? store.agents.filter((agent) => agent.tcUserId === viewer.userId)
      : store.agents;

  const provinces = Array.from(
    new Set(allAgentsForFilters.map((agent) => agent.geo.province)),
  ).sort();
  const districts = Array.from(
    new Set(
      allAgentsForFilters
        .filter((agent) =>
          filters.province ? agent.geo.province === filters.province : true,
        )
        .map((agent) => agent.geo.district),
    ),
  ).sort();

  const coordinators = DEMO_USERS.filter(
    (user) => user.role === "TERRITORY_COORDINATOR",
  ).map((user) => ({ id: user.id, name: user.name }));

  const openActionItems = store.actionItems.filter((item) => {
    if (item.status === "done") return false;
    if (viewer?.role === "TERRITORY_COORDINATOR") {
      return item.ownerUserId === viewer.userId;
    }
    return true;
  }).length;

  const openFraudFlags =
    viewer?.role === "TERRITORY_COORDINATOR"
      ? 0
      : store.fraudFlags.filter((flag) => flag.status === "open").length;

  return delay({
    summary: {
      totalAgents: scopedAgents.length,
      activeAgents,
      overdueAgents,
      dueSoonAgents,
      compliantAgents,
      visitedThisMonth,
      visitsInRange: scopedVisits.length,
      confirmationRate,
      openFraudFlags,
      openActionItems,
      compliancePercent,
      agentsWithoutTelecom: scopedAgents.filter((a) => !a.services.telecomTools)
        .length,
      agentsWithoutInternet: scopedAgents.filter((a) => !a.services.internetAvailable)
        .length,
      agentsWithoutInsurance: scopedAgents.filter((a) => !a.services.insuranceTools)
        .length,
    },
    complianceDistribution: [
      {
        key: "green",
        label: "Compliant",
        value: compliantAgents,
        fill: COMPLIANCE_COLORS.green,
      },
      {
        key: "yellow",
        label: "Due soon",
        value: dueSoonAgents,
        fill: COMPLIANCE_COLORS.yellow,
      },
      {
        key: "red",
        label: "Overdue",
        value: overdueAgents,
        fill: COMPLIANCE_COLORS.red,
      },
    ],
    visitsByTc: Array.from(visitsByTcMap.entries())
      .map(([id, visits]) => ({ name: tcName(id), visits }))
      .sort((a, b) => b.visits - a.visits),
    visitsByDistrict: Array.from(visitsByDistrictMap.entries())
      .map(([name, visits]) => ({ name, visits }))
      .sort((a, b) => b.visits - a.visits),
    monthlyTrend: monthlyTrend.map((row) => ({
      ...row,
      month: row.month.replace("2026-", ""),
    })),
    serviceGaps: [
      { name: "No telecom tools", count: scopedAgents.filter((a) => !a.services.telecomTools).length },
      { name: "No internet", count: scopedAgents.filter((a) => !a.services.internetAvailable).length },
      { name: "No insurance tools", count: scopedAgents.filter((a) => !a.services.insuranceTools).length },
      { name: "No printer", count: scopedAgents.filter((a) => !a.services.printer).length },
      { name: "No branding", count: scopedAgents.filter((a) => !a.services.brandingVisible).length },
    ],
    overdueAgents: overdueList,
    leaderboard,
    filterOptions: {
      provinces,
      districts,
      coordinators,
    },
  });
}
