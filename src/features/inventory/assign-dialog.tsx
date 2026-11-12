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
  getStockUnits,
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
  const [mode, setMode] = useState<"serials" | "quantity">("serials");
  const [typeKey, setTypeKey] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [serialSearch, setSerialSearch] = useState("");
  const [available, setAvailable] = useState<StockUnit[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setToUserId("");
    setMode(selectedUnits.length > 0 ? "serials" : "serials");
    setTypeKey(defaultTypeKey || enabledTypes[0]?.key || "");
    setQuantity("1");
    setNote("");
    setSerialSearch("");
    setPickedIds(new Set(selectedUnits.map((u) => u.id)));
    setLoadingHolders(true);
    void getAssignableHolders()
      .then(setHolders)
      .catch((err) => {
        toast.error("Could not load holders", {
          description: err instanceof Error ? err.message : undefined,
        });
      })
      .finally(() => setLoadingHolders(false));
  }, [open, selectedUnits, defaultTypeKey, enabledTypes]);

  useEffect(() => {
    if (!open || mode !== "serials" || !typeKey) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoadingAvailable(true);
      void getStockUnits({
        page: 1,
        pageSize: 100,
        status: "in_warehouse",
        typeKey,
        search: serialSearch.trim() || undefined,
      })
        .then((page) => {
          if (cancelled) return;
          // Keep pre-selected units visible even if search filters them out.
          const byId = new Map(page.data.map((u) => [u.id, u]));
          for (const unit of selectedUnits) {
            if (unit.type.key === typeKey) byId.set(unit.id, unit);
          }
          setAvailable([...byId.values()]);
        })
        .catch((err) => {
          if (cancelled) return;
          toast.error("Could not load warehouse serials", {
            description: err instanceof Error ? err.message : undefined,
          });
          setAvailable([]);
        })
        .finally(() => {
          if (!cancelled) setLoadingAvailable(false);
        });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, mode, typeKey, serialSearch, selectedUnits]);

  const pickedUnits = useMemo(
    () => available.filter((u) => pickedIds.has(u.id)),
    [available, pickedIds],
  );

  function toggleSerial(id: string) {
    setPickedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAssign() {
    if (!toUserId) {
      toast.error("Choose a TC or COA");
      return;
    }

    if (mode === "serials" && pickedIds.size === 0) {
      toast.error("Select at least one serial from warehouse stock");
      return;
    }

    setSaving(true);
    const result =
      mode === "serials"
        ? await createStockAssignment({
            toUserId,
            unitIds: [...pickedIds],
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign devices</DialogTitle>
          <DialogDescription>
            Search and select specific warehouse serials for a TC or COA.
            Devices stay in transit until they confirm receipt.
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

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Button
              type="button"
              size="sm"
              variant={mode === "serials" ? "default" : "secondary"}
              onClick={() => setMode("serials")}
            >
              Pick serials
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "quantity" ? "default" : "secondary"}
              onClick={() => setMode("quantity")}
            >
              Quick quantity
            </Button>
            {mode === "quantity" ? (
              <span className="text-muted-foreground">
                Quantity mode picks the oldest warehouse units of that type.
              </span>
            ) : null}
          </div>

          <FormField label="Device type" htmlFor="assign-type" required>
            <Select
              value={typeKey}
              onValueChange={(next) => {
                setTypeKey(next);
                setPickedIds(new Set());
              }}
            >
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

          {mode === "serials" ? (
            <div className="space-y-3">
              <FormField label="Search serials" htmlFor="assign-serial-search">
                <Input
                  id="assign-serial-search"
                  value={serialSearch}
                  onChange={(e) => setSerialSearch(e.target.value)}
                  placeholder="Type serial to filter warehouse stock…"
                />
              </FormField>
              <div className="rounded-[var(--radius-md)] border border-border">
                <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted-foreground">
                  <span>
                    {loadingAvailable
                      ? "Loading…"
                      : `${available.length} available`}
                  </span>
                  <span>{pickedIds.size} selected</span>
                </div>
                <div className="max-h-56 space-y-1 overflow-y-auto p-2">
                  {available.length === 0 && !loadingAvailable ? (
                    <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No warehouse serials for this type
                      {serialSearch ? " match your search" : ""}.
                    </p>
                  ) : (
                    available.map((unit) => (
                      <label
                        key={unit.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                      >
                        <input
                          type="checkbox"
                          checked={pickedIds.has(unit.id)}
                          onChange={() => toggleSerial(unit.id)}
                        />
                        <span className="font-mono">{unit.serial}</span>
                        {unit.condition ? (
                          <span className="text-xs text-muted-foreground">
                            {unit.condition}
                          </span>
                        ) : null}
                      </label>
                    ))
                  )}
                </div>
              </div>
              {pickedUnits.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Selected:{" "}
                  <span className="font-mono">
                    {pickedUnits
                      .slice(0, 8)
                      .map((u) => u.serial)
                      .join(", ")}
                    {pickedUnits.length > 8
                      ? ` +${pickedUnits.length - 8} more`
                      : ""}
                  </span>
                </p>
              ) : null}
            </div>
          ) : (
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
          )}

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
            disabled={
              saving ||
              !toUserId ||
              (mode === "serials" ? pickedIds.size === 0 : !typeKey)
            }
          >
            {saving
              ? "Assigning…"
              : mode === "serials"
                ? `Assign ${pickedIds.size || ""}`.trim()
                : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
