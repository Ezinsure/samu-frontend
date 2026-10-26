import { format } from "date-fns";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import type { TerritoryAssignment } from "@/lib/api";

const DATE_FORMAT = "dd MMM yyyy";

/** Coordinator assignment history for a district (newest first). */
export function TerritoryHistoryList({
  history,
}: {
  history: TerritoryAssignment[];
}) {
  if (history.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="No assignment history"
          description="Assign a coordinator to start the history log."
        />
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {history.map((entry) => (
        <div
          key={entry.id}
          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium">{entry.tcName}</p>
            <p className="text-xs text-foreground-secondary">
              Started {format(new Date(entry.startedAt), DATE_FORMAT)}
              {entry.endedAt
                ? ` · Ended ${format(new Date(entry.endedAt), DATE_FORMAT)}`
                : ""}
            </p>
          </div>
          <StatusBadge
            label={entry.active ? "Active" : "Closed"}
            tone={entry.active ? "success" : "neutral"}
            showIcon={false}
          />
        </div>
      ))}
    </div>
  );
}
