import Link from "next/link";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import type { AgentAssignment } from "@/lib/api";
import type { Visit } from "@/types";

function validationTone(validation: Visit["validation"]) {
  if (validation === "accepted") return "success" as const;
  if (validation === "flagged") return "warning" as const;
  return "danger" as const;
}

/** Recent visits for an agent (links to the visit detail page). */
export function AgentVisitsTab({ visits }: { visits: Visit[] }) {
  return (
    <DataTable
      data={visits}
      getRowId={(row) => row.id}
      emptyTitle="No visits yet"
      emptyDescription="Field visits for this agent will appear here."
      columns={[
        {
          id: "date",
          header: "Date",
          cell: (row) => (
            <Link
              href={`/visits/${row.id}`}
              className="font-medium text-primary-700 hover:underline dark:text-primary-300"
            >
              {new Date(row.startedAt).toLocaleString()}
            </Link>
          ),
        },
        { id: "purpose", header: "Purpose", cell: (row) => row.purpose },
        {
          id: "validation",
          header: "Validation",
          cell: (row) => (
            <StatusBadge
              label={row.validation}
              tone={validationTone(row.validation)}
            />
          ),
        },
        { id: "sms", header: "SMS", cell: (row) => row.confirmationStatus },
        {
          id: "distance",
          header: "Distance",
          align: "right",
          cell: (row) => `${row.distanceFromRegisteredMeters}m`,
        },
      ]}
    />
  );
}

/** Coordinator assignment history for an agent. */
export function AgentAssignmentsTab({
  assignments,
}: {
  assignments: AgentAssignment[];
}) {
  return (
    <DataTable
      data={assignments}
      getRowId={(row) => row.id}
      emptyTitle="No assignment history"
      emptyDescription="Assignment changes will be listed here."
      columns={[
        { id: "tc", header: "Coordinator", cell: (row) => row.tcName },
        {
          id: "started",
          header: "Started",
          cell: (row) => new Date(row.startedAt).toLocaleDateString(),
        },
        {
          id: "ended",
          header: "Ended",
          cell: (row) =>
            row.endedAt ? new Date(row.endedAt).toLocaleDateString() : "—",
        },
        {
          id: "active",
          header: "Status",
          cell: (row) => (
            <StatusBadge
              label={row.active ? "Active" : "Closed"}
              tone={row.active ? "success" : "neutral"}
            />
          ),
        },
      ]}
    />
  );
}
