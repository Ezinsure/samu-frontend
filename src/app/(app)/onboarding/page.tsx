"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
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
import {
  canManageCoap,
  getOnboardingCases,
  onboardingStatusTone,
  type OnboardingListItem,
} from "@/lib/api";
import {
  ONBOARDING_STATUS_LABELS,
  serviceLineLabel,
} from "@/lib/coap/catalog";
import { ServiceSelect } from "@/features/coap/service-select";
import { MobileQuickActions } from "@/features/coap/mobile-quick-actions";
import type { OnboardingStatus, ServiceLine } from "@/types";

export default function OnboardingPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const canWrite = canManageCoap(user) && user?.role !== "MD_VIEWER";
  const initialService =
    (searchParams.get("service") as ServiceLine | null) ?? "all";

  const [search, setSearch] = useState("");
  const [service, setService] = useState<ServiceLine | "all">(initialService);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OnboardingListItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => setService(initialService), [initialService]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getOnboardingCases(
      {
        page,
        pageSize: 10,
        search,
        serviceLine: service === "all" ? undefined : service,
        status: status === "all" ? undefined : (status as OnboardingStatus),
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
  }, [user, search, service, status, page]);

  useEffect(() => setPage(1), [search, service, status]);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <PageHeader
        title="Onboarding"
        description="Help customers and agents register, activate, and complete service onboarding."
        actions={
          canWrite ? (
            <Button asChild>
              <Link href="/onboarding/new">
                <Plus className="h-4 w-4" />
                New case
              </Link>
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customer, phone, stage…"
        filters={
          <>
            <ServiceSelect value={service} onChange={setService} allowAll />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(ONBOARDING_STATUS_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
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
          emptyTitle="No onboarding cases"
          emptyDescription="Start onboarding from a qualified lead or create a case directly."
          page={page}
          pageSize={10}
          total={total}
          onPageChange={setPage}
          columns={[
            {
              id: "customer",
              header: "Customer",
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.customerName}</p>
                  <p className="text-xs text-foreground-muted">
                    {row.customerPhone}
                  </p>
                </div>
              ),
            },
            {
              id: "service",
              header: "Service",
              cell: (row) => serviceLineLabel(row.serviceLine),
            },
            {
              id: "stage",
              header: "Stage",
              cell: (row) => row.stageLabel,
            },
            {
              id: "status",
              header: "Status",
              cell: (row) => (
                <StatusBadge
                  label={ONBOARDING_STATUS_LABELS[row.status]}
                  tone={onboardingStatusTone(row.status)}
                />
              ),
            },
            {
              id: "actions",
              header: "",
              cell: (row) => (
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/onboarding/${row.id}`}>Open</Link>
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
