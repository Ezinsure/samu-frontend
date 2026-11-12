"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { FormField } from "@/components/shared/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { UnitHistoryPanels } from "@/features/inventory/unit-history";
import {
  canUseMyStock,
  customerReturnStockUnit,
  getStockUnit,
  stockStatusLabel,
  stockStatusTone,
  type CustomerReturnReason,
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
  const [returnReason, setReturnReason] =
    useState<CustomerReturnReason>("stopped_paying");
  const [returnCondition, setReturnCondition] = useState("");
  const [returnNote, setReturnNote] = useState("");
  const [returning, setReturning] = useState(false);

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

  async function handleCustomerReturn() {
    if (!unit) return;
    setReturning(true);
    const result = await customerReturnStockUnit(unit.id, {
      reasonCode: returnReason,
      condition: returnCondition.trim() || undefined,
      note: returnNote.trim() || undefined,
    });
    setReturning(false);
    if (!result.ok) {
      toast.error("Could not record customer return", {
        description: result.error,
      });
      return;
    }
    toast.success("Customer return recorded — device is back in your stock");
    void load();
  }

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

          {unit.status === "sold" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Device returned by customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use this when a client stops paying, cancels, or returns a
                  faulty device. The unit comes back into your custody and the
                  linked sale is flagged.
                </p>
                <FormField label="Reason" required>
                  <Select
                    value={returnReason}
                    onValueChange={(value) =>
                      setReturnReason(value as CustomerReturnReason)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stopped_paying">
                        Stopped paying
                      </SelectItem>
                      <SelectItem value="faulty">Faulty device</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Condition" htmlFor="return-condition">
                  <Input
                    id="return-condition"
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value)}
                    placeholder="e.g. scratched, working"
                  />
                </FormField>
                <FormField label="Note" htmlFor="return-note">
                  <Textarea
                    id="return-note"
                    value={returnNote}
                    onChange={(e) => setReturnNote(e.target.value)}
                    rows={3}
                  />
                </FormField>
                <Button
                  type="button"
                  onClick={() => void handleCustomerReturn()}
                  disabled={returning}
                >
                  {returning ? "Saving…" : "Record customer return"}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <UnitHistoryPanels unit={unit} role="holder" />
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
