import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { NARRATIVE_PROMPTS } from "@/lib/api";
import type { MonthlyReportNarrative } from "@/types";

interface ReportNarrativeTabProps {
  narrative: MonthlyReportNarrative;
  /** When false the sections render as read-only text. */
  editable: boolean;
  onChange: (key: keyof MonthlyReportNarrative, value: string) => void;
}

/** Narrative sections G1–G7: editable for the owning TC, read-only otherwise. */
export function ReportNarrativeTab({
  narrative,
  editable,
  onChange,
}: ReportNarrativeTabProps) {
  return (
    <div className="space-y-4">
      {NARRATIVE_PROMPTS.map((prompt) => (
        <Card key={prompt.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{prompt.label}</CardTitle>
            <p className="text-xs text-foreground-secondary">{prompt.hint}</p>
          </CardHeader>
          <CardContent>
            {editable ? (
              <Textarea
                value={narrative[prompt.key]}
                maxLength={4000}
                rows={3}
                onChange={(event) => onChange(prompt.key, event.target.value)}
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm">
                {narrative[prompt.key] || "—"}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
