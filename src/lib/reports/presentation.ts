import type { MonthlyReportNarrative, ReportStatus } from "@/types";

/** Narrative sections G1–G7 of the monthly territory report. */
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

/** Display names for the KPI keys returned by the API. */
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
  coapLeads: "COAP leads captured",
  coapActivities: "COAP field activities",
  coapOnboardingCompleted: "COAP onboarding completed",
  coapSales: "COAP sales recorded",
  coapFeedbackOpen: "Open community feedback",
};

/** Statuses a TC can still edit. */
export const EDITABLE_STATUSES: ReportStatus[] = ["draft", "changes_requested"];

/** Statuses waiting on Head Office. */
export const AWAITING_REVIEW_STATUSES: ReportStatus[] = [
  "submitted",
  "resubmitted",
  "under_review",
];

/** Statuses from which Head Office can open a scorecard. */
export const SCORABLE_STATUSES: ReportStatus[] = [
  ...AWAITING_REVIEW_STATUSES,
  "reviewed",
  "evaluated",
];

export function reportStatusTone(status: ReportStatus) {
  if (status === "draft") return "neutral" as const;
  if (status === "submitted" || status === "resubmitted") return "info" as const;
  if (status === "under_review" || status === "changes_requested") {
    return "warning" as const;
  }
  if (status === "reviewed" || status === "evaluated") return "success" as const;
  return "neutral" as const;
}

export function reportStatusLabel(status: ReportStatus) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Status options for the reports filter bar. */
export const REPORT_STATUS_OPTIONS: Array<{ value: ReportStatus; label: string }> =
  (
    [
      "draft",
      "changes_requested",
      "submitted",
      "resubmitted",
      "under_review",
      "reviewed",
      "evaluated",
    ] as ReportStatus[]
  ).map((value) => ({ value, label: reportStatusLabel(value) }));

/** Month of `date` as `YYYY-MM` (local time). */
export function currentPeriod(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

/** Reports are due by the 5th of the next month, so the last month is the usual target. */
export function previousPeriod(date = new Date()): string {
  return currentPeriod(new Date(date.getFullYear(), date.getMonth() - 1, 1));
}
