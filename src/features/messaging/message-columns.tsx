import { format } from "date-fns";
import type { DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  messageStatusLabel,
  messageStatusTone,
  type OutboxMessage,
} from "@/lib/api";

export const MESSAGE_COLUMNS: DataTableColumn<OutboxMessage>[] = [
  {
    id: "time",
    header: "When",
    cell: (row) => (
      <span className="whitespace-nowrap text-sm">
        {format(new Date(row.createdAt), "dd MMM yyyy HH:mm")}
      </span>
    ),
  },
  { id: "to", header: "To", cell: (row) => row.toPhone },
  {
    id: "message",
    header: "Message",
    cell: (row) => (
      <div>
        <p className="max-w-md truncate text-sm">{row.body}</p>
        <p className="text-xs text-foreground-secondary">
          {row.templateId ?? "Custom"}
        </p>
      </div>
    ),
  },
  { id: "by", header: "Sent by", cell: (row) => row.createdByName ?? "—" },
  {
    id: "status",
    header: "Status",
    cell: (row) => (
      <StatusBadge
        label={messageStatusLabel(row.status)}
        tone={messageStatusTone(row.status)}
        showIcon={false}
      />
    ),
  },
];
