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
  canManageStock,
  getStockTransfer,
  transferStatusLabel,
  transferStatusTone,
  type StockTransfer,
} from "@/lib/api/stock";
import { useAuth } from "@/lib/auth/auth-context";

function decisionLabel(decision: string) {
  switch (decision) {
    case "accepted":
      return "Accepted";
    case "missing":
      return "Missing";
    case "wrong":
      return "Wrong item";
    case "declined":
      return "Declined";
    case "pending":
      return "Pending";
    default:
      return decision;
  }
}

function decisionTone(
  decision: string,
): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (decision) {
    case "accepted":
      return "success";
    case "missing":
    case "wrong":
      return "warning";
    case "declined":
      return "danger";
    case "pending":
      return "info";
    default:
      return "neutral";
  }
}

export default function InventoryAssignmentDetailPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const id = String(params.id ?? "");
  const [transfer, setTransfer] = useState<StockTransfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getStockTransfer(id);
      setTransfer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load assignment");
      setTransfer(null);
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
        title={
          transfer
            ? `Assignment to ${transfer.toUser.name}`
            : "Assignment detail"
        }
        description="Handoff outcomes, serial decisions, and event timeline."
        actions={
          <Button asChild variant="secondary">
            <Link href="/inventory/assignments">
              <ArrowLeft className="h-4 w-4" />
              Back to assignments
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
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base">Summary</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Created {new Date(transfer.createdAt).toLocaleString()} by{" "}
                  {transfer.createdBy.name}
                </p>
              </div>
              <StatusBadge
                label={transferStatusLabel(transfer.status)}
                tone={transferStatusTone(transfer.status)}
              />
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Assignee
                </p>
                <p className="font-medium">{transfer.toUser.name}</p>
                <p className="text-muted-foreground">{transfer.toUser.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Note
                </p>
                <p>{transfer.note || "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Serials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {transfer.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
                >
                  <div>
                    <Link
                      href={`/inventory/${item.unitId}`}
                      className="font-mono font-medium text-primary-600 hover:underline"
                    >
                      {item.serial}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {item.typeLabel}
                      {item.condition ? ` · ${item.condition}` : ""}
                    </p>
                    {item.decisionNote ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.decisionNote}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge
                    label={decisionLabel(item.decision)}
                    tone={decisionTone(item.decision)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {transfer.events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {transfer.events.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-md border border-border/70 px-3 py-2"
                    >
                      <p className="font-medium">{event.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString()} ·{" "}
                        {event.actor.name}
                      </p>
                      {event.note ? (
                        <p className="mt-1 text-muted-foreground">{event.note}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
