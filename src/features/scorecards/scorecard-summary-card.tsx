import Link from "next/link";
import { format } from "date-fns";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SCORECARD_DECISION_RANGES,
  decisionTone,
  type ScorecardWorkspace,
} from "@/lib/api";
import type { ScorecardDecision } from "@/types";

interface ScorecardSummaryCardProps {
  scorecard: ScorecardWorkspace["scorecard"];
  reportId: string;
  /** Total and decision shown right now (live while editing). */
  total: number;
  decision: ScorecardDecision;
}

/** Weighted total, decision badge, decision bands and evaluator info. */
export function ScorecardSummaryCard({
  scorecard,
  reportId,
  total,
  decision,
}: ScorecardSummaryCardProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Weighted total</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-4xl font-bold tabular-nums tracking-tight">
          {total.toFixed(2)}
          <span className="text-lg font-medium text-foreground-secondary">
            {" "}
            / 5
          </span>
        </p>
        <StatusBadge label={decision} tone={decisionTone(decision)} />

        <div className="space-y-1 text-xs text-foreground-secondary">
          <p className="font-medium text-foreground">Decision ranges</p>
          {SCORECARD_DECISION_RANGES.map((range) => (
            <p key={range.decision}>
              {range.description}: {range.decision}
            </p>
          ))}
        </div>

        {scorecard.evaluatorName ? (
          <p className="text-xs text-foreground-secondary">
            Evaluator: {scorecard.evaluatorName}
            {scorecard.submittedAt
              ? ` · ${format(new Date(scorecard.submittedAt), "dd MMM yyyy")}`
              : ""}
          </p>
        ) : null}

        <Button asChild variant="secondary" size="sm">
          <Link href={`/monthly-reports/${reportId}`}>Open monthly report</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
