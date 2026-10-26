import Link from "next/link";
import type { DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { decisionTone, type ScorecardListItem } from "@/lib/api";

/** Columns for the scorecards table; TCs do not need the coordinator column. */
export function buildScorecardColumns(
  showCoordinator: boolean,
): DataTableColumn<ScorecardListItem>[] {
  return [
    {
      id: "period",
      header: "Period",
      cell: (row) => (
        <div>
          <Link
            href={`/scorecards/${row.id}`}
            className="font-medium text-primary-700 hover:underline dark:text-primary-300"
          >
            {row.period}
          </Link>
          <p className="text-xs text-foreground-secondary">
            Template {row.templateVersion}
          </p>
        </div>
      ),
    },
    ...(showCoordinator
      ? [
          {
            id: "tc",
            header: "Coordinator",
            cell: (row: ScorecardListItem) => row.tcName ?? "—",
          },
        ]
      : []),
    {
      id: "total",
      header: "Weighted total",
      cell: (row) => (
        <span className="font-semibold tabular-nums">
          {row.weightedTotal.toFixed(2)} / 5
        </span>
      ),
    },
    {
      id: "decision",
      header: "Decision",
      cell: (row) =>
        row.decision ? (
          <StatusBadge
            label={row.decision}
            tone={decisionTone(row.decision)}
            showIcon={false}
          />
        ) : (
          <span className="text-foreground-secondary">—</span>
        ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge
          label={row.status === "draft" ? "Draft" : "Submitted"}
          tone={row.status === "draft" ? "neutral" : "success"}
          showIcon={false}
        />
      ),
    },
  ];
}
