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
import { useAuth } from "@/lib/auth/auth-context";
import {
  RETURN_REASON_OPTIONS,
  createStockReturn,
  getAvailableStockUnits,
  getStockTypes,
  type AvailableStockUnit,
  type ReturnReasonCode,
  type StockItemType,
} from "@/lib/api/stock";

const PAGE_SIZE = 25;

interface CreateReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}

export function CreateReturnDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateReturnDialogProps) {
  const { user } = useAuth();
  const [units, setUnits] = useState<AvailableStockUnit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [types, setTypes] = useState<StockItemType[]>([]);
  const [selected, setSelected] = useState<Map<string, AvailableStockUnit>>(
    new Map(),
  );
  const [reasonCode, setReasonCode] = useState<ReturnReasonCode>("no_sales");
  const [otherReason, setOtherReason] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeKey, setTypeKey] = useState("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadUnits = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const pageData = await getAvailableStockUnits({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        typeKey: typeKey === "all" ? undefined : typeKey,
        // Admin available list is global unless scoped; TC/COA are already self-scoped.
        holderUserId:
          user?.role === "ADMIN" ? user.userId : undefined,
      });
      setUnits(pageData.data);
      setTotal(pageData.total);
    } catch (err) {
      toast.error("Could not load returnable units", {
        description: err instanceof Error ? err.message : undefined,
      });
      setUnits([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [open, page, debouncedSearch, typeKey, user?.role, user?.userId]);

  useEffect(() => {
    if (!open) return;
    setSelected(new Map());
    setReasonCode("no_sales");
    setOtherReason("");
    setNote("");
    setSearch("");
    setDebouncedSearch("");
    setTypeKey("all");
    setPage(1);
    void getStockTypes()
      .then((rows) => setTypes(rows.filter((t) => t.enabled)))
      .catch(() => setTypes([]));
  }, [open]);

  useEffect(() => {
    void loadUnits();
  }, [loadUnits]);

  const pageIds = useMemo(() => units.map((u) => u.id), [units]);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  function toggle(unit: AvailableStockUnit) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(unit.id)) next.delete(unit.id);
      else next.set(unit.id, unit);
      return next;
    });
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Map(prev);
      if (allOnPageSelected) {
        for (const id of pageIds) next.delete(id);
      } else {
        for (const unit of units) next.set(unit.id, unit);
      }
      return next;
    });
  }

  function buildNote(): string | undefined {
    const parts: string[] = [];
    if (reasonCode === "other" && otherReason.trim()) {
      parts.push(`Other reason: ${otherReason.trim()}`);
    }
    if (note.trim()) parts.push(note.trim());
    return parts.length ? parts.join("\n") : undefined;
  }

  async function handleCreate(submit: boolean) {
    if (selected.size === 0) {
      toast.error("Select at least one serial");
      return;
    }
    if (reasonCode === "other" && !otherReason.trim()) {
      toast.error("Please specify the return reason");
      return;
    }

    setSaving(true);
    const result = await createStockReturn({
      unitIds: [...selected.keys()],
      reasonCode,
      note: buildNote(),
      submit,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error("Could not create return", { description: result.error });
      return;
    }
    toast.success(submit ? "Return submitted" : "Return draft saved");
    onOpenChange(false);
    onCreated(result.data.id);
  }

  const selectedList = useMemo(() => [...selected.values()], [selected]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Return devices to office</DialogTitle>
          <DialogDescription>
            Select in-hand serials to return. Stock only moves after both you
            and the office confirm the same revision.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormField label="Reason" required>
            <Select
              value={reasonCode}
              onValueChange={(value) =>
                setReasonCode(value as ReturnReasonCode)
              }
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

          {reasonCode === "other" ? (
            <FormField label="Specify reason" htmlFor="other-reason" required>
              <Input
                id="other-reason"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Why are you returning these devices?"
                maxLength={500}
              />
            </FormField>
          ) : null}

          <FormField label="Devices" required>
            <div className="space-y-3 rounded-[var(--radius-md)] border border-border p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search serial…"
                  className="sm:flex-1"
                />
                <Select
                  value={typeKey}
                  onValueChange={(value) => {
                    setTypeKey(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="sm:w-56">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {types.map((type) => (
                      <SelectItem key={type.key} value={type.key}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={togglePage}
                    disabled={units.length === 0 || loading}
                  />
                  Select page
                </label>
                <span>
                  {selected.size} selected · {total} match
                  {total === 1 ? "" : "es"}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-md border border-border/70">
                {loading ? (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    Loading…
                  </p>
                ) : units.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No returnable units match these filters.
                  </p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-surface text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="w-10 px-3 py-2 font-medium" />
                        <th className="px-3 py-2 font-medium">Serial</th>
                        <th className="px-3 py-2 font-medium">Type</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {units.map((unit) => (
                        <tr
                          key={unit.id}
                          className="border-t border-border/60 hover:bg-muted/30"
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selected.has(unit.id)}
                              onChange={() => toggle(unit)}
                              aria-label={`Select ${unit.serial}`}
                            />
                          </td>
                          <td className="px-3 py-2 font-mono">{unit.serial}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {unit.type.label}
                          </td>
                          <td className="px-3 py-2 capitalize text-muted-foreground">
                            {unit.status.replaceAll("_", " ")}
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
                  disabled={page <= 1 || loading}
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
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>

              {selectedList.length > 0 ? (
                <div className="space-y-1.5 border-t border-border pt-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Selected serials
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedList.slice(0, 12).map((unit) => (
                      <button
                        key={unit.id}
                        type="button"
                        className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-xs hover:bg-muted"
                        onClick={() => toggle(unit)}
                        title="Click to remove"
                      >
                        {unit.serial} ×
                      </button>
                    ))}
                    {selectedList.length > 12 ? (
                      <span className="px-1 text-xs text-muted-foreground">
                        +{selectedList.length - 12} more
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </FormField>

          <FormField label="Note">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Optional context for the office"
            />
          </FormField>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => void handleCreate(false)}
          >
            Save draft
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() => void handleCreate(true)}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
