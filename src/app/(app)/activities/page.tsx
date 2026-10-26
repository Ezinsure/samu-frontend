"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCoap, getFieldActivities, type ActivityListItem } from "@/lib/api";
import {
  ACTIVITY_TYPE_LABELS,
  serviceLineLabel,
} from "@/lib/coap/catalog";
import { ServiceSelect } from "@/features/coap/service-select";
import { MobileQuickActions } from "@/features/coap/mobile-quick-actions";
import type { FieldActivityType, ServiceLine } from "@/types";

export default function ActivitiesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const canWrite = canManageCoap(user) && user?.role !== "MD_VIEWER";
  const initialService =
    (searchParams.get("service") as ServiceLine | null) ?? "all";

  const [search, setSearch] = useState("");
  const [service, setService] = useState<ServiceLine | "all">(initialService);
  const [activityType, setActivityType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ActivityListItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setService(initialService);
  }, [initialService]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getFieldActivities(
      {
        page,
        pageSize: 10,
        search,
        serviceLine: service === "all" ? undefined : service,
        activityType:
          activityType === "all"
            ? undefined
            : (activityType as FieldActivityType),
      },
      user,
    ).then((result) => {
      if (!active) return;
      setRows(result.data);
      setTotal(result.total);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user, search, service, activityType, page]);

  useEffect(() => {
    setPage(1);
  }, [search, service, activityType]);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <PageHeader
        title="Field activities"
        description="Log education, demos, mobilization, support, and local campaigns by service line."
        actions={
          canWrite ? (
            <Button asChild>
              <Link href="/activities/new">
                <Plus className="h-4 w-4" />
                Log activity
              </Link>
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search venue, summary, district…"
        filters={
          <>
            <ServiceSelect value={service} onChange={setService} allowAll />
            <Select value={activityType} onValueChange={setActivityType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      {loading ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <DataTable
          data={rows}
          getRowId={(row) => row.id}
          emptyTitle="No activities yet"
          emptyDescription="Log an education session or community mobilization for any service line."
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
              id: "type",
              header: "Type",
              cell: (row) => ACTIVITY_TYPE_LABELS[row.activityType],
            },
            {
              id: "service",
              header: "Service",
              cell: (row) => serviceLineLabel(row.serviceLine),
            },
            {
              id: "venue",
              header: "Venue",
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.venue}</p>
                  <p className="text-xs text-foreground-muted">
                    {row.geo.district} · {row.peopleReached} reached
                  </p>
                </div>
              ),
            },
            {
              id: "actions",
              header: "",
              cell: (row) => (
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/activities/${row.id}`}>Open</Link>
                </Button>
              ),
            },
          ]}
        />
      )}

      <MobileQuickActions />
    </div>
  );
}
