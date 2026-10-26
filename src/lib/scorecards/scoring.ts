import type {
  ScorecardCriterionDef,
  ScorecardCriterionScore,
  ScorecardDecision,
} from "@/types";

/**
 * Scoring template v1-2026. The API owns the authoritative copy (and returns
 * `criteriaDefs`); these mirrors power the live total while a form is edited.
 */
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

/** Decision bands for the weighted total on a 1–5 scale. */
export const SCORECARD_DECISION_RANGES: Array<{
  decision: ScorecardDecision;
  min: number;
  max: number;
  description: string;
}> = [
  { decision: "Outstanding", min: 4.5, max: 5.0, description: "4.50 – 5.00" },
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
  { decision: "Unsatisfactory", min: 1.0, max: 2.49, description: "1.00 – 2.49" },
];

const round2 = (value: number) => Math.round(value * 100) / 100;

export function calculateWeightedTotal(
  criteria: ScorecardCriterionScore[],
  defs: ScorecardCriterionDef[] = SCORECARD_CRITERIA,
): number {
  const total = defs.reduce((sum, def) => {
    const score =
      criteria.find((item) => item.criterionId === def.id)?.score ?? 0;
    return sum + score * def.weight;
  }, 0);
  return round2(total);
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

/** One row per criterion with its weighted contribution (read-only view). */
export function buildBreakdown(
  criteria: ScorecardCriterionScore[],
  defs: ScorecardCriterionDef[],
) {
  return defs.map((def) => {
    const entry = criteria.find((item) => item.criterionId === def.id);
    const score = entry?.score ?? 0;
    return {
      id: def.id,
      label: def.label,
      weight: def.weight,
      score,
      weighted: round2(score * def.weight),
      comment: entry?.comment ?? "",
    };
  });
}
