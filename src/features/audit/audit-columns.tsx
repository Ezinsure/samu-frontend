import { format } from "date-fns";
import type { DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import type { AuditLogItem } from "@/lib/api";

export const AUDIT_COLUMNS: DataTableColumn<AuditLogItem>[] = [
  {
    id: "time",
    header: "When",
    cell: (row) => (
      <span className="whitespace-nowrap text-sm">
        {format(new Date(row.timestamp), "dd MMM yyyy HH:mm")}
      </span>
    ),
  },
  {
    id: "actor",
    header: "Actor",
    cell: (row) => row.actorName ?? "System",
  },
  {
    id: "action",
    header: "Action",
    cell: (row) => (
      <StatusBadge label={row.action} tone="info" showIcon={false} />
    ),
  },
  {
    id: "object",
    header: "Object",
    cell: (row) => (
      <div>
        <p className="text-sm">{row.objectType}</p>
        <p className="max-w-[200px] truncate text-xs text-foreground-secondary">
          {row.objectId}
        </p>
      </div>
    ),
  },
  { id: "summary", header: "Summary", cell: (row) => row.summary },
];
