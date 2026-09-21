import type { SystemSettings } from "@/types";

export const DEFAULT_SETTINGS: SystemSettings = {
  gpsDistanceMeters: 10,
  agentGreenDays: 60,
  agentYellowDays: 30,
  tcComplianceGreen: 90,
  tcComplianceYellow: 70,
  monthlyReportDueDay: 5,
  kpiTargets: {
    totalVisits: 20,
    uniqueAgentsVisited: 18,
    sensitizationEvents: 2,
    peopleReached: 100,
    trainingSessions: 2,
    agentsTrained: 18,
    meetings: 2,
    newAgents: 1,
    reactivatedAgents: 1,
    newClients: 30,
  },
};
