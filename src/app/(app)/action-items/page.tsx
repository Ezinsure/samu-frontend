"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  actionPriorityTone,
  actionStatusTone,
  canManageActionItems,
  getActionItems,
  updateActionItemStatus,
  type ActionListItem,
  type ActionQuery,
} from "@/lib/api";
import type { ActionItem } from "@/types";

export default function ActionItemsPage() {
  const { user } = useAuth();
  const canManage = canManageActionItems(user) && user?.role !== "MD_VIEWER";
  const isTc = user?.role === "TERRITORY_COORDINATOR";

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sourceType, setSourceType] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ActionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({ open: 0, inProgress: 0, done: 0 });

  useEffect(() => {
    void getActionItems({ page: 1, pageSize: 100 }, user).then((result) => {
      setStats({
        open: result.data.filter((item) => item.status === "open").length,
        inProgress: result.data.filter((item) => item.status === "in_progress")
          .length,
        done: result.data.filter((item) => item.status === "done").length,
      });
    });
  }, [user, refreshKey]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const query: ActionQuery = {
      page,
      pageSize: 10,
      search,
      status: status === "all" ? undefined : status,
      priority: priority === "all" ? undefined : priority,
      sourceType: sourceType === "all" ? undefined : sourceType,
    };
    void getActionItems(query, user).then((result) => {
      if (!active) return;
      setRows(result.data);
      setTotal(result.total);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user, search, status, priority, sourceType, page, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [search, status, priority, sourceType]);

  async function setItemStatus(id: string, next: ActionItem["status"]) {
    if (!user) return;
    const result = await updateActionItemStatus(id, next, user);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Action marked ${next.replace("_", " ")}`);
    setRefreshKey((value) => value + 1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Action items"
        description="Consolidated follow-ups from visits, sensitization, training, and meetings."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Open", value: stats.open },
          { label: "In progress", value: stats.inProgress },
          { label: "Done", value: stats.done },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-secondary">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <FilterBar
        searchPlaceholder="Search title, owner, source…"
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceType} onValueChange={setSourceType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="visit">Visit</SelectItem>
                <SelectItem value="sensitization">Sensitization</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="report">Report</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          data={rows}
          getRowId={(row) => row.id}
          emptyTitle="No action items"
          emptyDescription="Follow-ups created from activities will appear here."
          page={page}
          pageSize={10}
          total={total}
          onPageChange={setPage}
          columns={[
            {
              id: "title",
              header: "Action",
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.title}</p>
                  <p className="text-xs text-foreground-secondary line-clamp-1">
                    {row.description}
                  </p>
                </div>
              ),
            },
            {
              id: "source",
              header: "Source",
              cell: (row) => (
                <Link
                  href={row.sourceHref}
                  className="text-sm text-primary-700 hover:underline dark:text-primary-300"
                >
                  {row.sourceType}
                </Link>
              ),
            },
            ...(!isTc
              ? [
                  {
                    id: "owner",
                    header: "Owner",
                    cell: (row: ActionListItem) => row.ownerName,
                  },
                ]
              : []),
            {
              id: "due",
              header: "Due",
              cell: (row) => row.dueDate,
            },
            {
              id: "priority",
              header: "Priority",
              cell: (row) => (
                <StatusBadge
                  label={row.priority}
                  tone={actionPriorityTone(row.priority)}
                  showIcon={false}
                />
              ),
            },
            {
              id: "status",
              header: "Status",
              cell: (row) => (
                <div className="flex flex-col gap-2">
                  <StatusBadge
                    label={row.status.replace("_", " ")}
                    tone={actionStatusTone(row.status)}
                    showIcon={false}
                  />
                  {canManage && row.status !== "done" ? (
                    <div className="flex flex-wrap gap-1">
                      {row.status === "open" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            void setItemStatus(row.id, "in_progress")
                          }
                        >
                          Start
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void setItemStatus(row.id, "done")}
                      >
                        Done
                      </Button>
                    </div>
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
