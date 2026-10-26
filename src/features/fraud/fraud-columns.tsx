import Link from "next/link";
import { format } from "date-fns";
import type { DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  fraudStatusLabel,
  fraudStatusTone,
  severityTone,
  type FraudListItem,
} from "@/lib/api";

export const FRAUD_COLUMNS: DataTableColumn<FraudListItem>[] = [
  {
    id: "flag",
    header: "Flag",
    cell: (row) => (
      <div>
        <Link
          href={`/fraud/${row.id}`}
          className="font-medium text-primary-700 hover:underline dark:text-primary-300"
        >
          {row.type}
        </Link>
        <p className="text-xs text-foreground-secondary">
          {format(new Date(row.detectedAt), "dd MMM yyyy HH:mm")}
        </p>
      </div>
    ),
  },
  {
    id: "agent",
    header: "Agent / visit",
    cell: (row) => (
      <div>
        <p className="font-medium">{row.agentName}</p>
        <p className="text-xs text-foreground-secondary">
          {row.visitPurpose} · {row.distanceFromRegisteredMeters}m GPS
        </p>
      </div>
    ),
  },
  { id: "tc", header: "Coordinator", cell: (row) => row.tcName },
  {
    id: "severity",
    header: "Severity",
    cell: (row) => (
      <StatusBadge
        label={row.severity}
        tone={severityTone(row.severity)}
        showIcon={false}
      />
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => (
      <StatusBadge
        label={fraudStatusLabel(row.status)}
        tone={fraudStatusTone(row.status)}
        showIcon={false}
      />
    ),
  },
];
