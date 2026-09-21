"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { DataTable } from "@/components/shared/data-table";
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
  TRAINING_TOPICS,
  canCreateActivities,
  getTrainings,
  type TrainingListItem,
  type TrainingQuery,
} from "@/lib/api";

export default function TrainingPage() {
  const { user } = useAuth();
  const canCreate = canCreateActivities(user) && user?.role !== "MD_VIEWER";
  const isTc = user?.role === "TERRITORY_COORDINATOR";

  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TrainingListItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const query: TrainingQuery = {
      page,
      pageSize: 10,
      search,
      topic: topic === "all" ? undefined : topic,
    };
    void getTrainings(query, user).then((result) => {
      if (!active) return;
      setRows(result.data);
      setTotal(result.total);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user, search, topic, page]);

  useEffect(() => {
    setPage(1);
  }, [search, topic]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training"
        description="Agent training sessions with attendance records."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/training/new">
                <Plus className="h-4 w-4" />
                Record session
              </Link>
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchPlaceholder="Search topic, district, outcome…"
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All topics</SelectItem>
              {TRAINING_TOPICS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          data={rows}
          getRowId={(row) => row.id}
          emptyTitle="No training sessions"
          emptyDescription="Record a session with attendees to get started."
          page={page}
          pageSize={10}
          total={total}
          onPageChange={setPage}
          columns={[
            { id: "date", header: "Date", cell: (row) => row.date },
            {
              id: "topic",
              header: "Topic",
              cell: (row) => (
                <div>
                  <Link
                    href={`/training/${row.id}`}
                    className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                  >
                    {row.topic}
                  </Link>
                  <p className="text-xs text-foreground-secondary">
                    {row.format}
                  </p>
                </div>
              ),
            },
            {
              id: "geo",
              header: "Location",
              cell: (row) => `${row.geo.district} · ${row.geo.sector}`,
            },
            ...(!isTc
              ? [
                  {
                    id: "tc",
                    header: "Coordinator",
                    cell: (row: TrainingListItem) => row.tcName,
                  },
                ]
              : []),
            {
              id: "agents",
              header: "Agents",
              align: "right" as const,
              cell: (row) => row.agentsTrained,
            },
          ]}
        />
      )}
    </div>
  );
}
