"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { roleLabelFor } from "@/lib/auth/session";
import {
  createStockAssignment,
  getAssignableHolders,
  type StockAssignableHolder,
  type StockItemType,
  type StockUnit,
} from "@/lib/api/stock";
import type { AppRole } from "@/types";

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  types: StockItemType[];
  /** Pre-selected warehouse units from the list/detail page. */
  selectedUnits?: StockUnit[];
  defaultTypeKey?: string;
  onCompleted: () => void;
}

export function AssignDialog({
  open,
  onOpenChange,
  types,
  selectedUnits = [],
  defaultTypeKey,
  onCompleted,
}: AssignDialogProps) {
  const enabledTypes = useMemo(
    () => types.filter((t) => t.enabled),
    [types],
  );
  const [holders, setHolders] = useState<StockAssignableHolder[]>([]);
  const [loadingHolders, setLoadingHolders] = useState(false);
  const [toUserId, setToUserId] = useState("");
  const [mode, setMode] = useState<"units" | "quantity">(
    selectedUnits.length > 0 ? "units" : "quantity",
  );
  const [typeKey, setTypeKey] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setToUserId("");
    setMode(selectedUnits.length > 0 ? "units" : "quantity");
    setTypeKey(defaultTypeKey || enabledTypes[0]?.key || "");
    setQuantity("1");
    setNote("");
    setLoadingHolders(true);
    void getAssignableHolders()
      .then(setHolders)
      .catch((err) => {
        toast.error("Could not load holders", {
          description: err instanceof Error ? err.message : undefined,
        });
      })
      .finally(() => setLoadingHolders(false));
  }, [open, selectedUnits.length, defaultTypeKey, enabledTypes]);

  async function handleAssign() {
    if (!toUserId) {
      toast.error("Choose a TC or COA");
      return;
    }

    setSaving(true);
    const result =
      mode === "units"
        ? await createStockAssignment({
            toUserId,
            unitIds: selectedUnits.map((u) => u.id),
            note: note.trim() || undefined,
          })
        : await createStockAssignment({
            toUserId,
            typeKey,
            quantity: Number(quantity),
            note: note.trim() || undefined,
          });
    setSaving(false);

    if (!result.ok) {
      toast.error("Could not assign devices", { description: result.error });
      return;
    }

    toast.success(
      `Assigned ${result.data.itemCount} device${result.data.itemCount === 1 ? "" : "s"}`,
      { description: `Pending confirmation by ${result.data.toUser.name}` },
    );
    onOpenChange(false);
    onCompleted();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign devices</DialogTitle>
          <DialogDescription>
            Send warehouse stock to a Territory Coordinator or COA. Devices
            stay in transit until they confirm receipt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormField label="Assignee" htmlFor="assign-holder" required>
            <Select
              value={toUserId}
              onValueChange={setToUserId}
              disabled={loadingHolders}
            >
              <SelectTrigger id="assign-holder">
                <SelectValue
                  placeholder={
                    loadingHolders ? "Loading…" : "Select TC or COA"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {holders.map((holder) => (
                  <SelectItem key={holder.id} value={holder.id}>
                    {holder.name} · {roleLabelFor(holder.role as AppRole)}
                    {holder.workingDistrict
                      ? ` · ${holder.workingDistrict}`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {selectedUnits.length > 0 ? (
            <div className="rounded-[var(--radius-md)] border border-border p-3 text-sm">
              <p className="font-medium">
                {selectedUnits.length} selected serial
                {selectedUnits.length === 1 ? "" : "s"}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {selectedUnits
                  .slice(0, 8)
                  .map((u) => u.serial)
                  .join(", ")}
                {selectedUnits.length > 8
                  ? ` +${selectedUnits.length - 8} more`
                  : ""}
              </p>
              <button
                type="button"
                className="mt-2 text-xs text-primary underline"
                onClick={() =>
                  setMode((m) => (m === "units" ? "quantity" : "units"))
                }
              >
                {mode === "units"
                  ? "Assign by quantity instead"
                  : "Use selected serials"}
              </button>
            </div>
          ) : null}

          {mode === "quantity" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Device type" htmlFor="assign-type" required>
                <Select value={typeKey} onValueChange={setTypeKey}>
                  <SelectTrigger id="assign-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {enabledTypes.map((type) => (
                      <SelectItem key={type.key} value={type.key}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Quantity" htmlFor="assign-qty" required>
                <Input
                  id="assign-qty"
                  type="number"
                  min={1}
                  max={200}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </FormField>
            </div>
          ) : null}

          <FormField label="Note" htmlFor="assign-note">
            <Textarea
              id="assign-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Optional handoff note"
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleAssign()}
            disabled={saving || !toUserId}
          >
            {saving ? "Assigning…" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
