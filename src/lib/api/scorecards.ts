import { DEMO_USERS } from "@data/index";
import { delay, matchesSearch, paginate } from "@/lib/api/helpers";
import { readDemoStore, updateDemoStore } from "@/lib/store/demo-store";
import type {
  ListQuery,
  Paginated,
  Scorecard,
  ScorecardCriterionDef,
  ScorecardCriterionScore,
  ScorecardDecision,
  SessionUser,
} from "@/types";

export const SCORECARD_CRITERIA: ScorecardCriterionDef[] = [
  { id: "field_visits", label: "Field visits", weight: 0.2 },
  { id: "sensitization", label: "Sensitization", weight: 0.15 },
  { id: "agent_training", label: "Agent training", weight: 0.15 },
  { id: "agent_mapping", label: "Agent mapping", weight: 0.1 },
  { id: "meetings", label: "Meetings", weight: 0.1 },
  {
    id: "recruitment_reactivation",
    label: "Recruitment and reactivation",
    weight: 0.1,
  },
  { id: "narrative_quality", label: "Narrative quality", weight: 0.1 },
  {
    id: "reporting_timeliness",
    label: "Reporting timeliness and completeness",
    weight: 0.1,
  },
];

/** Decision bands for weighted total on a 1–5 scale (Excel-aligned). */
export const SCORECARD_DECISION_RANGES: Array<{
  decision: ScorecardDecision;
  min: number;
  max: number;
  description: string;
}> = [
  {
    decision: "Outstanding",
    min: 4.5,
    max: 5.0,
    description: "4.50 – 5.00",
  },
  {
    decision: "Meets expectations",
    min: 3.5,
    max: 4.49,
    description: "3.50 – 4.49",
  },
  {
    decision: "Needs improvement",
    min: 2.5,
    max: 3.49,
    description: "2.50 – 3.49",
  },
  {
    decision: "Unsatisfactory",
    min: 1.0,
    max: 2.49,
    description: "1.00 – 2.49",
  },
];

export function calculateWeightedTotal(
  criteria: ScorecardCriterionScore[],
  defs: ScorecardCriterionDef[] = SCORECARD_CRITERIA,
): number {
  const total = defs.reduce((sum, def) => {
    const score = criteria.find((item) => item.criterionId === def.id)?.score ?? 0;
    return sum + score * def.weight;
  }, 0);
  return Math.round(total * 100) / 100;
}

export function suggestDecision(weightedTotal: number): ScorecardDecision {
  if (weightedTotal >= 4.5) return "Outstanding";
  if (weightedTotal >= 3.5) return "Meets expectations";
  if (weightedTotal >= 2.5) return "Needs improvement";
  return "Unsatisfactory";
}

export function decisionTone(decision?: ScorecardDecision) {
  if (decision === "Outstanding") return "success" as const;
  if (decision === "Meets expectations") return "info" as const;
  if (decision === "Needs improvement") return "warning" as const;
  if (decision === "Unsatisfactory") return "danger" as const;
  return "neutral" as const;
}

function userName(userId: string) {
  return DEMO_USERS.find((user) => user.id === userId)?.name ?? userId;
}

export function canEvaluateScorecards(viewer?: SessionUser | null) {
  return (
    viewer?.role === "ADMIN" || viewer?.role === "OPERATIONS_MANAGER"
  );
}

export function canViewScorecards(viewer?: SessionUser | null) {
  return Boolean(viewer && viewer.role !== "AGENT");
}

export interface ScorecardQuery extends ListQuery {
  search?: string;
  status?: string;
  period?: string;
  tcUserId?: string;
}

export interface ScorecardListItem extends Scorecard {
  tcName: string;
  evaluatorName?: string;
  suggestedDecision: ScorecardDecision;
}

export interface ScorecardWorkspace {
  scorecard: ScorecardListItem;
  criteriaDefs: ScorecardCriterionDef[];
  decisionRanges: typeof SCORECARD_DECISION_RANGES;
  report?: {
    id: string;
    status: string;
    kpiActuals: Record<string, number>;
    territorySnapshot: string[];
  };
  canEdit: boolean;
  breakdown: Array<{
    id: string;
    label: string;
    weight: number;
    score: number;
    weighted: number;
    comment: string;
  }>;
}

function enrich(
  scorecard: Scorecard,
): ScorecardListItem {
  const weightedTotal = calculateWeightedTotal(scorecard.criteria);
  return {
    ...scorecard,
    weightedTotal,
    tcName: userName(scorecard.tcUserId),
    evaluatorName: scorecard.evaluatorUserId
      ? userName(scorecard.evaluatorUserId)
      : undefined,
    suggestedDecision: suggestDecision(weightedTotal),
  };
}

export async function getScorecards(
  query: ScorecardQuery = {},
  viewer?: SessionUser | null,
): Promise<Paginated<ScorecardListItem>> {
  if (!canViewScorecards(viewer)) {
    return delay(paginate([], query));
  }

  const store = readDemoStore();
  let items = store.scorecards.map(enrich);

  if (viewer?.role === "TERRITORY_COORDINATOR") {
    items = items.filter(
      (item) => item.tcUserId === viewer.userId && item.status === "submitted",
    );
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
        `${item.period} ${item.tcName} ${item.status} ${item.decision ?? ""}`,
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

export async function getScorecardWorkspace(
  id: string,
  viewer?: SessionUser | null,
): Promise<ScorecardWorkspace | null> {
  if (!canViewScorecards(viewer)) return delay(null);

  const store = readDemoStore();
  const scorecard = store.scorecards.find((item) => item.id === id);
  if (!scorecard) return delay(null);

  if (
    viewer?.role === "TERRITORY_COORDINATOR" &&
    scorecard.tcUserId !== viewer.userId
  ) {
    return delay(null);
  }

  // TC may only view submitted results
  if (
    viewer?.role === "TERRITORY_COORDINATOR" &&
    scorecard.status !== "submitted"
  ) {
    return delay(null);
  }

  const enriched = enrich(scorecard);
  const report = store.monthlyReports.find(
    (item) => item.id === scorecard.monthlyReportId,
  );

  const breakdown = SCORECARD_CRITERIA.map((def) => {
    const entry = scorecard.criteria.find(
      (item) => item.criterionId === def.id,
    );
    const score = entry?.score ?? 0;
    return {
      id: def.id,
      label: def.label,
      weight: def.weight,
      score,
      weighted: Math.round(score * def.weight * 100) / 100,
      comment: entry?.comment ?? "",
    };
  });

  return delay({
    scorecard: enriched,
    criteriaDefs: SCORECARD_CRITERIA,
    decisionRanges: SCORECARD_DECISION_RANGES,
    report: report
      ? {
          id: report.id,
          status: report.status,
          kpiActuals: report.kpiActuals,
          territorySnapshot: report.territorySnapshot,
        }
      : undefined,
    canEdit:
      Boolean(canEvaluateScorecards(viewer)) &&
      scorecard.status === "draft" &&
      viewer?.role !== "MD_VIEWER",
    breakdown,
  });
}

export async function saveScorecardDraft(
  id: string,
  input: {
    criteria: ScorecardCriterionScore[];
    overallComment: string;
    decision?: ScorecardDecision;
  },
  actor: SessionUser,
): Promise<{ ok: true; weightedTotal: number } | { ok: false; error: string }> {
  if (!canEvaluateScorecards(actor)) {
    return delay({ ok: false, error: "Not authorized to evaluate scorecards." });
  }

  const store = readDemoStore();
  const scorecard = store.scorecards.find((item) => item.id === id);
  if (!scorecard) return delay({ ok: false, error: "Scorecard not found." });
  if (scorecard.status !== "draft") {
    return delay({ ok: false, error: "Submitted scorecards cannot be edited." });
  }

  for (const entry of input.criteria) {
    if (entry.score < 1 || entry.score > 5) {
      return delay({ ok: false, error: "Scores must be between 1 and 5." });
    }
  }

  const weightedTotal = calculateWeightedTotal(input.criteria);
  const now = new Date().toISOString();

  updateDemoStore((state) => ({
    ...state,
    scorecards: state.scorecards.map((item) =>
      item.id === id
        ? {
            ...item,
            criteria: input.criteria.map((entry) => ({ ...entry })),
            overallComment: input.overallComment,
            decision: input.decision ?? suggestDecision(weightedTotal),
            weightedTotal,
            evaluatorUserId: actor.userId,
            updatedAt: now,
          }
        : item,
    ),
    auditLogs: [
      {
        id: `audit-${Date.now()}`,
        actorUserId: actor.userId,
        action: "scorecard.save_draft",
        objectType: "scorecard",
        objectId: id,
        timestamp: now,
        summary: `Scorecard draft saved (${weightedTotal.toFixed(2)} / 5).`,
      },
      ...state.auditLogs,
    ],
  }));

  return delay({ ok: true, weightedTotal });
}

export async function submitScorecard(
  id: string,
  actor: SessionUser,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canEvaluateScorecards(actor)) {
    return delay({ ok: false, error: "Not authorized to submit scorecards." });
  }

  const store = readDemoStore();
  const scorecard = store.scorecards.find((item) => item.id === id);
  if (!scorecard) return delay({ ok: false, error: "Scorecard not found." });
  if (scorecard.status !== "draft") {
    return delay({ ok: false, error: "Scorecard is already submitted." });
  }

  const incomplete = scorecard.criteria.some(
    (item) => !item.score || item.score < 1 || item.score > 5,
  );
  if (incomplete) {
    return delay({ ok: false, error: "All criteria need a score from 1 to 5." });
  }

  const weightedTotal = calculateWeightedTotal(scorecard.criteria);
  const decision = scorecard.decision ?? suggestDecision(weightedTotal);
  const now = new Date().toISOString();

  updateDemoStore((state) => ({
    ...state,
    scorecards: state.scorecards.map((item) =>
      item.id === id
        ? {
            ...item,
            status: "submitted" as const,
            weightedTotal,
            decision,
            evaluatorUserId: actor.userId,
            submittedAt: now,
            updatedAt: now,
          }
        : item,
    ),
    monthlyReports: state.monthlyReports.map((report) =>
      report.id === scorecard.monthlyReportId
        ? { ...report, status: "evaluated" as const }
        : report,
    ),
    auditLogs: [
      {
        id: `audit-${Date.now()}`,
        actorUserId: actor.userId,
        action: "scorecard.submit",
        objectType: "scorecard",
        objectId: id,
        timestamp: now,
        summary: `Scorecard submitted: ${decision} (${weightedTotal.toFixed(2)} / 5).`,
      },
      ...state.auditLogs,
    ],
  }));

  return delay({ ok: true });
}

/** Ensure a draft scorecard exists for a submitted monthly report (Ops/Admin). */
export async function ensureScorecardForReport(
  monthlyReportId: string,
  actor: SessionUser,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!canEvaluateScorecards(actor)) {
    return delay({ ok: false, error: "Not authorized." });
  }

  const store = readDemoStore();
  const existing = store.scorecards.find(
    (item) => item.monthlyReportId === monthlyReportId,
  );
  if (existing) return delay({ ok: true, id: existing.id });

  const report = store.monthlyReports.find((item) => item.id === monthlyReportId);
  if (!report) return delay({ ok: false, error: "Monthly report not found." });
  if (
    report.status !== "submitted" &&
    report.status !== "resubmitted" &&
    report.status !== "under_review" &&
    report.status !== "reviewed" &&
    report.status !== "evaluated"
  ) {
    return delay({
      ok: false,
      error: "Only submitted reports can be evaluated.",
    });
  }

  const id = `score-${report.period}-${report.tcUserId}`;
  const now = new Date().toISOString();
  const criteria: ScorecardCriterionScore[] = SCORECARD_CRITERIA.map(
    (def) => ({
      criterionId: def.id,
      score: 3,
      comment: "",
    }),
  );

  updateDemoStore((state) => ({
    ...state,
    scorecards: [
      {
        id,
        monthlyReportId,
        tcUserId: report.tcUserId,
        period: report.period,
        status: "draft",
        templateVersion: "v1-2026",
        criteria,
        overallComment: "",
        weightedTotal: calculateWeightedTotal(criteria),
        evaluatorUserId: actor.userId,
        updatedAt: now,
      },
      ...state.scorecards,
    ],
  }));

  return delay({ ok: true, id });
}
