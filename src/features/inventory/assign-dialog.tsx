"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  getStockBalances,
  getStockUnits,
  isQuantityTrackedType,
  type StockAssignableHolder,
  type StockItemType,
  type StockUnit,
} from "@/lib/api/stock";
import type { AppRole } from "@/types";

const PAGE_SIZE = 25;

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
  const typeByKey = useMemo(
    () => new Map(enabledTypes.map((t) => [t.key, t])),
    [enabledTypes],
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [available, setAvailable] = useState<StockUnit[]>([]);
  const [availableTotal, setAvailableTotal] = useState(0);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  /** Persist selections across pages (id → unit snapshot). */
  const [picked, setPicked] = useState<Map<string, StockUnit>>(new Map());

  const [qtyPreview, setQtyPreview] = useState<StockUnit[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [warehouseQty, setWarehouseQty] = useState<number | null>(null);
  const [loadingWarehouseQty, setLoadingWarehouseQty] = useState(false);
  const [legacySerialCount, setLegacySerialCount] = useState(0);

  const selectedType = typeByKey.get(typeKey);
  const quantityTracked = isQuantityTrackedType(selectedType);
  const totalPages = Math.max(1, Math.ceil(availableTotal / PAGE_SIZE));
  const qtyNumber = Math.max(1, Math.min(100000, Number(quantity) || 1));

  // Reset form + load holders once when the dialog opens (not on every types refresh).
  useEffect(() => {
    if (!open) return;

    const initialType =
      defaultTypeKey || types.find((t) => t.enabled)?.key || "";
    const initialIsQty = isQuantityTrackedType(
      types.find((t) => t.key === initialType),
    );

    setToUserId("");
    setMode(initialIsQty ? "quantity" : "serials");
    setTypeKey(initialType);
    setQuantity("1");
    setNote("");
    setSerialSearch("");
    setDebouncedSearch("");
    setPage(1);
    setPicked(
      new Map(
        initialIsQty
          ? []
          : selectedUnits.map((unit) => [unit.id, unit] as const),
      ),
    );
    setQtyPreview([]);
    setAvailable([]);
    setAvailableTotal(0);
    setWarehouseQty(null);
    setLegacySerialCount(0);

    let cancelled = false;
    setLoadingHolders(true);
    void getAssignableHolders()
      .then((rows) => {
        if (!cancelled) setHolders(rows);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error("Could not load holders", {
          description: err instanceof Error ? err.message : undefined,
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingHolders(false);
      });

    return () => {
      cancelled = true;
    };
    // Intentionally only re-run when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(serialSearch.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [serialSearch]);

  const loadSerialPage = useCallback(async () => {
    if (!open || mode !== "serials" || !typeKey || quantityTracked) return;
    setLoadingAvailable(true);
    try {
      const result = await getStockUnits({
        page,
        pageSize: PAGE_SIZE,
        status: "in_warehouse",
        typeKey,
        search: debouncedSearch || undefined,
      });
      setAvailable(result.data);
      setAvailableTotal(result.total);
    } catch (err) {
      toast.error("Could not load warehouse serials", {
        description: err instanceof Error ? err.message : undefined,
      });
      setAvailable([]);
      setAvailableTotal(0);
    } finally {
      setLoadingAvailable(false);
    }
  }, [open, mode, typeKey, page, debouncedSearch, quantityTracked]);

  useEffect(() => {
    void loadSerialPage();
  }, [loadSerialPage]);

  // Quantity-tracked: warehouse balance (+ optional legacy serialized leftover).
  useEffect(() => {
    if (!open || !typeKey || !quantityTracked) {
      setWarehouseQty(null);
      setLegacySerialCount(0);
      return;
    }

    let cancelled = false;
    setLoadingWarehouseQty(true);
    void Promise.all([
      getStockBalances({ typeKey }),
      getStockUnits({
        page: 1,
        pageSize: 1,
        status: "in_warehouse",
        typeKey,
      }),
    ])
      .then(([balances, units]) => {
        if (cancelled) return;
        const warehouse = balances.find((b) => b.scope === "warehouse");
        setWarehouseQty(warehouse?.quantity ?? 0);
        setLegacySerialCount(units.total);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error("Could not load warehouse SIM balance", {
          description: err instanceof Error ? err.message : undefined,
        });
        setWarehouseQty(null);
        setLegacySerialCount(0);
      })
      .finally(() => {
        if (!cancelled) setLoadingWarehouseQty(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, typeKey, quantityTracked]);

  // Serialized quick quantity: preview the exact serials that would be assigned.
  useEffect(() => {
    if (!open || mode !== "quantity" || !typeKey || quantityTracked) {
      setQtyPreview([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoadingPreview(true);
      void getStockUnits({
        page: 1,
        pageSize: Math.min(200, qtyNumber),
        status: "in_warehouse",
        typeKey,
      })
        .then((result) => {
          if (cancelled) return;
          setQtyPreview(result.data.slice(0, qtyNumber));
        })
        .catch((err) => {
          if (cancelled) return;
          toast.error("Could not preview serials", {
            description: err instanceof Error ? err.message : undefined,
          });
          setQtyPreview([]);
        })
        .finally(() => {
          if (!cancelled) setLoadingPreview(false);
        });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, mode, typeKey, qtyNumber, quantityTracked]);

  const pageIds = useMemo(() => available.map((u) => u.id), [available]);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => picked.has(id));
  const pickedList = useMemo(() => [...picked.values()], [picked]);

  function toggleSerial(unit: StockUnit) {
    setPicked((prev) => {
      const next = new Map(prev);
      if (next.has(unit.id)) next.delete(unit.id);
      else next.set(unit.id, unit);
      return next;
    });
  }

  function togglePage() {
    setPicked((prev) => {
      const next = new Map(prev);
      if (allOnPageSelected) {
        for (const id of pageIds) next.delete(id);
      } else {
        for (const unit of available) next.set(unit.id, unit);
      }
      return next;
    });
  }

  function onTypeChange(next: string) {
    const nextType = typeByKey.get(next);
    const nextQty = isQuantityTrackedType(nextType);
    setTypeKey(next);
    setPicked(new Map());
    setPage(1);
    setQtyPreview([]);
    setMode(nextQty ? "quantity" : "serials");
  }

  async function handleAssign() {
    if (!toUserId) {
      toast.error("Choose a TC or COA");
      return;
    }

    if (quantityTracked) {
      if (warehouseQty == null || warehouseQty < 1) {
        toast.error("No warehouse SIMs available for this type");
        return;
      }
      if (qtyNumber > warehouseQty) {
        toast.error(
          `Only ${warehouseQty} SIM${warehouseQty === 1 ? "" : "s"} available in warehouse`,
        );
        return;
      }

      setSaving(true);
      const result = await createStockAssignment({
        toUserId,
        typeKey,
        quantity: qtyNumber,
        note: note.trim() || undefined,
      });
      setSaving(false);

      if (!result.ok) {
        toast.error("Could not assign SIMs", { description: result.error });
        return;
      }

      toast.success(
        `Assigned ${result.data.itemCount} SIM${result.data.itemCount === 1 ? "" : "s"}`,
        { description: `Pending confirmation by ${result.data.toUser.name}` },
      );
      onOpenChange(false);
      onCompleted();
      return;
    }

    if (mode === "serials" && picked.size === 0) {
      toast.error("Select at least one serial from warehouse stock");
      return;
    }

    if (mode === "quantity") {
      if (qtyPreview.length === 0) {
        toast.error("No warehouse units available for this type");
        return;
      }
      if (qtyPreview.length < qtyNumber) {
        toast.error(
          `Only ${qtyPreview.length} warehouse unit(s) available for this type`,
        );
        return;
      }
    }

    setSaving(true);
    const unitIds =
      mode === "serials"
        ? [...picked.keys()]
        : qtyPreview.map((unit) => unit.id);

    const result = await createStockAssignment({
      toUserId,
      unitIds,
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

  const assignDisabled =
    saving ||
    !toUserId ||
    !typeKey ||
    (quantityTracked
      ? warehouseQty == null || qtyNumber > warehouseQty || warehouseQty < 1
      : mode === "serials"
        ? picked.size === 0
        : qtyPreview.length < qtyNumber);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign devices</DialogTitle>
          <DialogDescription>
            {quantityTracked
              ? "Assign a quantity of SIMs to a TC or COA. Serials are entered when they sell or activate for a customer."
              : "Search and select warehouse serials for a TC or COA. Devices stay in transit until they confirm receipt."}
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

          {!quantityTracked ? (
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
            </div>
          ) : null}

          <FormField label="Device type" htmlFor="assign-type" required>
            <Select value={typeKey} onValueChange={onTypeChange}>
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

          {quantityTracked ? (
            <div className="space-y-3">
              <div className="rounded-[var(--radius-md)] border border-border p-3 text-sm">
                <p className="text-muted-foreground">Warehouse available</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {loadingWarehouseQty
                    ? "…"
                    : (warehouseQty ?? 0).toLocaleString()}
                </p>
                {legacySerialCount > 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Also {legacySerialCount} legacy serialized{" "}
                    {selectedType?.label ?? "SIM"}
                    {legacySerialCount === 1 ? "" : "s"} still in warehouse —
                    assign those from the units list if needed.
                  </p>
                ) : null}
              </div>

              <FormField label="Quantity to assign" htmlFor="assign-qty" required>
                <Input
                  id="assign-qty"
                  type="number"
                  min={1}
                  max={warehouseQty ?? 100000}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </FormField>
            </div>
          ) : mode === "serials" ? (
            <div className="space-y-3 rounded-[var(--radius-md)] border border-border p-3">
              <FormField label="Search serials" htmlFor="assign-serial-search">
                <Input
                  id="assign-serial-search"
                  value={serialSearch}
                  onChange={(e) => setSerialSearch(e.target.value)}
                  placeholder="Type serial to filter warehouse stock…"
                />
              </FormField>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={togglePage}
                    disabled={available.length === 0 || loadingAvailable}
                  />
                  Select page
                </label>
                <span>
                  {picked.size} selected · {availableTotal} match
                  {availableTotal === 1 ? "" : "es"}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-md border border-border/70">
                {loadingAvailable ? (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    Loading…
                  </p>
                ) : available.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No warehouse serials for this type
                    {debouncedSearch ? " match your search" : ""}.
                  </p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-surface text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="w-10 px-3 py-2 font-medium" />
                        <th className="px-3 py-2 font-medium">Serial</th>
                        <th className="px-3 py-2 font-medium">Condition</th>
                      </tr>
                    </thead>
                    <tbody>
                      {available.map((unit) => (
                        <tr
                          key={unit.id}
                          className="border-t border-border/60 hover:bg-muted/30"
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={picked.has(unit.id)}
                              onChange={() => toggleSerial(unit)}
                              aria-label={`Select ${unit.serial}`}
                            />
                          </td>
                          <td className="px-3 py-2 font-mono">{unit.serial}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {unit.condition ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1 || loadingAvailable}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs tabular-nums text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={page >= totalPages || loadingAvailable}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>

              {pickedList.length > 0 ? (
                <div className="space-y-1.5 border-t border-border pt-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Selected serials
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {pickedList.slice(0, 12).map((unit) => (
                      <button
                        key={unit.id}
                        type="button"
                        className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-xs hover:bg-muted"
                        onClick={() => toggleSerial(unit)}
                        title="Click to remove"
                      >
                        {unit.serial} ×
                      </button>
                    ))}
                    {pickedList.length > 12 ? (
                      <span className="px-1 text-xs text-muted-foreground">
                        +{pickedList.length - 12} more
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
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

              <div className="rounded-[var(--radius-md)] border border-border p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Serials that will be assigned (oldest first)</span>
                  <span>
                    {loadingPreview
                      ? "Loading…"
                      : `${qtyPreview.length} of ${qtyNumber}`}
                  </span>
                </div>
                {loadingPreview ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Loading preview…
                  </p>
                ) : qtyPreview.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No warehouse units available for this type.
                  </p>
                ) : (
                  <ul className="max-h-48 space-y-1 overflow-y-auto font-mono text-sm">
                    {qtyPreview.map((unit) => (
                      <li
                        key={unit.id}
                        className="rounded-md px-2 py-1 hover:bg-muted/40"
                      >
                        {unit.serial}
                        {unit.condition ? (
                          <span className="ml-2 font-sans text-xs text-muted-foreground">
                            {unit.condition}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
                {!loadingPreview && qtyPreview.length < qtyNumber ? (
                  <p className="mt-2 text-xs text-destructive">
                    Only {qtyPreview.length} unit
                    {qtyPreview.length === 1 ? "" : "s"} available — lower the
                    quantity or intake more stock.
                  </p>
                ) : null}
              </div>
            </div>
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
            disabled={assignDisabled}
          >
            {saving
              ? "Assigning…"
              : quantityTracked || mode === "quantity"
                ? `Assign ${qtyNumber}`
                : `Assign ${picked.size || ""}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
