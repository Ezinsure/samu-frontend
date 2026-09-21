"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canManageAgents,
  complianceLabel,
  complianceTone,
  getAgentFilterOptions,
  getAgents,
  type AgentQuery,
} from "@/lib/api";
import type { Agent } from "@/types";

type AgentRow = Agent & { tcName: string };

export default function AgentsPage() {
  const { user } = useAuth();
  const canManage = canManageAgents(user);
  const isMd = user?.role === "MD_VIEWER";
  const isTc = user?.role === "TERRITORY_COORDINATOR";

  const [search, setSearch] = useState("");
  const [province, setProvince] = useState<string>("all");
  const [district, setDistrict] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [compliance, setCompliance] = useState<string>("all");
  const [tcUserId, setTcUserId] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AgentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [options, setOptions] = useState<{
    provinces: string[];
    districts: string[];
    statuses: string[];
    coordinators: Array<{ id: string; name: string }>;
  } | null>(null);

  useEffect(() => {
    void getAgentFilterOptions(user).then(setOptions);
  }, [user]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const query: AgentQuery = {
      page,
      pageSize: 10,
      search,
      province: province === "all" ? undefined : province,
      district: district === "all" ? undefined : district,
      status: status === "all" ? undefined : status,
      compliance: compliance === "all" ? undefined : compliance,
      tcUserId: tcUserId === "all" ? undefined : tcUserId,
      sortBy: "name",
    };
    void getAgents(query, user).then((result) => {
      if (!active) return;
      setRows(result.data);
      setTotal(result.total);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user, search, province, district, status, compliance, tcUserId, page]);

  useEffect(() => {
    setPage(1);
  }, [search, province, district, status, compliance, tcUserId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent network"
        description={
          isTc
            ? "Agents assigned to your territory."
            : "Search, filter, and manage Solektra field agents."
        }
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                toast.success("Export queued", {
                  description: "Agent directory export will be ready shortly (demo).",
                })
              }
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            {canManage ? (
              <Button asChild>
                <Link href="/agents/new">
                  <Plus className="h-4 w-4" />
                  New agent
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, code, phone…"
        filters={
          options ? (
            <>
              <Select
                value={province}
                onValueChange={(value) => {
                  setProvince(value);
                  setDistrict("all");
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All provinces</SelectItem>
                  {options.provinces.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All districts</SelectItem>
                  {options.districts.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {options.statuses.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={compliance} onValueChange={setCompliance}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Compliance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All compliance</SelectItem>
                  <SelectItem value="green">Compliant</SelectItem>
                  <SelectItem value="yellow">Due soon</SelectItem>
                  <SelectItem value="red">Overdue</SelectItem>
                </SelectContent>
              </Select>
              {!isTc ? (
                <Select value={tcUserId} onValueChange={setTcUserId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Coordinator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All coordinators</SelectItem>
                    {options.coordinators.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </>
          ) : (
            <Skeleton className="h-11 w-40" />
          )
        }
      />

      {loading ? (
        <Skeleton className="h-80 w-full" />
      ) : (
        <DataTable
          data={rows}
          getRowId={(row) => row.id}
          page={page}
          pageSize={10}
          total={total}
          onPageChange={setPage}
          emptyTitle="No agents found"
          emptyDescription="Try adjusting search or filters."
          columns={[
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
            {
              id: "phone",
              header: "Phone",
              cell: (row) => row.phone,
            },
            ...(!isTc
              ? [
                  {
                    id: "tc",
                    header: "Coordinator",
                    cell: (row: AgentRow) => row.tcName,
                  },
                ]
              : []),
            {
              id: "status",
              header: "Status",
              cell: (row) => (
                <StatusBadge
                  label={row.status}
                  tone={
                    row.status === "Active"
                      ? "success"
                      : row.status === "Inactive"
                        ? "inactive"
                        : row.status === "Suspended"
                          ? "danger"
                          : "warning"
                  }
                />
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
                row.lastVisitAt
                  ? new Date(row.lastVisitAt).toLocaleDateString()
                  : "Never",
            },
            {
              id: "actions",
              header: "",
              cell: (row) => (
                <div className="flex justify-end gap-1">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/agents/${row.id}`}>View</Link>
                  </Button>
                  {canManage && !isMd ? (
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/agents/${row.id}/edit`}>Edit</Link>
                    </Button>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
