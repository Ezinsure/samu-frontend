"use client";

import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  evidenceTypeLabel,
  updateCoaMetric,
  type CoaMetric,
} from "@/lib/api/coa-metrics";

interface MetricEditDialogProps {
  metric: CoaMetric | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (metric: CoaMetric) => void;
}

export function MetricEditDialog({
  metric,
  open,
  onOpenChange,
  onSaved,
}: MetricEditDialogProps) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [monthlyTarget, setMonthlyTarget] = useState("0");
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!metric) return;
    setLabel(metric.label);
    setDescription(metric.description ?? "");
    setAdminNote(metric.adminNote ?? "");
    setMonthlyTarget(String(metric.monthlyTarget));
    setEnabled(metric.enabled);
  }, [metric]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!metric) return;
    const target = Number(monthlyTarget);
    if (!Number.isFinite(target) || target < 0) {
      toast.error("Monthly target must be a non-negative number");
      return;
    }
    if (label.trim().length < 2) {
      toast.error("Label is required");
      return;
    }

    setSaving(true);
    const result = await updateCoaMetric(metric.key, {
      label: label.trim(),
      description: description.trim() || null,
      adminNote: adminNote.trim() || null,
      monthlyTarget: target,
      enabled,
    });
    setSaving(false);

    if (!result.ok) {
      toast.error("Could not save metric", { description: result.error });
      return;
    }

    toast.success("Metric updated");
    onSaved(result.data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit metric</DialogTitle>
          <DialogDescription>
            {metric
              ? `${metric.key} · ${evidenceTypeLabel(metric.evidenceType)}`
              : "Update shared COA imihigo settings"}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(e) => void handleSave(e)}>
          <FormField label="Label" htmlFor="metric-label" required>
            <Input
              id="metric-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Monthly target" htmlFor="metric-target" required>
            <Input
              id="metric-target"
              type="number"
              min={0}
              value={monthlyTarget}
              onChange={(e) => setMonthlyTarget(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Description" htmlFor="metric-description">
            <textarea
              id="metric-description"
              className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          <FormField label="Admin note" htmlFor="metric-note">
            <textarea
              id="metric-note"
              className="min-h-16 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Shown to admins (e.g. priority guidance)"
            />
          </FormField>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Enabled for COAs</p>
              <p className="text-xs text-foreground-muted">
                Disabled metrics stay in the catalog but are hidden from logging
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
