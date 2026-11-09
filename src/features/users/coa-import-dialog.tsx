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
  previewCoaImport,
  type CoaImportPreview,
  type CoaImportPreviewStatus,
  type CoaImportResult,
} from "@/lib/api/users";
import { getErrorMessage } from "@/lib/http/client";

interface CoaImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

function statusLabel(status: CoaImportPreviewStatus): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "invalid":
      return "Invalid";
    case "duplicate_in_file":
      return "Duplicate";
    case "exists":
      return "Exists";
    default:
      return status;
  }
}

export function CoaImportDialog({
  open,
  onClose,
  onImported,
}: CoaImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<CoaImportPreview | null>(null);
  const [result, setResult] = useState<CoaImportResult | null>(null);

  function reset() {
    setFile(null);
    setPreview(null);
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

  async function onPreview() {
    if (!file) {
      toast.error("Choose a CSV or Excel file first");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const outcome = await previewCoaImport(file);
      if (!outcome.ok) {
        toast.error("Preview failed", { description: outcome.error });
        return;
      }
      setPreview(outcome.data);
      if (outcome.data.ready === 0) {
        toast.warning("No rows ready to import", {
          description: "Fix invalid or duplicate rows, then preview again.",
        });
      }
    } catch (err) {
      toast.error("Preview failed", { description: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmImport() {
    if (!file || !preview || preview.ready === 0) {
      toast.error("Preview a file with at least one ready row first");
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
      setPreview(null);
      const { created, skipped, invites } = outcome.data;
      if (created > 0) {
        toast.success(
          `Created ${created} COA account${created === 1 ? "" : "s"}`,
          {
            description:
              invites.sent > 0
                ? `${invites.sent} branded email${invites.sent === 1 ? "" : "s"} sent with temporary passwords.`
                : invites.not_configured > 0
                  ? "Accounts created, but email is not configured on the server."
                  : invites.failed > 0
                    ? "Some emails failed — use Send reset link to retry."
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
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import COA accounts</DialogTitle>
          <DialogDescription>
            Upload Excel/CSV, preview normalized rows, then create accounts.
            Each new COA gets a branded email with a temporary password and must
            change it after first sign-in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-foreground-secondary">
            Accepted columns:{" "}
            <span className="font-medium text-foreground">
              Full Names, Email, Phone Number, ID Number, Working District
              Location
            </span>{" "}
            (or name / email / phone / nid / workingDistrict). Phones are
            normalized to <span className="font-medium text-foreground">07…</span>.
            Max 500 rows.
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
                setPreview(null);
                setResult(null);
                setFile(e.target.files?.[0] ?? null);
              }}
            />
            {file ? (
              <p className="text-xs text-foreground-muted">{file.name}</p>
            ) : null}
          </div>

          {preview ? (
            <div className="space-y-2 rounded-md border border-border p-3">
              <p className="text-sm font-medium">
                Preview · {preview.ready} ready · {preview.invalid} invalid ·{" "}
                {preview.duplicates} duplicate · {preview.exists} already exist
              </p>
              <div className="max-h-64 overflow-auto rounded border border-border">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="sticky top-0 bg-muted text-foreground-secondary">
                    <tr>
                      <th className="px-2 py-1.5 font-medium">Row</th>
                      <th className="px-2 py-1.5 font-medium">Name</th>
                      <th className="px-2 py-1.5 font-medium">Email</th>
                      <th className="px-2 py-1.5 font-medium">Phone</th>
                      <th className="px-2 py-1.5 font-medium">NID</th>
                      <th className="px-2 py-1.5 font-medium">District</th>
                      <th className="px-2 py-1.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr
                        key={`${row.row}-${row.email}`}
                        className="border-t border-border align-top"
                      >
                        <td className="px-2 py-1.5">{row.row}</td>
                        <td className="px-2 py-1.5">{row.name || "—"}</td>
                        <td className="px-2 py-1.5">{row.email || "—"}</td>
                        <td className="px-2 py-1.5 font-mono">{row.phone || "—"}</td>
                        <td className="px-2 py-1.5 font-mono">{row.nid || "—"}</td>
                        <td className="px-2 py-1.5">{row.workingDistrict || "—"}</td>
                        <td className="px-2 py-1.5">
                          <span
                            className={
                              row.status === "ready"
                                ? "text-emerald-700"
                                : "text-amber-700"
                            }
                          >
                            {statusLabel(row.status)}
                          </span>
                          {row.reason ? (
                            <span className="mt-0.5 block text-foreground-muted">
                              {row.reason}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {result ? (
            <div className="space-y-2 rounded-md border border-border p-3">
              <p className="text-sm font-medium">
                {result.created} created · {result.skipped} skipped ·{" "}
                {result.invites.sent} emails sent
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

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="secondary" disabled={busy} onClick={handleClose}>
            {result ? "Close" : "Cancel"}
          </Button>
          {result ? (
            <Button type="button" variant="secondary" disabled={busy} onClick={reset}>
              Import another file
            </Button>
          ) : preview ? (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setPreview(null);
                }}
              >
                Back
              </Button>
              <Button
                type="button"
                disabled={busy || preview.ready === 0}
                onClick={() => void onConfirmImport()}
              >
                {busy
                  ? "Creating…"
                  : `Create ${preview.ready} account${preview.ready === 1 ? "" : "s"}`}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              disabled={busy || !file}
              onClick={() => void onPreview()}
            >
              {busy ? "Reading…" : "Preview"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
