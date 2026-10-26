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
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCoap, getSales, type SaleListItem } from "@/lib/api";
import { serviceLineLabel } from "@/lib/coap/catalog";
import { ServiceSelect } from "@/features/coap/service-select";
import { MobileQuickActions } from "@/features/coap/mobile-quick-actions";
import type { ServiceLine } from "@/types";

export default function SalesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const canWrite = canManageCoap(user) && user?.role !== "MD_VIEWER";
  const initialService =
    (searchParams.get("service") as ServiceLine | null) ?? "all";

  const [search, setSearch] = useState("");
  const [service, setService] = useState<ServiceLine | "all">(initialService);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SaleListItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => setService(initialService), [initialService]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getSales(
      {
        page,
        pageSize: 10,
        search,
        serviceLine: service === "all" ? undefined : service,
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
  }, [user, search, service, page]);

  useEffect(() => setPage(1), [search, service]);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <PageHeader
        title="Sales"
        description="Record internet, device, cooking, and insurance sales from community work."
        actions={
          canWrite ? (
            <Button asChild>
              <Link href="/sales/new">
                <Plus className="h-4 w-4" />
                Record sale
              </Link>
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customer or product…"
        filters={
          <ServiceSelect value={service} onChange={setService} allowAll />
        }
      />

      {loading ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <DataTable
          data={rows}
          getRowId={(row) => row.id}
          emptyTitle="No sales recorded"
          emptyDescription="Capture a sale after onboarding or a successful community conversation."
          page={page}
          pageSize={10}
          total={total}
          onPageChange={setPage}
          columns={[
            {
              id: "soldAt",
              header: "Date",
              cell: (row) => new Date(row.soldAt).toLocaleDateString(),
            },
            {
              id: "customer",
              header: "Customer",
              cell: (row) => row.customerName,
            },
            {
              id: "product",
              header: "Product",
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.productName}</p>
                  <p className="text-xs text-foreground-muted">
                    {serviceLineLabel(row.serviceLine)}
                  </p>
                </div>
              ),
            },
            {
              id: "amount",
              header: "Amount",
              align: "right",
              cell: (row) => `${row.amountRwf.toLocaleString()} RWF`,
            },
            {
              id: "actions",
              header: "",
              cell: (row) => (
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/sales/${row.id}`}>Open</Link>
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
