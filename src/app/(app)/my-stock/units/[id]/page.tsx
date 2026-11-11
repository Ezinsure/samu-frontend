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
import {
  canUseMyStock,
  getStockUnit,
  stockMovementLabel,
  stockStatusLabel,
  stockStatusTone,
  type StockUnitDetail,
} from "@/lib/api/stock";
import { useAuth } from "@/lib/auth/auth-context";

export default function MyStockUnitPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const id = String(params.id ?? "");
  const [unit, setUnit] = useState<StockUnitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getStockUnit(id);
      setUnit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load unit");
      setUnit(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (canUseMyStock(user)) void load();
  }, [user, load]);

  if (user && !canUseMyStock(user)) return <PermissionDenied />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={unit?.serial ?? "Device unit"}
        description={
          unit
            ? `${unit.type.label} · your device ledger`
            : "Your device ledger"
        }
        actions={
          <Button asChild variant="secondary">
            <Link href="/my-stock">
              <ArrowLeft className="h-4 w-4" />
              Back to my stock
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
          <Card>
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
              <Detail label="Condition">{unit.condition ?? "—"}</Detail>
              <Detail label="Notes">{unit.notes ?? "—"}</Detail>
              <Detail label="Updated">
                {new Date(unit.updatedAt).toLocaleString()}
              </Detail>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Movement history</CardTitle>
            </CardHeader>
            <CardContent>
              {unit.movements.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No movements recorded yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="pb-2 pr-3 font-medium">When</th>
                        <th className="pb-2 pr-3 font-medium">Type</th>
                        <th className="pb-2 pr-3 font-medium">Actor</th>
                        <th className="pb-2 font-medium">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unit.movements.map((movement) => (
                        <tr
                          key={movement.id}
                          className="border-t border-border/70"
                        >
                          <td className="whitespace-nowrap py-2.5 pr-3 text-muted-foreground">
                            {new Date(movement.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2.5 pr-3">
                            {stockMovementLabel(movement.type)}
                          </td>
                          <td className="py-2.5 pr-3">{movement.actor.name}</td>
                          <td className="py-2.5 text-muted-foreground">
                            {movement.note || movement.reasonCode || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
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
