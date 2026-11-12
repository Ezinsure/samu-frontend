"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AssignDialog } from "@/features/inventory/assign-dialog";
import { UnitHistoryPanels } from "@/features/inventory/unit-history";
import {
  canManageStock,
  getStockTypes,
  getStockUnit,
  stockStatusLabel,
  stockStatusTone,
  type StockItemType,
  type StockUnitDetail,
} from "@/lib/api/stock";
import { useAuth } from "@/lib/auth/auth-context";

export default function InventoryUnitPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const id = String(params.id ?? "");
  const [unit, setUnit] = useState<StockUnitDetail | null>(null);
  const [types, setTypes] = useState<StockItemType[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [data, typeRows] = await Promise.all([
        getStockUnit(id),
        getStockTypes({ includeDisabled: true }),
      ]);
      setUnit(data);
      setTypes(typeRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load unit");
      setUnit(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (canManageStock(user)) void load();
  }, [user, load]);

  if (user && !canManageStock(user)) return <PermissionDenied />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={unit?.serial ?? "Device unit"}
        description={
          unit
            ? `${unit.type.label} · serial ledger and movement history`
            : "Serial ledger and movement history"
        }
        actions={
          <Button asChild variant="secondary">
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4" />
              Back to inventory
            </Link>
          </Button>
        }
      />

      {error ? (
        <ErrorState
          title="Could not load unit"
          description={error}
          onRetry={() => void load()}
        />
      ) : loading || !unit ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Unit details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Detail label="Serial">
                  <span className="font-mono text-sm font-medium">
                    {unit.serial}
                  </span>
                </Detail>
                <Detail label="Status">
                  <StatusBadge
                    label={stockStatusLabel(unit.status)}
                    tone={stockStatusTone(unit.status)}
                  />
                </Detail>
                <Detail label="Type">{unit.type.label}</Detail>
                <Detail label="Holder">
                  {unit.holder
                    ? `${unit.holder.name} (${unit.holder.email})`
                    : "Warehouse"}
                </Detail>
                <Detail label="Condition">{unit.condition ?? "—"}</Detail>
                <Detail label="Notes">{unit.notes ?? "—"}</Detail>
                <Detail label="Created">
                  {new Date(unit.createdAt).toLocaleString()}
                </Detail>
                <Detail label="Updated">
                  {new Date(unit.updatedAt).toLocaleString()}
                </Detail>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {unit.status === "in_warehouse" ? (
                  <>
                    <p>
                      Send this serial to a Territory Coordinator or COA. It
                      stays in transit until they confirm receipt.
                    </p>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => setAssignOpen(true)}
                    >
                      Assign device
                    </Button>
                  </>
                ) : unit.status === "in_transit" ? (
                  <p>
                    Waiting for {unit.holder?.name ?? "the holder"} to accept or
                    flag this device.
                  </p>
                ) : (
                  <p>
                    This unit is {stockStatusLabel(unit.status).toLowerCase()}.
                    Return-to-office flows come in a later phase.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <AssignDialog
            open={assignOpen}
            onOpenChange={setAssignOpen}
            types={types}
            selectedUnits={
              unit
                ? [
                    {
                      id: unit.id,
                      serial: unit.serial,
                      status: unit.status,
                      condition: unit.condition,
                      notes: unit.notes,
                      type: unit.type,
                      holder: unit.holder,
                      createdAt: unit.createdAt,
                      updatedAt: unit.updatedAt,
                    },
                  ]
                : []
            }
            defaultTypeKey={unit.type.key}
            onCompleted={() => void load()}
          />

          <UnitHistoryPanels unit={unit} role="admin" />
        </>
      )}
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}
