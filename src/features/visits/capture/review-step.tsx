import { validationLabel } from "@/lib/visits/presentation";
import type { VisitValidation } from "@/types";

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border pb-2 last:border-0 sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-foreground-secondary">{label}</span>
      <span className="font-medium sm:text-right">{value}</span>
    </div>
  );
}

interface ReviewStepProps {
  agentName: string;
  purpose: string;
  distance: number | null;
  validation: VisitValidation | null;
  photoCount: number;
  activities: string;
  outcome: string;
  thresholdMeters: number;
}

/** Step 5: read-only summary before submitting. */
export function ReviewStep({
  agentName,
  purpose,
  distance,
  validation,
  photoCount,
  activities,
  outcome,
  thresholdMeters,
}: ReviewStepProps) {
  return (
    <div className="space-y-3 text-sm">
      <ReviewRow label="Agent" value={agentName} />
      <ReviewRow label="Purpose" value={purpose} />
      <ReviewRow
        label="GPS distance (preview)"
        value={distance != null ? `${Math.round(distance)}m` : "—"}
      />
      <ReviewRow
        label="Validation (preview)"
        value={validation ? validationLabel(validation) : "—"}
      />
      <ReviewRow label="Photos" value={`${photoCount} uploaded`} />
      <ReviewRow label="Activities" value={activities} />
      <ReviewRow label="Outcome" value={outcome} />
      <p className="rounded-[var(--radius-md)] border border-border bg-background p-3 text-xs text-foreground-secondary">
        Submitting stores the visit, updates the agent&apos;s last visit and
        checklist snapshot, queues an SMS confirmation, and opens a fraud flag
        if the server-checked GPS distance exceeds the {thresholdMeters}m
        threshold.
      </p>
    </div>
  );
}
