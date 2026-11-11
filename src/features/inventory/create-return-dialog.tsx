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
  createStockReturn,
  getAvailableStockUnits,
  type AvailableStockUnit,
  type ReturnReasonCode,
} from "@/lib/api/stock";

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
  const [units, setUnits] = useState<AvailableStockUnit[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [reasonCode, setReasonCode] = useState<ReturnReasonCode>("no_sales");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setReasonCode("no_sales");
    setNote("");
    setLoading(true);
    void getAvailableStockUnits({ pageSize: 100 })
      .then((page) => setUnits(page.data))
      .catch((err) => {
        toast.error("Could not load returnable units", {
          description: err instanceof Error ? err.message : undefined,
        });
      })
      .finally(() => setLoading(false));
  }, [open]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleCreate(submit: boolean) {
    if (selected.length === 0) {
      toast.error("Select at least one serial");
      return;
    }
    setSaving(true);
    const result = await createStockReturn({
      unitIds: selected,
      reasonCode,
      note: note.trim() || undefined,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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

          <FormField label="Devices" required>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-[var(--radius-md)] border border-border p-2">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : units.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No returnable units in hand.
                </p>
              ) : (
                units.map((unit) => (
                  <label
                    key={unit.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/40"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSet.has(unit.id)}
                      onChange={() => toggle(unit.id)}
                    />
                    <span className="font-mono">{unit.serial}</span>
                    <span className="text-muted-foreground">
                      {unit.type.label}
                    </span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {selected.length} selected
            </p>
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
