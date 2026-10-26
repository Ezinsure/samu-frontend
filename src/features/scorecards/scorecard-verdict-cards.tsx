import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SCORECARD_DECISION_RANGES, decisionTone } from "@/lib/api";
import type { ScorecardDecision } from "@/types";

interface ScorecardVerdictCardsProps {
  editable: boolean;
  overallComment: string;
  onCommentChange: (value: string) => void;
  /** Decision currently shown (chosen or suggested). */
  decision: ScorecardDecision;
  suggestion: ScorecardDecision;
  onDecisionChange: (value: ScorecardDecision) => void;
}

/** Overall comment and final decision (editable for evaluators). */
export function ScorecardVerdictCards({
  editable,
  overallComment,
  onCommentChange,
  decision,
  suggestion,
  onDecisionChange,
}: ScorecardVerdictCardsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Overall comments</CardTitle>
        </CardHeader>
        <CardContent>
          {editable ? (
            <Textarea
              rows={5}
              maxLength={4000}
              value={overallComment}
              onChange={(event) => onCommentChange(event.target.value)}
              placeholder="Summary for the coordinator and leadership…"
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm">{overallComment || "—"}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {editable ? (
            <>
              <Select
                value={decision}
                onValueChange={(value) =>
                  onDecisionChange(value as ScorecardDecision)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCORECARD_DECISION_RANGES.map((range) => (
                    <SelectItem key={range.decision} value={range.decision}>
                      {range.decision} ({range.description})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-foreground-secondary">
                Suggested from live total: {suggestion}
              </p>
            </>
          ) : (
            <StatusBadge label={decision} tone={decisionTone(decision)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
