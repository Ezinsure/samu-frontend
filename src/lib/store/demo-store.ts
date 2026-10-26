import {
  ACTION_ITEMS,
  AGENTS,
  AUDIT_LOGS,
  COMMUNITY_FEEDBACK,
  DEFAULT_SETTINGS,
  FIELD_ACTIVITIES,
  FRAUD_FLAGS,
  LEADS,
  MEETINGS,
  MONTHLY_REPORTS,
  ONBOARDING_CASES,
  SALE_RECORDS,
  SCORECARDS,
  SENSITIZATIONS,
  TERRITORIES,
  TRAININGS,
  VISITS,
} from "@data/index";
import type {
  ActionItem,
  Agent,
  AuditLog,
  CommunityFeedback,
  FieldActivity,
  FraudFlag,
  Lead,
  Meeting,
  MonthlyReport,
  OnboardingCase,
  SaleRecord,
  Scorecard,
  SensitizationEvent,
  SystemSettings,
  Territory,
  TrainingSession,
  Visit,
} from "@/types";

const STORE_KEY = "samu.demo.store.v6";

export interface DemoStoreState {
  agents: Agent[];
  visits: Visit[];
  sensitizations: SensitizationEvent[];
  trainings: TrainingSession[];
  meetings: Meeting[];
  actionItems: ActionItem[];
  monthlyReports: MonthlyReport[];
  fraudFlags: FraudFlag[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  assignments: Array<{
    id: string;
    agentId: string;
    tcUserId: string;
    startedAt: string;
    endedAt?: string;
    active: boolean;
  }>;
  territories: Territory[];
  territoryAssignments: Array<{
    id: string;
    territoryId: string;
    tcUserId: string;
    startedAt: string;
    endedAt?: string;
    active: boolean;
  }>;
  scorecards: Scorecard[];
  leads: Lead[];
  fieldActivities: FieldActivity[];
  onboardingCases: OnboardingCase[];
  sales: SaleRecord[];
  communityFeedback: CommunityFeedback[];
}

function seedTerritoryAssignments(territories: Territory[]) {
  const active = territories
    .filter((item) => item.type === "district" && item.tcUserId)
    .map((item) => ({
      id: `tasg-${item.id}`,
      territoryId: item.id,
      tcUserId: item.tcUserId as string,
      startedAt: "2025-11-01T08:00:00.000Z",
      active: true,
    }));

  return [
    {
      id: "tasg-dist-gasabo-prior",
      territoryId: "dist-gasabo",
      tcUserId: "user-tc-south",
      startedAt: "2025-06-01T08:00:00.000Z",
      endedAt: "2025-10-31T17:00:00.000Z",
      active: false,
    },
    ...active,
  ];
}

function seedState(): DemoStoreState {
  const agents = structuredClone(AGENTS).map((agent) => ({
    ...agent,
    services: {
      ...agent.services,
      cleanCookingTools: agent.services.cleanCookingTools ?? false,
      starlinkReady: agent.services.starlinkReady ?? false,
    },
  }));
  const territories = structuredClone(TERRITORIES);
  return {
    agents,
    visits: structuredClone(VISITS),
    sensitizations: structuredClone(SENSITIZATIONS),
    trainings: structuredClone(TRAININGS),
    meetings: structuredClone(MEETINGS),
    actionItems: structuredClone(ACTION_ITEMS),
    monthlyReports: structuredClone(MONTHLY_REPORTS),
    fraudFlags: structuredClone(FRAUD_FLAGS),
    auditLogs: structuredClone(AUDIT_LOGS),
    settings: structuredClone(DEFAULT_SETTINGS),
    assignments: agents.map((agent) => ({
      id: `asg-${agent.id}`,
      agentId: agent.id,
      tcUserId: agent.tcUserId,
      startedAt: agent.createdAt,
      active: true,
    })),
    territories,
    territoryAssignments: seedTerritoryAssignments(territories),
    scorecards: structuredClone(SCORECARDS),
    leads: structuredClone(LEADS),
    fieldActivities: structuredClone(FIELD_ACTIVITIES),
    onboardingCases: structuredClone(ONBOARDING_CASES),
    sales: structuredClone(SALE_RECORDS),
    communityFeedback: structuredClone(COMMUNITY_FEEDBACK),
  };
}

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function readDemoStore(): DemoStoreState {
  if (!canUseStorage()) return seedState();

  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      const seeded = seedState();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Partial<DemoStoreState>;
    const seeded = seedState();
    return {
      ...seeded,
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      assignments: parsed.assignments ?? seeded.assignments,
      territories: parsed.territories ?? seeded.territories,
      territoryAssignments:
        parsed.territoryAssignments ?? seeded.territoryAssignments,
      fraudFlags: (parsed.fraudFlags ?? seeded.fraudFlags).map((flag) => ({
        ...flag,
        reviewHistory: flag.reviewHistory ?? [],
      })),
      monthlyReports: (parsed.monthlyReports ?? seeded.monthlyReports).map(
        (report) => ({
          ...report,
          narrative: {
            g1: report.narrative?.g1 ?? "",
            g2: report.narrative?.g2 ?? "",
            g3: report.narrative?.g3 ?? "",
            g4: report.narrative?.g4 ?? "",
            g5: report.narrative?.g5 ?? "",
            g6: report.narrative?.g6 ?? "",
            g7: report.narrative?.g7 ?? "",
          },
          agentMappingSnapshot: report.agentMappingSnapshot ?? [],
          history: report.history ?? [],
        }),
      ),
      scorecards: parsed.scorecards ?? seeded.scorecards,
      agents: (parsed.agents ?? seeded.agents).map((agent) => ({
        ...agent,
        services: {
          ...agent.services,
          cleanCookingTools: agent.services.cleanCookingTools ?? false,
          starlinkReady: agent.services.starlinkReady ?? false,
        },
      })),
      leads: parsed.leads ?? seeded.leads,
      fieldActivities: parsed.fieldActivities ?? seeded.fieldActivities,
      onboardingCases: parsed.onboardingCases ?? seeded.onboardingCases,
      sales: parsed.sales ?? seeded.sales,
      communityFeedback: parsed.communityFeedback ?? seeded.communityFeedback,
    };
  } catch {
    const seeded = seedState();
    window.localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

export function writeDemoStore(state: DemoStoreState) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

export function updateDemoStore(
  updater: (state: DemoStoreState) => DemoStoreState,
): DemoStoreState {
  const next = updater(readDemoStore());
  writeDemoStore(next);
  return next;
}

export function resetDemoStore(): DemoStoreState {
  const seeded = seedState();
  writeDemoStore(seeded);
  return seeded;
}

export function appendAuditLog(
  entry: Omit<AuditLog, "id" | "timestamp"> & { id?: string; timestamp?: string },
) {
  updateDemoStore((state) => ({
    ...state,
    auditLogs: [
      {
        id: entry.id ?? `audit-${Date.now()}`,
        timestamp: entry.timestamp ?? new Date().toISOString(),
        actorUserId: entry.actorUserId,
        action: entry.action,
        objectType: entry.objectType,
        objectId: entry.objectId,
        summary: entry.summary,
      },
      ...state.auditLogs,
    ],
  }));
}
