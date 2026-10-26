import Link from "next/link";
import { format } from "date-fns";
import type { DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import type { VisitListItem } from "@/lib/api";
import {
  confirmationLabel,
  confirmationTone,
  validationLabel,
  validationTone,
} from "@/lib/visits/presentation";

/** Table columns for the visits list; the coordinator column is hidden for TCs. */
export function buildVisitColumns(
  showCoordinator: boolean,
): DataTableColumn<VisitListItem>[] {
  return [
    {
      id: "when",
      header: "When",
      cell: (row) => (
        <div>
          <p className="font-medium">
            {format(new Date(row.startedAt), "dd MMM yyyy")}
          </p>
          <p className="text-xs text-foreground-secondary">
            {format(new Date(row.startedAt), "HH:mm")} · {row.durationMinutes}{" "}
            min
          </p>
        </div>
      ),
    },
    {
      id: "agent",
      header: "Agent",
      cell: (row) => (
        <div>
          <Link
            href={`/visits/${row.id}`}
            className="font-medium text-primary-700 hover:underline dark:text-primary-300"
          >
            {row.agentName}
          </Link>
          <p className="text-xs text-foreground-secondary">
            {row.agentCode} · {row.agentDistrict}
          </p>
        </div>
      ),
    },
    { id: "purpose", header: "Purpose", cell: (row) => row.purpose },
    ...(showCoordinator
      ? [{ id: "tc", header: "Coordinator", cell: (row: VisitListItem) => row.tcName }]
      : []),
    {
      id: "gps",
      header: "GPS",
      cell: (row) => (
        <span className="tabular-nums text-foreground-secondary">
          {row.distanceFromRegisteredMeters}m
        </span>
      ),
    },
    {
      id: "validation",
      header: "Validation",
      cell: (row) => (
        <StatusBadge
          label={validationLabel(row.validation)}
          tone={validationTone(row.validation)}
          showIcon={false}
        />
      ),
    },
    {
      id: "sms",
      header: "SMS",
      cell: (row) => (
        <StatusBadge
          label={confirmationLabel(row.confirmationStatus)}
          tone={confirmationTone(row.confirmationStatus)}
          showIcon={false}
        />
      ),
    },
  ];
}
