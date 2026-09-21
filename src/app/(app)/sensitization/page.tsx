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
  SENSITIZATION_EVENT_TYPES,
  canCreateActivities,
  getSensitizations,
  type SensitizationListItem,
  type SensitizationQuery,
} from "@/lib/api";

export default function SensitizationPage() {
  const { user } = useAuth();
  const canCreate = canCreateActivities(user) && user?.role !== "MD_VIEWER";
  const isTc = user?.role === "TERRITORY_COORDINATOR";

  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SensitizationListItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const query: SensitizationQuery = {
      page,
      pageSize: 10,
      search,
      eventType: eventType === "all" ? undefined : eventType,
    };
    void getSensitizations(query, user).then((result) => {
      if (!active) return;
      setRows(result.data);
      setTotal(result.total);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user, search, eventType, page]);

  useEffect(() => {
    setPage(1);
  }, [search, eventType]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sensitization"
        description="Community awareness events separate from agent visits."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/sensitization/new">
                <Plus className="h-4 w-4" />
                New event
              </Link>
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchPlaceholder="Search venue, district, outcome…"
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {SENSITIZATION_EVENT_TYPES.map((item) => (
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
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          data={rows}
          getRowId={(row) => row.id}
          emptyTitle="No sensitization events"
          emptyDescription="Record a community awareness event to get started."
          page={page}
          pageSize={10}
          total={total}
          onPageChange={setPage}
          columns={[
            {
              id: "date",
              header: "Date",
              cell: (row) => row.date,
            },
            {
              id: "event",
              header: "Event",
              cell: (row) => (
                <div>
                  <Link
                    href={`/sensitization/${row.id}`}
                    className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                  >
                    {row.eventType}
                  </Link>
                  <p className="text-xs text-foreground-secondary">
                    {row.venue}
                  </p>
                </div>
              ),
            },
            {
              id: "geo",
              header: "Location",
              cell: (row) =>
                `${row.geo.district} · ${row.geo.sector}`,
            },
            ...(!isTc
              ? [
                  {
                    id: "tc",
                    header: "Coordinator",
                    cell: (row: SensitizationListItem) => row.tcName,
                  },
                ]
              : []),
            {
              id: "reached",
              header: "Reached",
              align: "right" as const,
              cell: (row) => row.peopleReached,
            },
            {
              id: "actions",
              header: "Actions",
              align: "right" as const,
              cell: (row) => row.actionCount,
            },
          ]}
        />
      )}
    </div>
  );
}
