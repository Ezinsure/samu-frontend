import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { agentStatusTone, complianceLabel, complianceTone } from "@/lib/api";
import type { AgentRow } from "@/lib/api";

interface AgentsTableProps {
  rows: AgentRow[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  showCoordinator: boolean;
  canEdit: boolean;
}

/** Paginated agent directory table. */
export function AgentsTable({
  rows,
  page,
  pageSize,
  total,
  onPageChange,
  showCoordinator,
  canEdit,
}: AgentsTableProps) {
  const columns: DataTableColumn<AgentRow>[] = [
    {
      id: "name",
      header: "Agent",
      cell: (row) => (
        <div>
          <Link
            href={`/agents/${row.id}`}
            className="cursor-pointer font-medium text-primary-600 hover:underline"
          >
            {row.name}
          </Link>
          <p className="text-xs text-foreground-muted">{row.code}</p>
        </div>
      ),
    },
    {
      id: "location",
      header: "Location",
      cell: (row) => (
        <div>
          <p>{row.geo.district}</p>
          <p className="text-xs text-foreground-muted">
            {row.geo.sector} · {row.geo.cell}
          </p>
        </div>
      ),
    },
    { id: "phone", header: "Phone", cell: (row) => row.phone },
    ...(showCoordinator
      ? [{ id: "tc", header: "Coordinator", cell: (row: AgentRow) => row.tcName }]
      : []),
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge label={row.status} tone={agentStatusTone(row.status)} />
      ),
    },
    {
      id: "compliance",
      header: "Visit status",
      cell: (row) => (
        <StatusBadge
          label={complianceLabel(row.compliance)}
          tone={complianceTone(row.compliance)}
        />
      ),
    },
    {
      id: "lastVisit",
      header: "Last visit",
      cell: (row) =>
        row.lastVisitAt ? new Date(row.lastVisitAt).toLocaleDateString() : "Never",
    },
    {
      id: "actions",
      header: "",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/agents/${row.id}`}>View</Link>
          </Button>
          {canEdit ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/agents/${row.id}/edit`}>Edit</Link>
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={rows}
      getRowId={(row) => row.id}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      emptyTitle="No agents found"
      emptyDescription="Try adjusting search or filters."
      columns={columns}
    />
  );
}
