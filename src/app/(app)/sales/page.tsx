"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CoapListTable, OpenLink } from "@/features/coap/coap-list-table";
import { MobileQuickActions } from "@/features/coap/mobile-quick-actions";
import { ServiceSelect } from "@/features/coap/service-select";
import { useInitialService } from "@/features/coap/use-initial-service";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCoap, getSales } from "@/lib/api";
import { serviceLineLabel } from "@/lib/coap/catalog";
import { filterValue, useListFilters } from "@/lib/hooks/use-list-filters";
import { useUserData } from "@/lib/hooks/use-user-data";
import type { ServiceLine } from "@/types";

const PAGE_SIZE = 10;

export default function SalesPage() {
  const { user } = useAuth();
  const canWrite = canManageCoap(user);
  const initialService = useInitialService("all");

  const { filters, applied, key, setFilters, setPage } = useListFilters({
    search: "",
    service: initialService as string,
  });

  const state = useUserData(
    () =>
      getSales({
        page: applied.page,
        pageSize: PAGE_SIZE,
        search: applied.search,
        serviceLine: filterValue<ServiceLine>(applied.service),
      }),
    `sales:${key}`,
  );

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
        searchValue={filters.search}
        onSearchChange={(search) => setFilters({ search })}
        searchPlaceholder="Search customer or product…"
        filters={
          <ServiceSelect
            value={filters.service as ServiceLine | "all"}
            onChange={(service) => setFilters({ service })}
            allowAll
          />
        }
      />

      <CoapListTable
        state={state}
        page={filters.page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No sales recorded"
        emptyDescription="Capture a sale after onboarding or a successful community conversation."
        columns={[
          {
            id: "soldAt",
            header: "Date",
            cell: (row) => new Date(row.soldAt).toLocaleDateString(),
          },
          { id: "customer", header: "Customer", cell: (row) => row.customerName },
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
            cell: (row) => <OpenLink href={`/sales/${row.id}`} />,
          },
        ]}
      />

      <MobileQuickActions />
    </div>
  );
}
