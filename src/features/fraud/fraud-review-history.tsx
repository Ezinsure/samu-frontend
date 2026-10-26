import { format } from "date-fns";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FraudDetail } from "@/lib/api";

const ACTION_TONE = {
  accept: "success",
  escalate: "danger",
  dismiss: "neutral",
  note: "info",
} as const;

/** Newest-first list of review actions with reviewer and notes. */
export function FraudReviewHistory({ detail }: { detail: FraudDetail }) {
  const events = detail.reviewHistoryEnriched.slice().reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review history</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-foreground-secondary">
            No review actions yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {events.map((event) => (
              <div key={event.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={event.action}
                    tone={ACTION_TONE[event.action]}
                    showIcon={false}
                  />
                  <span className="font-medium">{event.byName}</span>
                  <span className="text-xs text-foreground-secondary">
                    {format(new Date(event.at), "dd MMM yyyy HH:mm")}
                  </span>
                </div>
                {event.notes ? (
                  <p className="mt-1 text-foreground-secondary">{event.notes}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
