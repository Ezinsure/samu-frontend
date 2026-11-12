"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { StatusBadge } from "@/components/shared/status-badge";
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
import {
  intakeStockUnits,
  parseSerialList,
  previewStockIntake,
  type IntakePreview,
  type StockItemType,
} from "@/lib/api/stock";
import type { StatusTone } from "@/components/shared/status-badge";

interface IntakeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  types: StockItemType[];
  defaultTypeKey?: string;
  onCompleted: () => void;
}

function previewTone(
  status: IntakePreview["rows"][number]["status"],
): StatusTone {
  if (status === "ready") return "success";
  if (status === "exists" || status === "duplicate_in_file") return "warning";
  return "danger";
}

function previewLabel(
  status: IntakePreview["rows"][number]["status"],
): string {
  if (status === "ready") return "Ready";
  if (status === "exists") return "Exists";
  if (status === "duplicate_in_file") return "Duplicate";
  return "Invalid";
}

export function IntakeDialog({
  open,
  onOpenChange,
  types,
  defaultTypeKey,
  onCompleted,
}: IntakeDialogProps) {
  const enabledTypes = useMemo(
    () => types.filter((t) => t.enabled),
    [types],
  );
  const [typeKey, setTypeKey] = useState("");
  const [serialText, setSerialText] = useState("");
  const [condition, setCondition] = useState("");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<IntakePreview | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTypeKey(defaultTypeKey || enabledTypes[0]?.key || "");
    setSerialText("");
    setCondition("");
    setNotes("");
    setPreview(null);
  }, [open, defaultTypeKey, enabledTypes]);

  const serials = useMemo(() => parseSerialList(serialText), [serialText]);

  async function handlePreview() {
    if (!typeKey) {
      toast.error("Choose a device type");
      return;
    }
    if (serials.length === 0) {
      toast.error("Paste at least one serial number");
      return;
    }
    setChecking(true);
    const result = await previewStockIntake({ typeKey, serials });
    setChecking(false);
    if (!result.ok) {
      toast.error("Could not preview intake", { description: result.error });
      return;
    }
    setPreview(result.data);
    if (result.data.ready === 0) {
      toast.message("No new serials to intake", {
        description: "Fix duplicates or existing units, then preview again.",
      });
    }
  }

  async function handleIntake() {
    if (!typeKey || !preview || preview.ready === 0) return;
    setSaving(true);
    const result = await intakeStockUnits({
      typeKey,
      serials,
      condition: condition.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error("Could not intake units", { description: result.error });
      return;
    }
    toast.success(
      `Intaked ${result.data.created} unit${result.data.created === 1 ? "" : "s"}`,
      result.data.skipped
        ? { description: `${result.data.skipped} skipped` }
        : undefined,
    );
    onOpenChange(false);
    onCompleted();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Intake devices</DialogTitle>
          <DialogDescription>
            Paste serial numbers to add them to warehouse stock. Existing and
            duplicate serials are skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormField label="Device type" htmlFor="intake-type" required>
            <Select value={typeKey} onValueChange={setTypeKey}>
              <SelectTrigger id="intake-type">
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

          <FormField label="Serial numbers" htmlFor="intake-serials" required>
            <Textarea
              id="intake-serials"
              value={serialText}
              onChange={(e) => {
                setSerialText(e.target.value);
                setPreview(null);
              }}
              placeholder={"One per line, or comma-separated\nSIM001\nSIM002"}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {serials.length} serial{serials.length === 1 ? "" : "s"} detected
            </p>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Condition" htmlFor="intake-condition">
              <Input
                id="intake-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g. new, sealed"
              />
            </FormField>
            <FormField label="Notes" htmlFor="intake-notes">
              <Input
                id="intake-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional batch note"
              />
            </FormField>
          </div>

          {preview ? (
            <div className="space-y-3 rounded-[var(--radius-md)] border border-border p-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <StatusBadge
                  label={`${preview.ready} ready`}
                  tone="success"
                  showIcon={false}
                />
                <StatusBadge
                  label={`${preview.exists} exists`}
                  tone="warning"
                  showIcon={false}
                />
                <StatusBadge
                  label={`${preview.duplicates} duplicates`}
                  tone="warning"
                  showIcon={false}
                />
                <StatusBadge
                  label={`${preview.invalid} invalid`}
                  tone="danger"
                  showIcon={false}
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-background text-muted-foreground">
                    <tr>
                      <th className="py-1.5 pr-2 font-medium">Serial</th>
                      <th className="py-1.5 pr-2 font-medium">Status</th>
                      <th className="py-1.5 font-medium">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, index) => (
                      <tr key={`${row.serial}-${index}`} className="border-t border-border/60">
                        <td className="py-1.5 pr-2 font-mono">{row.serial}</td>
                        <td className="py-1.5 pr-2">
                          <StatusBadge
                            label={previewLabel(row.status)}
                            tone={previewTone(row.status)}
                            showIcon={false}
                          />
                        </td>
                        <td className="py-1.5 text-muted-foreground">
                          {row.reason ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handlePreview()}
            disabled={checking || saving}
          >
            {checking ? "Checking…" : "Preview"}
          </Button>
          <Button
            type="button"
            onClick={() => void handleIntake()}
            disabled={
              saving || checking || !preview || preview.ready === 0
            }
          >
            {saving
              ? "Intaking…"
              : preview
                ? `Intake ${preview.ready}`
                : "Intake"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
