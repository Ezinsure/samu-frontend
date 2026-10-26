import { FormField } from "@/components/shared/form-field";
import { Textarea } from "@/components/ui/textarea";
import { PhotoEvidenceField } from "./photo-evidence-field";
import type { DraftChange, VisitDraft } from "./types";

interface EvidenceStepProps {
  draft: VisitDraft;
  onChange: DraftChange;
}

/** Step 4: what happened, plus photo evidence. */
export function EvidenceStep({ draft, onChange }: EvidenceStepProps) {
  return (
    <>
      <FormField label="Activities performed" htmlFor="activities">
        <Textarea
          id="activities"
          value={draft.activities}
          onChange={(event) => onChange({ activities: event.target.value })}
          placeholder="What did you do during the visit?"
        />
      </FormField>
      <FormField label="Outcome" htmlFor="outcome">
        <Textarea
          id="outcome"
          value={draft.outcome}
          onChange={(event) => onChange({ outcome: event.target.value })}
          placeholder="What changed or was agreed?"
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Challenges" htmlFor="challenges">
          <Textarea
            id="challenges"
            value={draft.challenges}
            onChange={(event) => onChange({ challenges: event.target.value })}
          />
        </FormField>
        <FormField label="Support needed" htmlFor="support">
          <Textarea
            id="support"
            value={draft.supportNeeded}
            onChange={(event) => onChange({ supportNeeded: event.target.value })}
          />
        </FormField>
      </div>
      <PhotoEvidenceField
        photos={draft.photos}
        onChange={(photos) => onChange({ photos })}
      />
    </>
  );
}
