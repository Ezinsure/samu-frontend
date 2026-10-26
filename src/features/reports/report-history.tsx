import { format } from "date-fns";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  reportStatusLabel,
  reportStatusTone,
  type MonthlyReportWorkspace,
} from "@/lib/api";

/** Newest-first audit trail of saves, submissions and review requests. */
export function ReportHistory({
  events,
}: {
  events: MonthlyReportWorkspace["historyEnriched"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission history</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-foreground-secondary">No history yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {events.map((event) => (
              <div key={event.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={event.action.replaceAll("_", " ")}
                    tone="info"
                    showIcon={false}
                  />
                  <span className="font-medium">{event.byName}</span>
                  <span className="text-xs text-foreground-secondary">
                    {format(new Date(event.at), "dd MMM yyyy HH:mm")}
                  </span>
                  <StatusBadge
                    label={reportStatusLabel(event.status)}
                    tone={reportStatusTone(event.status)}
                    showIcon={false}
                  />
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
