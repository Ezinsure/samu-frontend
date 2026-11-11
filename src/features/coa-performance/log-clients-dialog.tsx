"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
  CLIENT_FIELD_REQUIREMENTS,
  createCoaEntry,
  type ClientRowInput,
} from "@/lib/api/coa-performance";
import type { CoaMetric, CoaMetricVariant } from "@/lib/api/coa-metrics";

type ClientFormField =
  | "fullName"
  | "phone"
  | "email"
  | "nidNumber"
  | "accountRef"
  | "simNumber";

const emptyClient = (): ClientRowInput => ({
  fullName: "",
  phone: "",
  email: "",
  nidNumber: "",
  accountRef: "",
  simNumber: "",
});

const FIELD_LABELS: Record<ClientFormField, string> = {
  fullName: "Full name",
  phone: "Phone",
  email: "Email",
  nidNumber: "National ID",
  accountRef: "Bank account number",
  simNumber: "4G SIM number",
};

interface LogClientsDialogProps {
  metric: CoaMetric | null;
  /** When set (e.g. SIM internet), sent with the entry. */
  variant?: CoaMetricVariant | null;
  month: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function LogClientsDialog({
  metric,
  variant = null,
  month,
  open,
  onOpenChange,
  onSaved,
}: LogClientsDialogProps) {
  const [clients, setClients] = useState<ClientRowInput[]>([emptyClient()]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const requiredExtra = useMemo((): ClientFormField[] => {
    if (variant?.fieldSchema?.length) {
      return variant.fieldSchema
        .filter((f) => f.mapsTo && f.mapsTo !== "fullName" && f.required)
        .map((f) => f.mapsTo as ClientFormField);
    }
    return (metric
      ? CLIENT_FIELD_REQUIREMENTS[metric.key] ?? ["phone"]
      : ["phone"]) as ClientFormField[];
  }, [metric, variant]);

  const visibleFields = useMemo((): ClientFormField[] => {
    if (variant?.fieldSchema?.length) {
      const mapped = variant.fieldSchema
        .map((f) => f.mapsTo)
        .filter(Boolean) as ClientFormField[];
      return [...new Set<ClientFormField>(["fullName", ...mapped])];
    }
    return [...new Set<ClientFormField>(["fullName", ...requiredExtra])];
  }, [requiredExtra, variant]);

  function reset() {
    setClients([emptyClient()]);
    setNotes("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!metric) return;

    for (const [i, client] of clients.entries()) {
      if (!String(client.fullName ?? "").trim()) {
        toast.error(`Client ${i + 1}: name is required`);
        return;
      }
      for (const field of requiredExtra) {
        if (!String(client[field] ?? "").trim()) {
          toast.error(`Client ${i + 1}: ${FIELD_LABELS[field]} is required`);
          return;
        }
      }
    }

    setSaving(true);
    const result = await createCoaEntry({
      metricKey: metric.key,
      month,
      variantKey: variant?.key,
      notes: notes.trim() || undefined,
      clients: clients.map((c) => ({
        fullName: c.fullName?.trim() || "",
        phone: c.phone?.trim() || undefined,
        email: c.email?.trim() || undefined,
        nidNumber: c.nidNumber?.trim() || undefined,
        accountRef: c.accountRef?.trim() || undefined,
        simNumber: c.simNumber?.trim() || undefined,
        variantKey: variant?.key,
      })),
    });
    setSaving(false);

    if (!result.ok) {
      toast.error("Could not save", { description: result.error });
      return;
    }

    toast.success(`Logged ${clients.length} client${clients.length === 1 ? "" : "s"}`);
    reset();
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Log {variant?.label ?? metric?.label ?? "performance"}
          </DialogTitle>
          <DialogDescription>
            Add one or more clients for {month}. Required fields depend on this
            service line.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          {clients.map((client, index) => (
            <div
              key={index}
              className="space-y-3 rounded-[var(--radius-lg)] border border-border p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Client {index + 1}</p>
                {clients.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setClients((rows) => rows.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {visibleFields.map((field) => (
                  <FormField
                    key={field}
                    label={FIELD_LABELS[field]}
                    required={field === "fullName" || requiredExtra.includes(field)}
                    className={field === "fullName" ? "sm:col-span-2" : undefined}
                  >
                    <Input
                      value={String(client[field] ?? "")}
                      onChange={(e) =>
                        setClients((rows) =>
                          rows.map((row, i) =>
                            i === index
                              ? { ...row, [field]: e.target.value }
                              : row,
                          ),
                        )
                      }
                      required={
                        field === "fullName" || requiredExtra.includes(field)
                      }
                      type={field === "email" ? "email" : "text"}
                    />
                  </FormField>
                ))}
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setClients((rows) => [...rows, emptyClient()])}
          >
            <Plus className="h-4 w-4" />
            Add another client
          </Button>

          <FormField label="Notes (optional)">
            <textarea
              className="min-h-16 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save evidence"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
