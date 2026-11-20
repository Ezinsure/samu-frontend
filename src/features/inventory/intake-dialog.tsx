"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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

type IntakeLineState = {
  id: string;
  typeKey: string;
  serialText: string;
  condition: string;
  attributes: Record<string, string>;
};

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

function newLine(typeKey: string): IntakeLineState {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    typeKey,
    serialText: "",
    condition: "",
    attributes: {},
  };
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
  const typeByKey = useMemo(
    () => new Map(enabledTypes.map((t) => [t.key, t])),
    [enabledTypes],
  );

  const [lines, setLines] = useState<IntakeLineState[]>([]);
  const [notes, setNotes] = useState("");
  const [label, setLabel] = useState("");
  const [supplierRef, setSupplierRef] = useState("");
  const [receivedAt, setReceivedAt] = useState("");
  const [preview, setPreview] = useState<IntakePreview | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const initialType = defaultTypeKey || enabledTypes[0]?.key || "";
    setLines([newLine(initialType)]);
    setNotes("");
    setLabel("");
    setSupplierRef("");
    setReceivedAt(new Date().toISOString().slice(0, 10));
    setPreview(null);
  }, [open, defaultTypeKey, enabledTypes]);

  function patchLine(id: string, patch: Partial<IntakeLineState>) {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
    setPreview(null);
  }

  function setAttribute(id: string, key: string, value: string) {
    setLines((prev) =>
      prev.map((line) =>
        line.id === id
          ? {
              ...line,
              attributes: { ...line.attributes, [key]: value },
            }
          : line,
      ),
    );
    setPreview(null);
  }

  async function handlePreview() {
    for (const [index, line] of lines.entries()) {
      const type = typeByKey.get(line.typeKey);
      if (!type) {
        toast.error(`Line ${index + 1}: choose a device type`);
        return;
      }
      for (const field of type.attributesSchema?.fields ?? []) {
        if (field.required && !String(line.attributes[field.key] ?? "").trim()) {
          toast.error(`Line ${index + 1}: ${field.label} is required`);
          return;
        }
      }
      if (parseSerialList(line.serialText).length === 0) {
        toast.error(`Line ${index + 1}: paste at least one serial`);
        return;
      }
    }

    setChecking(true);
    const result = await previewStockIntake({
      lines: lines.map((line) => ({
        typeKey: line.typeKey,
        serials: parseSerialList(line.serialText),
      })),
    });
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
    if (!preview || preview.ready === 0) return;
    setSaving(true);
    const result = await intakeStockUnits({
      label: label.trim() || undefined,
      supplierRef: supplierRef.trim() || undefined,
      receivedAt: receivedAt.trim() || undefined,
      notes: notes.trim() || undefined,
      lines: lines.map((line) => ({
        typeKey: line.typeKey,
        serials: parseSerialList(line.serialText),
        condition: line.condition.trim() || undefined,
        attributes: Object.fromEntries(
          Object.entries(line.attributes)
            .map(([k, v]) => [k, v.trim()])
            .filter(([, v]) => Boolean(v)),
        ),
      })),
    });
    setSaving(false);
    if (!result.ok) {
      toast.error("Could not intake units", { description: result.error });
      return;
    }
    toast.success(
      `Intaked ${result.data.created} unit${result.data.created === 1 ? "" : "s"}`,
      {
        description: [
          result.data.batchLabel ? `Batch: ${result.data.batchLabel}` : null,
          result.data.skipped ? `${result.data.skipped} skipped` : null,
        ]
          .filter(Boolean)
          .join(" · ") || undefined,
      },
    );
    onOpenChange(false);
    onCompleted();
  }

  const supportsMultiLine = lines.some(
    (line) => (typeByKey.get(line.typeKey)?.attributesSchema?.fields.length ?? 0) > 0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Intake devices</DialogTitle>
          <DialogDescription>
            Create a tracked intake batch. For smartphones, add one line per
            brand/model with its serials.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Batch label" htmlFor="intake-label">
              <Input
                id="intake-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Auto: Type · Month Year"
              />
            </FormField>
            <FormField label="Received date" htmlFor="intake-received">
              <Input
                id="intake-received"
                type="date"
                value={receivedAt}
                onChange={(e) => setReceivedAt(e.target.value)}
              />
            </FormField>
            <FormField label="Supplier / PO ref" htmlFor="intake-supplier">
              <Input
                id="intake-supplier"
                value={supplierRef}
                onChange={(e) => setSupplierRef(e.target.value)}
                placeholder="Optional invoice or PO"
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

          <div className="space-y-3">
            {lines.map((line, index) => {
              const type = typeByKey.get(line.typeKey);
              const attrFields = type?.attributesSchema?.fields ?? [];
              const serialCount = parseSerialList(line.serialText).length;
              return (
                <div
                  key={line.id}
                  className="space-y-3 rounded-md border border-border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Line {index + 1}</p>
                    {lines.length > 1 ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setLines((prev) =>
                            prev.filter((l) => l.id !== line.id),
                          );
                          setPreview(null);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    ) : null}
                  </div>

                  <FormField label="Device type" required>
                    <Select
                      value={line.typeKey}
                      onValueChange={(typeKey) =>
                        patchLine(line.id, {
                          typeKey,
                          attributes: {},
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {enabledTypes.map((t) => (
                          <SelectItem key={t.key} value={t.key}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  {attrFields.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {attrFields.map((field) => (
                        <FormField
                          key={field.key}
                          label={field.label}
                          required={field.required}
                        >
                          <Input
                            value={line.attributes[field.key] ?? ""}
                            onChange={(e) =>
                              setAttribute(line.id, field.key, e.target.value)
                            }
                            placeholder={field.placeholder}
                            required={field.required}
                          />
                        </FormField>
                      ))}
                    </div>
                  ) : null}

                  <FormField label="Serial numbers" required>
                    <Textarea
                      value={line.serialText}
                      onChange={(e) =>
                        patchLine(line.id, { serialText: e.target.value })
                      }
                      placeholder={
                        "One per line, or comma-separated\nSN001\nSN002"
                      }
                      rows={5}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {serialCount} serial{serialCount === 1 ? "" : "s"} detected
                    </p>
                  </FormField>

                  <FormField label="Condition">
                    <Input
                      value={line.condition}
                      onChange={(e) =>
                        patchLine(line.id, { condition: e.target.value })
                      }
                      placeholder="e.g. new, sealed"
                    />
                  </FormField>
                </div>
              );
            })}
          </div>

          {supportsMultiLine || lines.length > 0 ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                const typeKey =
                  lines[lines.length - 1]?.typeKey ||
                  enabledTypes[0]?.key ||
                  "";
                setLines((prev) => [...prev, newLine(typeKey)]);
                setPreview(null);
              }}
            >
              <Plus className="h-4 w-4" />
              Add line
            </Button>
          ) : null}

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
                      <th className="py-1.5 pr-2 font-medium">Type</th>
                      <th className="py-1.5 pr-2 font-medium">Status</th>
                      <th className="py-1.5 font-medium">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, index) => (
                      <tr
                        key={`${row.serial}-${index}`}
                        className="border-t border-border/60"
                      >
                        <td className="py-1.5 pr-2 font-mono">{row.serial}</td>
                        <td className="py-1.5 pr-2 text-muted-foreground">
                          {row.typeKey
                            ? typeByKey.get(row.typeKey)?.label ?? row.typeKey
                            : "—"}
                        </td>
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
            disabled={saving || checking || !preview || preview.ready === 0}
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
