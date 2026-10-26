"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestReportChanges } from "@/lib/api";

interface RequestChangesDialogProps {
  reportId: string;
  onClose: () => void;
  /** Called once the API accepted the request. */
  onSent: () => void;
}

/** Notes + confirm dialog. Mount only while open so the notes reset. */
export function RequestChangesDialog({
  reportId,
  onClose,
  onSent,
}: RequestChangesDialogProps) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function send() {
    setSaving(true);
    const result = await requestReportChanges(reportId, notes);
    setSaving(false);

    if (!result.ok) {
      toast.error("Could not request changes", { description: result.error });
      return;
    }
    toast.success("Changes requested");
    onSent();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request changes</DialogTitle>
          <DialogDescription>
            Send this report back to the coordinator with clear revision notes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="review-notes">Notes for TC</Label>
          <Textarea
            id="review-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="What needs to change before resubmit?"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!notes.trim() || saving}
            onClick={() => void send()}
          >
            {saving ? "Sending…" : "Send back"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
