"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { format } from "date-fns";
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
  canCaptureVisits,
  confirmationLabel,
  confirmationTone,
  getVisitFilterOptions,
  getVisits,
  validationLabel,
  validationTone,
  type VisitListItem,
  type VisitQuery,
} from "@/lib/api";

export default function VisitsPage() {
  const { user } = useAuth();
  const canCapture = canCaptureVisits(user);
  const isTc = user?.role === "TERRITORY_COORDINATOR";
  const isMd = user?.role === "MD_VIEWER";

  const [search, setSearch] = useState("");
  const [validation, setValidation] = useState("all");
  const [confirmation, setConfirmation] = useState("all");
  const [purpose, setPurpose] = useState("all");
  const [tcUserId, setTcUserId] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<VisitListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [options, setOptions] = useState<{
    coordinators: Array<{ id: string; name: string }>;
    purposes: string[];
  } | null>(null);

  useEffect(() => {
    void getVisitFilterOptions(user).then((result) =>
      setOptions({
        coordinators: result.coordinators,
        purposes: result.purposes,
      }),
    );
  }, [user]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const query: VisitQuery = {
      page,
      pageSize: 10,
      search,
      validation: validation === "all" ? undefined : validation,
      confirmation: confirmation === "all" ? undefined : confirmation,
      purpose: purpose === "all" ? undefined : purpose,
      tcUserId: tcUserId === "all" ? undefined : tcUserId,
    };
    void getVisits(query, user).then((result) => {
      if (!active) return;
      setRows(result.data);
      setTotal(result.total);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user, search, validation, confirmation, purpose, tcUserId, page]);

  useEffect(() => {
    setPage(1);
  }, [search, validation, confirmation, purpose, tcUserId]);

  const columns = [
    {
      id: "when",
      header: "When",
      cell: (row: VisitListItem) => (
        <div>
          <p className="font-medium">
            {format(new Date(row.startedAt), "dd MMM yyyy")}
          </p>
          <p className="text-xs text-foreground-secondary">
            {format(new Date(row.startedAt), "HH:mm")} · {row.durationMinutes}{" "}
            min
          </p>
        </div>
      ),
    },
    {
      id: "agent",
      header: "Agent",
      cell: (row: VisitListItem) => (
        <div>
          <Link
            href={`/visits/${row.id}`}
            className="font-medium text-primary-700 hover:underline dark:text-primary-300"
          >
            {row.agentName}
          </Link>
          <p className="text-xs text-foreground-secondary">
            {row.agentCode} · {row.agentDistrict}
          </p>
        </div>
      ),
    },
    {
      id: "purpose",
      header: "Purpose",
      cell: (row: VisitListItem) => row.purpose,
    },
    ...(!isTc
      ? [
          {
            id: "tc",
            header: "Coordinator",
            cell: (row: VisitListItem) => row.tcName,
          },
        ]
      : []),
    {
      id: "gps",
      header: "GPS",
      cell: (row: VisitListItem) => (
        <span className="tabular-nums text-foreground-secondary">
          {row.distanceFromRegisteredMeters}m
        </span>
      ),
    },
    {
      id: "validation",
      header: "Validation",
      cell: (row: VisitListItem) => (
        <StatusBadge
          label={validationLabel(row.validation)}
          tone={validationTone(row.validation)}
          showIcon={false}
        />
      ),
    },
    {
      id: "sms",
      header: "SMS",
      cell: (row: VisitListItem) => (
        <StatusBadge
          label={confirmationLabel(row.confirmationStatus)}
          tone={confirmationTone(row.confirmationStatus)}
          showIcon={false}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field visits"
        description={
          isTc
            ? "Capture and review visits for agents in your territory."
            : "Verified field visit history with GPS validation and SMS confirmation."
        }
        actions={
          canCapture && !isMd ? (
            <Button asChild>
              <Link href="/visits/new">
                <Plus className="h-4 w-4" />
                Capture visit
              </Link>
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchPlaceholder="Search agent, purpose, district…"
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <>
            <Select value={validation} onValueChange={setValidation}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Validation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All validation</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={confirmation} onValueChange={setConfirmation}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="SMS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SMS status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="delivery_failed">Delivery failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All purposes</SelectItem>
                {(options?.purposes ?? []).map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isTc ? (
              <Select value={tcUserId} onValueChange={setTcUserId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Coordinator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All coordinators</SelectItem>
                  {(options?.coordinators ?? []).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </>
        }
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          data={rows}
          getRowId={(row) => row.id}
          emptyTitle="No visits found"
          emptyDescription="Adjust filters or capture a new field visit."
          page={page}
          pageSize={10}
          total={total}
          onPageChange={setPage}
          columns={columns}
        />
      )}
    </div>
  );
}
