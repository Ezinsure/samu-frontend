import Link from "next/link";
import { format } from "date-fns";
import type { DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  reportStatusLabel,
  reportStatusTone,
  type MonthlyReportListItem,
} from "@/lib/api";

/** Countdown badge for the deadline column. */
function DeadlineBadge({ row }: { row: MonthlyReportListItem }) {
  const closed = !["draft", "changes_requested"].includes(row.status);
  if (closed) return <span className="text-foreground-secondary">—</span>;

  const tone = row.overdue
    ? "danger"
    : row.daysToDeadline <= 7
      ? "warning"
      : "success";
  return (
    <StatusBadge
      label={row.overdue ? "Overdue" : `${row.daysToDeadline}d left`}
      tone={tone}
      showIcon={false}
    />
  );
}

/** Columns for the monthly reports table; TCs do not need the coordinator column. */
export function buildReportColumns(
  showCoordinator: boolean,
): DataTableColumn<MonthlyReportListItem>[] {
  return [
    {
      id: "period",
      header: "Period",
      cell: (row) => (
        <div>
          <Link
            href={`/monthly-reports/${row.id}`}
            className="font-medium text-primary-700 hover:underline dark:text-primary-300"
          >
            {row.period}
          </Link>
          <p className="text-xs text-foreground-secondary">
            Due {format(new Date(row.deadline), "dd MMM yyyy")}
          </p>
        </div>
      ),
    },
    ...(showCoordinator
      ? [
          {
            id: "tc",
            header: "Coordinator",
            cell: (row: MonthlyReportListItem) => row.tcName ?? "—",
          },
        ]
      : []),
    {
      id: "territory",
      header: "Territory",
      cell: (row) => row.territorySnapshot.join(", ") || "—",
    },
    {
      id: "kpi",
      header: "KPI met",
      cell: (row) => `${row.kpiProgressPercent}%`,
    },
    {
      id: "deadline",
      header: "Deadline",
      cell: (row) => <DeadlineBadge row={row} />,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge
          label={reportStatusLabel(row.status)}
          tone={reportStatusTone(row.status)}
          showIcon={false}
        />
      ),
    },
  ];
}
