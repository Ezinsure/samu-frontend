"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
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
  downloadCoaImportTemplate,
  importCoaAccounts,
  type CoaImportResult,
} from "@/lib/api/users";
import { getErrorMessage } from "@/lib/http/client";

interface CoaImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function CoaImportDialog({
  open,
  onClose,
  onImported,
}: CoaImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CoaImportResult | null>(null);

  function reset() {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleClose() {
    if (busy) return;
    reset();
    onClose();
  }

  async function onDownloadTemplate() {
    try {
      await downloadCoaImportTemplate();
    } catch (err) {
      toast.error("Could not download template", {
        description: getErrorMessage(err),
      });
    }
  }

  async function onSubmit() {
    if (!file) {
      toast.error("Choose a CSV or Excel file first");
      return;
    }
    setBusy(true);
    try {
      const outcome = await importCoaAccounts(file);
      if (!outcome.ok) {
        toast.error("Import failed", { description: outcome.error });
        return;
      }
      setResult(outcome.data);
      const { created, skipped, invites } = outcome.data;
      if (created > 0) {
        toast.success(
          `Created ${created} COA account${created === 1 ? "" : "s"}`,
          {
            description:
              invites.sent > 0
                ? `${invites.sent} set-password invite${invites.sent === 1 ? "" : "s"} emailed.`
                : invites.not_configured > 0
                  ? "Accounts created, but email is not configured on the server."
                  : invites.failed > 0
                    ? "Some invite emails failed — use Send reset link to retry."
                    : undefined,
          },
        );
        onImported();
      } else {
        toast.warning("No accounts created", {
          description:
            skipped > 0
              ? `${skipped} row${skipped === 1 ? "" : "s"} skipped. Check the results below.`
              : undefined,
        });
      }
    } catch (err) {
      toast.error("Import failed", { description: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import COA accounts</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with name, email, phone, working
            district, and optional NID. Each new account gets a set-password
            invite by email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-foreground-secondary">
            Columns:{" "}
            <span className="font-medium text-foreground">
              name, email, phone, nid, workingDistrict
            </span>
            . Max 500 rows. Existing emails are skipped.
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void onDownloadTemplate()}
            >
              Download template
            </Button>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-foreground-secondary" htmlFor="coa-file">
              File (.csv, .xlsx)
            </label>
            <input
              id="coa-file"
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground-on-primary"
              disabled={busy}
              onChange={(e) => {
                setResult(null);
                setFile(e.target.files?.[0] ?? null);
              }}
            />
            {file ? (
              <p className="text-xs text-foreground-muted">{file.name}</p>
            ) : null}
          </div>

          {result ? (
            <div className="space-y-2 rounded-md border border-border p-3">
              <p className="text-sm font-medium">
                {result.created} created · {result.skipped} skipped ·{" "}
                {result.invites.sent} invites sent
              </p>
              <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-foreground-secondary">
                {result.rows.map((row) => (
                  <li key={`${row.row}-${row.email}`}>
                    Row {row.row}: {row.email}
                    {row.status === "created"
                      ? ` — created (${row.invite ?? "invite unknown"})`
                      : ` — skipped${row.reason ? ` (${row.reason})` : ""}`}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" disabled={busy} onClick={handleClose}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result ? (
            <Button
              type="button"
              disabled={busy || !file}
              onClick={() => void onSubmit()}
            >
              {busy ? "Importing…" : "Import COAs"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={reset}
            >
              Import another file
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
