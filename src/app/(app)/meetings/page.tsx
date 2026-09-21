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
  MEETING_TYPES,
  canCreateActivities,
  getMeetings,
  type MeetingListItem,
  type MeetingQuery,
} from "@/lib/api";

export default function MeetingsPage() {
  const { user } = useAuth();
  const canCreate = canCreateActivities(user) && user?.role !== "MD_VIEWER";
  const isTc = user?.role === "TERRITORY_COORDINATOR";

  const [search, setSearch] = useState("");
  const [meetingType, setMeetingType] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MeetingListItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const query: MeetingQuery = {
      page,
      pageSize: 10,
      search,
      meetingType: meetingType === "all" ? undefined : meetingType,
    };
    void getMeetings(query, user).then((result) => {
      if (!active) return;
      setRows(result.data);
      setTotal(result.total);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user, search, meetingType, page]);

  useEffect(() => {
    setPage(1);
  }, [search, meetingType]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings"
        description="Agent, partner, and Head Office meeting records."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/meetings/new">
                <Plus className="h-4 w-4" />
                New meeting
              </Link>
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchPlaceholder="Search location, agenda, decisions…"
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <Select value={meetingType} onValueChange={setMeetingType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {MEETING_TYPES.map((item) => (
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
          emptyTitle="No meetings"
          emptyDescription="Record a meeting to capture agenda and decisions."
          page={page}
          pageSize={10}
          total={total}
          onPageChange={setPage}
          columns={[
            { id: "date", header: "Date", cell: (row) => row.date },
            {
              id: "type",
              header: "Meeting",
              cell: (row) => (
                <div>
                  <Link
                    href={`/meetings/${row.id}`}
                    className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                  >
                    {row.meetingType}
                  </Link>
                  <p className="text-xs text-foreground-secondary">
                    {row.location}
                  </p>
                </div>
              ),
            },
            ...(!isTc
              ? [
                  {
                    id: "tc",
                    header: "Coordinator",
                    cell: (row: MeetingListItem) => row.tcName,
                  },
                ]
              : []),
            {
              id: "participants",
              header: "Participants",
              align: "right" as const,
              cell: (row) => row.participantCount,
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
