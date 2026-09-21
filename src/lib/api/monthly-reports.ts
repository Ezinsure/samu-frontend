import { DEMO_USERS } from "@data/index";
import { delay, matchesSearch, paginate } from "@/lib/api/helpers";
import { readDemoStore, updateDemoStore } from "@/lib/store/demo-store";
import type {
  Agent,
  ListQuery,
  MonthlyReport,
  MonthlyReportAgentSnapshot,
  MonthlyReportNarrative,
  Paginated,
  ReportStatus,
  SessionUser,
} from "@/types";

export const NARRATIVE_PROMPTS: Array<{
  key: keyof MonthlyReportNarrative;
  label: string;
  hint: string;
}> = [
  {
    key: "g1",
    label: "G1 — Key achievements",
    hint: "What went well this month?",
  },
  {
    key: "g2",
    label: "G2 — Challenges",
    hint: "What blocked delivery or quality?",
  },
  {
    key: "g3",
    label: "G3 — Agent network observations",
    hint: "Coverage, readiness, and compliance notes.",
  },
  {
    key: "g4",
    label: "G4 — Community & partners",
    hint: "Engagement with leaders, markets, and partners.",
  },
  {
    key: "g5",
    label: "G5 — Support needed from Head Office",
    hint: "Tools, escalations, or decisions required.",
  },
  {
    key: "g6",
    label: "G6 — Risks & escalations",
    hint: "Fraud, disputes, or operational risks to watch.",
  },
  {
    key: "g7",
    label: "G7 — Priorities next month",
    hint: "Top actions for the coming reporting period.",
  },
];

export const KPI_LABELS: Record<string, string> = {
  totalVisits: "Total agent visits",
  uniqueAgentsVisited: "Unique agents visited",
  sensitizationEvents: "Sensitization events",
  peopleReached: "Community members reached",
  trainingSessions: "Training sessions",
  agentsTrained: "Agents trained",
  meetings: "Coordination meetings",
  newAgents: "New agents recruited",
  reactivatedAgents: "Inactive agents reactivated",
  newClients: "New clients registered",
};

const EMPTY_NARRATIVE: MonthlyReportNarrative = {
  g1: "",
  g2: "",
  g3: "",
  g4: "",
  g5: "",
  g6: "",
  g7: "",
};

function userName(userId: string) {
  return DEMO_USERS.find((user) => user.id === userId)?.name ?? userId;
}

export function canEditReport(
  report: MonthlyReport,
  viewer?: SessionUser | null,
) {
  if (!viewer) return false;
  if (viewer.role === "MD_VIEWER") return false;
  if (viewer.role === "TERRITORY_COORDINATOR") {
    return (
      report.tcUserId === viewer.userId &&
      (report.status === "draft" || report.status === "changes_requested")
    );
  }
  return false;
}

export function canReviewReport(viewer?: SessionUser | null) {
  return (
    viewer?.role === "ADMIN" || viewer?.role === "OPERATIONS_MANAGER"
  );
}

export function reportStatusTone(status: ReportStatus) {
  if (status === "draft") return "neutral" as const;
  if (status === "submitted" || status === "resubmitted") return "info" as const;
  if (status === "under_review") return "warning" as const;
  if (status === "changes_requested") return "warning" as const;
  if (status === "reviewed" || status === "evaluated") return "success" as const;
  return "neutral" as const;
}

export function reportStatusLabel(status: ReportStatus) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function daysUntil(deadline: string) {
  const end = new Date(`${deadline}T23:59:59.000Z`).getTime();
  const now = Date.now();
  return Math.ceil((end - now) / 86400000);
}

function snapshotAgents(agents: Agent[]): MonthlyReportAgentSnapshot[] {
  return agents
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((agent) => ({
      agentId: agent.id,
      code: agent.code,
      name: agent.name,
      district: agent.geo.district,
      sector: agent.geo.sector,
      status: agent.status,
      compliance: agent.compliance,
      lastVisitAt: agent.lastVisitAt,
      recruitedThisMonth: agent.recruitedThisMonth,
      reactivatedThisMonth: agent.reactivatedThisMonth,
    }));
}

function computeKpis(tcUserId: string, period: string) {
  const store = readDemoStore();
  const [year, month] = period.split("-").map(Number);
  const inPeriod = (iso: string) => {
    const date = new Date(iso);
    return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month;
  };

  const visits = store.visits.filter(
    (visit) => visit.tcUserId === tcUserId && inPeriod(visit.startedAt),
  );
  const uniqueAgents = new Set(visits.map((visit) => visit.agentId));
  const sensitizations = store.sensitizations.filter(
    (item) => item.tcUserId === tcUserId && item.date.startsWith(period),
  );
  const trainings = store.trainings.filter(
    (item) => item.tcUserId === tcUserId && item.date.startsWith(period),
  );
  const meetings = store.meetings.filter(
    (item) => item.tcUserId === tcUserId && item.date.startsWith(period),
  );
  const agents = store.agents.filter((agent) => agent.tcUserId === tcUserId);

  return {
    totalVisits: visits.length,
    uniqueAgentsVisited: uniqueAgents.size,
    sensitizationEvents: sensitizations.length,
    peopleReached: sensitizations.reduce(
      (sum, item) => sum + item.peopleReached,
      0,
    ),
    trainingSessions: trainings.length,
    agentsTrained: trainings.reduce(
      (sum, item) => sum + item.agentsTrained,
      0,
    ),
    meetings: meetings.length,
    newAgents: agents.filter((agent) => agent.recruitedThisMonth).length,
    reactivatedAgents: agents.filter((agent) => agent.reactivatedThisMonth)
      .length,
    newClients: agents.reduce(
      (sum, agent) => sum + (agent.clientsRegistered > 0 ? Math.min(agent.clientsRegistered, 5) : 0),
      0,
    ),
  };
}

function normalizeReport(report: MonthlyReport): MonthlyReport {
  return {
    ...report,
    narrative: { ...EMPTY_NARRATIVE, ...report.narrative },
    agentMappingSnapshot: report.agentMappingSnapshot ?? [],
    history: report.history ?? [],
  };
}

export interface MonthlyReportQuery extends ListQuery {
  search?: string;
  status?: string;
  period?: string;
  tcUserId?: string;
}

export interface MonthlyReportListItem extends MonthlyReport {
  tcName: string;
  daysToDeadline: number;
  overdue: boolean;
  kpiProgressPercent: number;
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

function enrichListItem(
  report: MonthlyReport,
  targets: Record<string, number>,
): MonthlyReportListItem {
  const normalized = normalizeReport(report);
  const daysToDeadline = daysUntil(normalized.deadline);
  const kpiKeys = Object.keys(targets);
  const met = kpiKeys.filter(
    (key) => (normalized.kpiActuals[key] ?? 0) >= (targets[key] ?? 0),
  ).length;
  return {
    ...normalized,
    tcName: userName(normalized.tcUserId),
    daysToDeadline,
    overdue:
      daysToDeadline < 0 &&
      (normalized.status === "draft" ||
        normalized.status === "changes_requested"),
    kpiProgressPercent: Math.round((met / Math.max(kpiKeys.length, 1)) * 100),
  };
}

export async function getMonthlyReports(
  query: MonthlyReportQuery = {},
  viewer?: SessionUser | null,
): Promise<Paginated<MonthlyReportListItem>> {
  const store = readDemoStore();
  const targets = store.settings.kpiTargets;
  let items = store.monthlyReports.map((report) =>
    enrichListItem(report, targets),
  );

  if (viewer?.role === "TERRITORY_COORDINATOR") {
    items = items.filter((item) => item.tcUserId === viewer.userId);
  }
  if (query.status) {
    items = items.filter((item) => item.status === query.status);
  }
  if (query.period) {
    items = items.filter((item) => item.period === query.period);
  }
  if (query.tcUserId) {
    items = items.filter((item) => item.tcUserId === query.tcUserId);
  }
  if (query.search) {
    items = items.filter((item) =>
      matchesSearch(
        `${item.period} ${item.tcName} ${item.status} ${item.territorySnapshot.join(" ")}`,
        query.search,
      ),
    );
  }

  items.sort((a, b) => {
    if (a.period === b.period) return a.tcName.localeCompare(b.tcName);
    return b.period.localeCompare(a.period);
  });

  return delay(paginate(items, query));
}

export async function getMonthlyReportWorkspace(
  id: string,
  viewer?: SessionUser | null,
): Promise<MonthlyReportWorkspace | null> {
  const store = readDemoStore();
  const report = store.monthlyReports.find((item) => item.id === id);
  if (!report) return delay(null);

  if (
    viewer?.role === "TERRITORY_COORDINATOR" &&
    report.tcUserId !== viewer.userId
  ) {
    return delay(null);
  }

  const targets = store.settings.kpiTargets;
  const enriched = enrichListItem(report, targets);
  const period = report.period;

  const visits = store.visits.filter(
    (visit) =>
      visit.tcUserId === report.tcUserId &&
      visit.startedAt.startsWith(period),
  );
  const sensitizations = store.sensitizations
    .filter(
      (item) =>
        item.tcUserId === report.tcUserId && item.date.startsWith(period),
    )
    .map((item) => ({
      id: item.id,
      date: item.date,
      venue: item.venue,
      peopleReached: item.peopleReached,
    }));
  const trainings = store.trainings
    .filter(
      (item) =>
        item.tcUserId === report.tcUserId && item.date.startsWith(period),
    )
    .map((item) => ({
      id: item.id,
      date: item.date,
      topic: item.topic,
      agentsTrained: item.agentsTrained,
    }));
  const meetings = store.meetings
    .filter(
      (item) =>
        item.tcUserId === report.tcUserId && item.date.startsWith(period),
    )
    .map((item) => ({
      id: item.id,
      date: item.date,
      meetingType: item.meetingType,
      location: item.location,
    }));
  const actionItems = store.actionItems
    .filter((item) => item.ownerUserId === report.tcUserId)
    .slice(0, 12)
    .map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      priority: item.priority,
      dueDate: item.dueDate,
    }));

  let mapping = enriched.agentMappingSnapshot;
  if (
    mapping.length === 0 ||
    enriched.status === "draft" ||
    enriched.status === "changes_requested"
  ) {
    mapping = snapshotAgents(
      store.agents.filter((agent) => agent.tcUserId === report.tcUserId),
    );
  }

  return delay({
    report: { ...enriched, agentMappingSnapshot: mapping },
    targets,
    linkedActivities: {
      visits: visits.length,
      sensitizations,
      trainings,
      meetings,
      actionItems,
    },
    canEdit: canEditReport(enriched, viewer),
    canRequestChanges:
      Boolean(canReviewReport(viewer)) &&
      (enriched.status === "submitted" ||
        enriched.status === "resubmitted" ||
        enriched.status === "under_review"),
    historyEnriched: enriched.history
      .slice()
      .reverse()
      .map((event) => ({
        id: event.id,
        at: event.at,
        byName: userName(event.byUserId),
        action: event.action,
        notes: event.notes,
        status: event.status,
      })),
  });
}

export async function refreshReportKpis(
  id: string,
  actor: SessionUser,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const store = readDemoStore();
  const report = store.monthlyReports.find((item) => item.id === id);
  if (!report) return delay({ ok: false, error: "Report not found." });
  if (!canEditReport(report, actor)) {
    return delay({ ok: false, error: "Report is not editable." });
  }

  const kpiActuals = computeKpis(report.tcUserId, report.period);
  updateDemoStore((state) => ({
    ...state,
    monthlyReports: state.monthlyReports.map((item) =>
      item.id === id ? { ...normalizeReport(item), kpiActuals } : item,
    ),
  }));
  return delay({ ok: true });
}

export async function saveMonthlyReportDraft(
  id: string,
  input: {
    narrative: MonthlyReportNarrative;
    kpiActuals?: Record<string, number>;
  },
  actor: SessionUser,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const store = readDemoStore();
  const report = store.monthlyReports.find((item) => item.id === id);
  if (!report) return delay({ ok: false, error: "Report not found." });
  if (!canEditReport(report, actor)) {
    return delay({ ok: false, error: "You cannot edit this report." });
  }

  const now = new Date().toISOString();
  updateDemoStore((state) => ({
    ...state,
    monthlyReports: state.monthlyReports.map((item) => {
      if (item.id !== id) return item;
      const normalized = normalizeReport(item);
      return {
        ...normalized,
        narrative: { ...input.narrative },
        kpiActuals: input.kpiActuals
          ? { ...input.kpiActuals }
          : normalized.kpiActuals,
        history: [
          ...normalized.history,
          {
            id: `rh-${Date.now()}`,
            at: now,
            byUserId: actor.userId,
            action: "save_draft" as const,
            status: normalized.status,
            notes: "Draft saved.",
          },
        ],
      };
    }),
    auditLogs: [
      {
        id: `audit-${Date.now()}`,
        actorUserId: actor.userId,
        action: "monthly_report.save_draft",
        objectType: "monthly_report",
        objectId: id,
        timestamp: now,
        summary: `Draft saved for monthly report ${report.period}.`,
      },
      ...state.auditLogs,
    ],
  }));

  return delay({ ok: true });
}

export async function submitMonthlyReport(
  id: string,
  actor: SessionUser,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const store = readDemoStore();
  const report = store.monthlyReports.find((item) => item.id === id);
  if (!report) return delay({ ok: false, error: "Report not found." });
  if (!canEditReport(report, actor)) {
    return delay({ ok: false, error: "You cannot submit this report." });
  }

  const normalized = normalizeReport(report);
  const missing = NARRATIVE_PROMPTS.filter(
    (prompt) => !normalized.narrative[prompt.key]?.trim(),
  );
  if (missing.length > 0) {
    return delay({
      ok: false,
      error: `Complete narrative sections before submit (${missing.map((item) => item.key.toUpperCase()).join(", ")}).`,
    });
  }

  const now = new Date().toISOString();
  const nextStatus: ReportStatus =
    report.status === "changes_requested" ? "resubmitted" : "submitted";
  const mapping = snapshotAgents(
    store.agents.filter((agent) => agent.tcUserId === report.tcUserId),
  );

  updateDemoStore((state) => ({
    ...state,
    monthlyReports: state.monthlyReports.map((item) => {
      if (item.id !== id) return item;
      const current = normalizeReport(item);
      return {
        ...current,
        status: nextStatus,
        submittedAt: now,
        agentMappingSnapshot: mapping,
        history: [
          ...current.history,
          {
            id: `rh-${Date.now()}`,
            at: now,
            byUserId: actor.userId,
            action:
              nextStatus === "resubmitted"
                ? ("resubmit" as const)
                : ("submit" as const),
            status: nextStatus,
            notes:
              nextStatus === "resubmitted"
                ? "Resubmitted after changes requested."
                : "Submitted for Head Office review.",
          },
        ],
      };
    }),
    auditLogs: [
      {
        id: `audit-${Date.now()}`,
        actorUserId: actor.userId,
        action: `monthly_report.${nextStatus === "resubmitted" ? "resubmit" : "submit"}`,
        objectType: "monthly_report",
        objectId: id,
        timestamp: now,
        summary: `Monthly report ${report.period} ${nextStatus}.`,
      },
      ...state.auditLogs,
    ],
  }));

  return delay({ ok: true });
}

export async function requestReportChanges(
  id: string,
  notes: string,
  actor: SessionUser,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canReviewReport(actor)) {
    return delay({ ok: false, error: "Not authorized to request changes." });
  }
  if (!notes.trim()) {
    return delay({ ok: false, error: "Review notes are required." });
  }

  const store = readDemoStore();
  const report = store.monthlyReports.find((item) => item.id === id);
  if (!report) return delay({ ok: false, error: "Report not found." });
  if (
    report.status !== "submitted" &&
    report.status !== "resubmitted" &&
    report.status !== "under_review"
  ) {
    return delay({
      ok: false,
      error: "Only submitted reports can be sent back for changes.",
    });
  }

  const now = new Date().toISOString();
  updateDemoStore((state) => ({
    ...state,
    monthlyReports: state.monthlyReports.map((item) => {
      if (item.id !== id) return item;
      const current = normalizeReport(item);
      return {
        ...current,
        status: "changes_requested" as const,
        reviewNotes: notes.trim(),
        history: [
          ...current.history,
          {
            id: `rh-${Date.now()}`,
            at: now,
            byUserId: actor.userId,
            action: "request_changes" as const,
            status: "changes_requested",
            notes: notes.trim(),
          },
        ],
      };
    }),
    auditLogs: [
      {
        id: `audit-${Date.now()}`,
        actorUserId: actor.userId,
        action: "monthly_report.request_changes",
        objectType: "monthly_report",
        objectId: id,
        timestamp: now,
        summary: `Changes requested on monthly report ${report.period}.`,
      },
      ...state.auditLogs,
    ],
  }));

  return delay({ ok: true });
}
