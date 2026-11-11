"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
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
import { Textarea } from "@/components/ui/textarea";
import {
  RETURN_REASON_OPTIONS,
  cancelStockReturn,
  commentStockReturn,
  confirmStockReturn,
  submitStockReturn,
  transferStatusLabel,
  transferStatusTone,
  updateStockReturn,
  type ReturnReasonCode,
  type StockTransfer,
  type StockTransferItemDecision,
} from "@/lib/api/stock";
import type { SessionUser } from "@/types";

interface ReturnApplicationViewProps {
  transfer: StockTransfer;
  user: SessionUser;
  backHref: string;
  onChanged: (next: StockTransfer) => void;
}

export function ReturnApplicationView({
  transfer,
  user,
  backHref,
  onChanged,
}: ReturnApplicationViewProps) {
  const router = useRouter();
  const isAdmin = user.role === "ADMIN";
  const isHolder = transfer.fromUser?.id === user.userId;
  const open =
    transfer.status === "draft" || transfer.status === "pending";

  const [reasonCode, setReasonCode] = useState<ReturnReasonCode>(
    (transfer.reasonCode as ReturnReasonCode) || "no_sales",
  );
  const [note, setNote] = useState(transfer.note ?? "");
  const [decisions, setDecisions] = useState<
    Record<string, StockTransferItemDecision>
  >({});
  const [conditions, setConditions] = useState<Record<string, string>>({});
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setReasonCode((transfer.reasonCode as ReturnReasonCode) || "no_sales");
    setNote(transfer.note ?? "");
    setDecisions(
      Object.fromEntries(
        transfer.items.map((item) => [item.unitId, item.decision]),
      ),
    );
    setConditions(
      Object.fromEntries(
        transfer.items.map((item) => [item.unitId, item.condition ?? ""]),
      ),
    );
  }, [transfer]);

  const stepper = useMemo(() => {
    const steps = [
      {
        key: "draft",
        label: "Draft",
        done: transfer.status !== "draft",
        active: transfer.status === "draft",
      },
      {
        key: "pending",
        label: "Dual confirm",
        done:
          transfer.status === "accepted" ||
          transfer.status === "partially_accepted" ||
          transfer.status === "declined",
        active: transfer.status === "pending",
      },
      {
        key: "done",
        label: "Stock moved",
        done:
          transfer.status === "accepted" ||
          transfer.status === "partially_accepted",
        active: false,
      },
    ];
    return steps;
  }, [transfer.status]);

  async function saveEdits() {
    setSaving(true);
    const result = await updateStockReturn(transfer.id, {
      reasonCode,
      note: note.trim() || null,
      items: transfer.items.map((item) => ({
        unitId: item.unitId,
        condition: conditions[item.unitId] || null,
        decision: decisions[item.unitId] ?? item.decision,
      })),
    });
    setSaving(false);
    if (!result.ok) {
      toast.error("Could not save changes", { description: result.error });
      return;
    }
    toast.success("Return updated — both sides must re-confirm");
    onChanged(result.data);
  }

  async function handleSubmit() {
    setSaving(true);
    const result = await submitStockReturn(transfer.id);
    setSaving(false);
    if (!result.ok) {
      toast.error("Could not submit return", { description: result.error });
      return;
    }
    toast.success("Return submitted for office confirmation");
    onChanged(result.data);
  }

  async function handleConfirm() {
    setSaving(true);
    const result = await confirmStockReturn(transfer.id, {
      note: note.trim() || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error("Could not confirm return", { description: result.error });
      return;
    }
    toast.success(
      result.data.status === "accepted" ||
        result.data.status === "partially_accepted"
        ? "Return completed — stock moved to warehouse"
        : "Your confirmation was recorded",
    );
    onChanged(result.data);
  }

  async function handleCancel() {
    setSaving(true);
    const result = await cancelStockReturn(transfer.id, {
      note: comment.trim() || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error("Could not cancel return", { description: result.error });
      return;
    }
    toast.success("Return cancelled");
    onChanged(result.data);
  }

  async function handleComment() {
    if (!comment.trim()) {
      toast.error("Write a comment first");
      return;
    }
    setSaving(true);
    const result = await commentStockReturn(transfer.id, {
      note: comment.trim(),
    });
    setSaving(false);
    if (!result.ok) {
      toast.error("Could not add comment", { description: result.error });
      return;
    }
    setComment("");
    toast.success("Comment added");
    onChanged(result.data);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          label={transferStatusLabel(transfer.status)}
          tone={transferStatusTone(transfer.status)}
        />
        <span className="text-sm text-muted-foreground">
          Revision {transfer.revision}
        </span>
        <Button asChild variant="secondary" size="sm" className="ml-auto">
          <Link href={backHref}>Back</Link>
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {stepper.map((step) => (
          <div
            key={step.key}
            className={`rounded-[var(--radius-md)] border px-3 py-2 text-sm ${
              step.active
                ? "border-primary bg-primary/5"
                : step.done
                  ? "border-border bg-muted/30"
                  : "border-border"
            }`}
          >
            <p className="font-medium">{step.label}</p>
            <p className="text-xs text-muted-foreground">
              {step.done ? "Done" : step.active ? "Current" : "Next"}
            </p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Confirmation status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <StatusBadge
            label={
              transfer.holderConfirmed
                ? "Holder confirmed"
                : "Holder not confirmed"
            }
            tone={transfer.holderConfirmed ? "success" : "warning"}
            showIcon={false}
          />
          <StatusBadge
            label={
              transfer.officeConfirmed
                ? "Office confirmed"
                : "Office not confirmed"
            }
            tone={transfer.officeConfirmed ? "success" : "warning"}
            showIcon={false}
          />
          <p className="w-full text-muted-foreground">
            From {transfer.fromUser?.name ?? "holder"} · Office desk{" "}
            {transfer.toUser.name}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Return details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Reason">
            <Select
              value={reasonCode}
              onValueChange={(value) =>
                setReasonCode(value as ReturnReasonCode)
              }
              disabled={!open || saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RETURN_REASON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Note">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              disabled={!open || saving}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {transfer.items.map((item) => (
            <div
              key={item.id}
              className="grid gap-2 rounded-[var(--radius-md)] border border-border p-3 sm:grid-cols-[1fr_160px_160px]"
            >
              <div>
                <p className="font-mono text-sm font-medium">{item.serial}</p>
                <p className="text-xs text-muted-foreground">{item.typeLabel}</p>
              </div>
              <Input
                value={conditions[item.unitId] ?? ""}
                onChange={(e) =>
                  setConditions((prev) => ({
                    ...prev,
                    [item.unitId]: e.target.value,
                  }))
                }
                placeholder="Condition"
                disabled={!open || saving}
              />
              <Select
                value={decisions[item.unitId] ?? "pending"}
                onValueChange={(value) =>
                  setDecisions((prev) => ({
                    ...prev,
                    [item.unitId]: value as StockTransferItemDecision,
                  }))
                }
                disabled={!open || saving || (!isAdmin && !isHolder)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted / received</SelectItem>
                  <SelectItem value="missing">Missing</SelectItem>
                  <SelectItem value="wrong">Wrong item</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      {open ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => void saveEdits()}
            >
              Save edits
            </Button>
            {transfer.status === "draft" && (isHolder || isAdmin) ? (
              <Button
                type="button"
                disabled={saving}
                onClick={() => void handleSubmit()}
              >
                Submit for confirmation
              </Button>
            ) : null}
            {transfer.status === "pending" && (isHolder || isAdmin) ? (
              <Button
                type="button"
                disabled={saving}
                onClick={() => void handleConfirm()}
              >
                {isAdmin ? "Confirm as office" : "Confirm as holder"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="destructive"
              disabled={saving}
              onClick={() => void handleCancel()}
            >
              Cancel return
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment…"
              rows={2}
              className="sm:flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => void handleComment()}
            >
              Comment
            </Button>
          </div>
          <div className="space-y-2">
            {transfer.events.map((event) => (
              <div
                key={event.id}
                className="rounded-[var(--radius-md)] border border-border/70 px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{event.type}</span>
                  <span className="text-muted-foreground">
                    {event.actor.name}
                  </span>
                  {event.revision != null ? (
                    <span className="text-xs text-muted-foreground">
                      rev {event.revision}
                    </span>
                  ) : null}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
                {event.note ? (
                  <p className="mt-1 text-muted-foreground">{event.note}</p>
                ) : null}
                {event.type === "edited" && event.payload?.previous ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Previous snapshot stored — both parties must confirm the new
                    revision.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!open ? (
        <Button type="button" variant="secondary" onClick={() => router.push(backHref)}>
          Done
        </Button>
      ) : null}
    </div>
  );
}
