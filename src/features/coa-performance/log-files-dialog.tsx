"use client";

import { useRef, useState } from "react";
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
import { uploadCoaEvidenceFile } from "@/lib/api/coa-performance";
import type { CoaMetric } from "@/lib/api/coa-metrics";

interface LogFilesDialogProps {
  metric: CoaMetric | null;
  month: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const ACCEPT = ".pdf,image/jpeg,image/png,image/webp,application/pdf";

export function LogFilesDialog({
  metric,
  month,
  open,
  onOpenChange,
  onSaved,
}: LogFilesDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setFile(null);
    setNotes("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!metric || !file) {
      toast.error("Choose a PDF or image file");
      return;
    }

    setSaving(true);
    const result = await uploadCoaEvidenceFile({
      metricKey: metric.key,
      month,
      notes: notes.trim() || undefined,
      file,
    });
    setSaving(false);

    if (!result.ok) {
      toast.error("Upload failed", { description: result.error });
      return;
    }

    toast.success("Evidence uploaded");
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload {metric?.label ?? "evidence"}</DialogTitle>
          <DialogDescription>
            Attach a signed agreement, payment proof, or certificate (PDF or
            image, max 10 MB). Each file counts as one toward the monthly
            target.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <FormField label="Document" required>
            <Input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
            {file ? (
              <p className="text-xs text-foreground-muted">
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </p>
            ) : null}
          </FormField>

          <FormField label="Notes (optional)">
            <textarea
              className="min-h-16 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Client name or reference…"
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
            <Button type="submit" disabled={saving || !file}>
              {saving ? "Uploading…" : "Upload evidence"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
