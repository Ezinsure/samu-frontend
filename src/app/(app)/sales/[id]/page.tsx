"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { getSaleById, type SaleListItem } from "@/lib/api";
import { serviceLineLabel } from "@/lib/coap/catalog";

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [sale, setSale] = useState<SaleListItem | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void getSaleById(id, user).then((result) => {
      if (!active) return;
      setSale(result);
    });
    return () => {
      active = false;
    };
  }, [id, user]);

  if (sale === undefined) return <Skeleton className="h-64 w-full" />;
  if (!sale) {
    return (
      <div className="space-y-4">
        <PageHeader title="Sale not found" />
        <Button asChild variant="secondary">
          <Link href="/sales">Back</Link>
        </Button>
      </div>
    );
  }

  return (
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
          <Row label="Customer" value={sale.customerName} />
          <Row label="Phone" value={sale.customerPhone} />
          <Row label="Quantity" value={String(sale.quantity)} />
          <Row
            label="Amount"
            value={`${sale.amountRwf.toLocaleString()} RWF`}
          />
          <Row label="Coordinator" value={sale.tcName} />
          <Row
            label="Location"
            value={`${sale.geo.district} · ${sale.geo.sector}`}
          />
          {sale.depositRwf != null ? (
            <Row
              label="Deposit"
              value={`${sale.depositRwf.toLocaleString()} RWF`}
            />
          ) : null}
          {sale.installmentMonths != null ? (
            <Row
              label="Installments"
              value={`${sale.installmentMonths} months`}
            />
          ) : null}
          {sale.notes ? <Row label="Notes" value={sale.notes} /> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-foreground-secondary">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
