"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  acceptStockTransfer,
  canUseMyStock,
  declineStockTransfer,
  getStockTransfer,
  respondStockTransfer,
  transferStatusLabel,
  transferStatusTone,
  type StockTransfer,
  type StockTransferItemDecision,
} from "@/lib/api/stock";
import { useAuth } from "@/lib/auth/auth-context";

type DecisionValue = Exclude<StockTransferItemDecision, "pending">;

export default function IncomingTransferPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = String(params.id ?? "");
  const [transfer, setTransfer] = useState<StockTransfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Record<string, DecisionValue>>(
    {},
  );
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getStockTransfer(id);
      setTransfer(data);
      setDecisions(
        Object.fromEntries(
          data.items.map((item) => [
            item.id,
            (item.decision === "pending"
              ? "accepted"
              : item.decision) as DecisionValue,
          ]),
        ),
      );
      setNote(data.note ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load transfer");
      setTransfer(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (canUseMyStock(user)) void load();
  }, [user, load]);

  const pending = transfer?.status === "pending";

  const summary = useMemo(() => {
    const values = Object.values(decisions);
    return {
      accepted: values.filter((v) => v === "accepted").length,
      flagged: values.filter((v) => v !== "accepted").length,
    };
  }, [decisions]);

  if (user && !canUseMyStock(user)) return <PermissionDenied />;

  async function handleAcceptAll() {
    if (!transfer) return;
    setSaving(true);
    const result = await acceptStockTransfer(transfer.id);
    setSaving(false);
    if (!result.ok) {
      toast.error("Could not accept assignment", { description: result.error });
      return;
    }
    toast.success("Assignment accepted");
    router.push("/my-stock");
  }

  async function handleDeclineAll() {
    if (!transfer) return;
    setSaving(true);
    const result = await declineStockTransfer(transfer.id, {
      note: note.trim() || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error("Could not decline assignment", { description: result.error });
      return;
    }
    toast.success("Assignment declined — devices returned to warehouse");
    router.push("/my-stock");
  }

  async function handleRespond() {
    if (!transfer) return;
    setSaving(true);
    const result = await respondStockTransfer(transfer.id, {
      decisions: transfer.items.map((item) => ({
        itemId: item.id,
        decision: decisions[item.id] ?? "accepted",
        note: undefined,
      })),
      note: note.trim() || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error("Could not submit response", { description: result.error });
      return;
    }
    toast.success("Response recorded");
    router.push("/my-stock");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incoming assignment"
        description="Confirm each serial you received, or flag missing/wrong devices."
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
          title="Could not load assignment"
          description={error}
          onRetry={() => void load()}
        />
      ) : loading || !transfer ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  {transfer.itemCount} device
                  {transfer.itemCount === 1 ? "" : "s"} from{" "}
                  {transfer.createdBy.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Assigned {new Date(transfer.createdAt).toLocaleString()}
                </p>
              </div>
              <StatusBadge
                label={transferStatusLabel(transfer.status)}
                tone={transferStatusTone(transfer.status)}
              />
            </CardHeader>
            {transfer.note ? (
              <CardContent className="pt-0 text-sm text-muted-foreground">
                Note: {transfer.note}
              </CardContent>
            ) : null}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {transfer.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-mono text-sm font-medium">
                      {item.serial}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.typeLabel}
                      {item.condition ? ` · ${item.condition}` : ""}
                    </p>
                  </div>
                  {pending ? (
                    <Select
                      value={decisions[item.id] ?? "accepted"}
                      onValueChange={(value) =>
                        setDecisions((current) => ({
                          ...current,
                          [item.id]: value as DecisionValue,
                        }))
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="missing">Missing</SelectItem>
                        <SelectItem value="wrong">Wrong item</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatusBadge
                      label={item.decision}
                      tone={
                        item.decision === "accepted" ? "success" : "warning"
                      }
                      showIcon={false}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {pending ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Response</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note for admin"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  {summary.accepted} accepted · {summary.flagged} flagged
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => void handleAcceptAll()}
                    disabled={saving}
                  >
                    Accept all
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void handleRespond()}
                    disabled={saving}
                  >
                    Submit line decisions
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => void handleDeclineAll()}
                    disabled={saving}
                  >
                    Decline all
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
