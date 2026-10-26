"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  buildBreakdown,
  calculateWeightedTotal,
  saveScorecardDraft,
  submitScorecard,
  suggestDecision,
  type ScorecardWorkspace,
} from "@/lib/api";
import type { ScorecardCriterionScore, ScorecardDecision } from "@/types";
import { ScorecardCriteriaCard } from "./scorecard-criteria-card";
import { ScorecardKpiCard } from "./scorecard-kpi-card";
import { ScorecardSummaryCard } from "./scorecard-summary-card";
import { ScorecardVerdictCards } from "./scorecard-verdict-cards";

interface ScorecardDetailViewProps {
  workspace: ScorecardWorkspace;
  /** Refetch the workspace (the view remounts with fresh server state). */
  onChanged: () => void;
}

/** Make sure every template criterion has an entry to edit (default 3/5). */
function withAllCriteria(
  scores: ScorecardCriterionScore[],
  defs: ScorecardWorkspace["criteriaDefs"],
): ScorecardCriterionScore[] {
  return defs.map(
    (def) =>
      scores.find((item) => item.criterionId === def.id) ?? {
        criterionId: def.id,
        score: 3,
        comment: "",
      },
  );
}

/** Scorecard evaluation: live total while editing, read-only once submitted. */
export function ScorecardDetailView({
  workspace,
  onChanged,
}: ScorecardDetailViewProps) {
  const { scorecard, criteriaDefs, report, canEdit } = workspace;

  // Seeded from the server; the parent remounts this view after every reload.
  const [criteria, setCriteria] = useState(() =>
    withAllCriteria(scorecard.criteria, criteriaDefs),
  );
  const [overallComment, setOverallComment] = useState(scorecard.overallComment);
  const [chosen, setChosen] = useState<ScorecardDecision | null>(
    scorecard.decision ?? null,
  );
  const [busy, setBusy] = useState(false);

  const liveTotal = useMemo(
    () => calculateWeightedTotal(criteria, criteriaDefs),
    [criteria, criteriaDefs],
  );
  const suggestion = suggestDecision(liveTotal);

  // Editors see the live numbers; everyone else sees what was stored.
  const total = canEdit ? liveTotal : scorecard.weightedTotal;
  const decision = canEdit
    ? (chosen ?? suggestion)
    : (scorecard.decision ?? scorecard.suggestedDecision);
  const rows = buildBreakdown(canEdit ? criteria : scorecard.criteria, criteriaDefs);

  function updateCriterion(
    criterionId: string,
    patch: Partial<ScorecardCriterionScore>,
  ) {
    setCriteria((current) =>
      current.map((item) =>
        item.criterionId === criterionId ? { ...item, ...patch } : item,
      ),
    );
  }

  async function saveDraft() {
    const result = await saveScorecardDraft(scorecard.id, {
      criteria,
      overallComment,
      decision,
    });
    if (!result.ok) {
      toast.error("Could not save scorecard", { description: result.error });
    }
    return result;
  }

  async function handleSave() {
    setBusy(true);
    const result = await saveDraft();
    setBusy(false);
    if (!result.ok) return;
    toast.success("Draft saved", {
      description: `Weighted total ${result.data.weightedTotal.toFixed(2)} / 5`,
    });
    onChanged();
  }

  async function handleSubmit() {
    setBusy(true);
    const saved = await saveDraft();
    if (!saved.ok) return setBusy(false);

    const result = await submitScorecard(scorecard.id);
    setBusy(false);
    if (!result.ok) {
      toast.error("Could not submit scorecard", { description: result.error });
      return;
    }
    toast.success("Scorecard submitted", {
      description: "The coordinator can now view the evaluation result.",
    });
    onChanged();
  }

  const isDraft = scorecard.status === "draft";

  return (
    <div className="space-y-6">
      <Button asChild variant="secondary" size="sm" className="w-fit">
        <Link href="/scorecards">
          <ArrowLeft className="h-4 w-4" />
          Scorecards
        </Link>
      </Button>

      <PageHeader
        title={`${scorecard.period} evaluation`}
        description={`${scorecard.tcName ?? "Coordinator"} · Template ${scorecard.templateVersion}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              label={isDraft ? "Draft" : "Submitted"}
              tone={isDraft ? "neutral" : "success"}
            />
            {canEdit ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void handleSave()}
                >
                  <Save className="h-4 w-4" />
                  Save draft
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleSubmit()}
                >
                  <Send className="h-4 w-4" />
                  Submit evaluation
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <ScorecardSummaryCard
          scorecard={scorecard}
          reportId={report.id}
          total={total}
          decision={decision}
        />
        <ScorecardKpiCard reportId={report.id} />
      </div>

      <ScorecardCriteriaCard
        rows={rows}
        editable={canEdit}
        onChange={updateCriterion}
      />

      <ScorecardVerdictCards
        editable={canEdit}
        overallComment={overallComment}
        onCommentChange={setOverallComment}
        decision={decision}
        suggestion={suggestion}
        onDecisionChange={setChosen}
      />
    </div>
  );
}
