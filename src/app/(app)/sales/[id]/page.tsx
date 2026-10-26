"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DetailRow } from "@/components/shared/detail-row";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecordGate } from "@/features/coap/record-states";
import { getSaleById } from "@/lib/api";
import { serviceLineLabel } from "@/lib/coap/catalog";
import { useUserData } from "@/lib/hooks/use-user-data";

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const state = useUserData(() => getSaleById(id), `sale:${id}`);

  return (
    <RecordGate state={state} notFoundTitle="Sale not found" backHref="/sales">
      {(sale) => (
        <div className="space-y-6">
          <PageHeader
            title={sale.productName}
            description={`${serviceLineLabel(sale.serviceLine)} · ${new Date(sale.soldAt).toLocaleDateString()}`}
            actions={
              <Button asChild variant="secondary">
                <Link href="/sales">All sales</Link>
              </Button>
            }
          />
          <Card>
            <CardHeader>
              <CardTitle>Sale summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <DetailRow label="Customer" value={sale.customerName} />
              <DetailRow label="Phone" value={sale.customerPhone} />
              <DetailRow label="Quantity" value={String(sale.quantity)} />
              <DetailRow
                label="Amount"
                value={`${sale.amountRwf.toLocaleString()} RWF`}
              />
              <DetailRow label="Coordinator" value={sale.tcName} />
              <DetailRow
                label="Location"
                value={`${sale.geo.district} · ${sale.geo.sector}`}
              />
              {sale.depositRwf != null ? (
                <DetailRow
                  label="Deposit"
                  value={`${sale.depositRwf.toLocaleString()} RWF`}
                />
              ) : null}
              {sale.installmentMonths != null ? (
                <DetailRow
                  label="Installments"
                  value={`${sale.installmentMonths} months`}
                />
              ) : null}
              {sale.notes ? <DetailRow label="Notes" value={sale.notes} /> : null}
            </CardContent>
          </Card>
        </div>
      )}
    </RecordGate>
  );
}
