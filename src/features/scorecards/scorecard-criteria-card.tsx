import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { buildBreakdown } from "@/lib/api";
import type { ScorecardCriterionScore } from "@/types";

type BreakdownRow = ReturnType<typeof buildBreakdown>[number];

interface ScorecardCriteriaCardProps {
  rows: BreakdownRow[];
  editable: boolean;
  onChange: (
    criterionId: string,
    patch: Partial<ScorecardCriterionScore>,
  ) => void;
}

/** One criterion: score + comment inputs when editable, plain text otherwise. */
function CriterionRow({
  row,
  editable,
  onChange,
}: {
  row: BreakdownRow;
  editable: boolean;
  onChange: ScorecardCriteriaCardProps["onChange"];
}) {
  return (
    <div className="grid gap-3 rounded-[var(--radius-md)] border border-border p-4 lg:grid-cols-[minmax(0,1.2fr)_100px_minmax(0,1.5fr)_90px]">
      <div>
        <p className="font-medium">{row.label}</p>
        <p className="text-xs text-foreground-secondary">
          Weight {(row.weight * 100).toFixed(0)}%
        </p>
      </div>

      {editable ? (
        <div className="space-y-1">
          <Label htmlFor={`score-${row.id}`}>Score</Label>
          <Input
            id={`score-${row.id}`}
            type="number"
            min={1}
            max={5}
            step={1}
            value={row.score}
            onChange={(event) =>
              onChange(row.id, {
                score: Math.min(5, Math.max(1, Number(event.target.value) || 1)),
              })
            }
          />
        </div>
      ) : (
        <div>
          <p className="text-xs text-foreground-secondary">Score</p>
          <p className="text-lg font-semibold tabular-nums">{row.score}</p>
        </div>
      )}

      {editable ? (
        <div className="space-y-1">
          <Label htmlFor={`comment-${row.id}`}>Comment</Label>
          <Textarea
            id={`comment-${row.id}`}
            rows={2}
            maxLength={2000}
            value={row.comment}
            onChange={(event) => onChange(row.id, { comment: event.target.value })}
          />
        </div>
      ) : (
        <div>
          <p className="text-xs text-foreground-secondary">Comment</p>
          <p className="text-sm">{row.comment || "—"}</p>
        </div>
      )}

      <div className="text-right">
        <p className="text-xs text-foreground-secondary">Weighted</p>
        <p className="text-lg font-semibold tabular-nums">
          {row.weighted.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

/** Criteria list for the scorecard form (1–5 scores, weighted contribution). */
export function ScorecardCriteriaCard({
  rows,
  editable,
  onChange,
}: ScorecardCriteriaCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Criteria scores (1–5)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row) => (
          <CriterionRow
            key={row.id}
            row={row}
            editable={editable}
            onChange={onChange}
          />
        ))}
      </CardContent>
    </Card>
  );
}
