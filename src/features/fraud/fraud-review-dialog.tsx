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
import { reviewFraudFlag, type FraudReviewAction } from "@/lib/api";

const COPY: Record<
  FraudReviewAction,
  { title: string; description: string; success: string }
> = {
  accept: {
    title: "Accept visit",
    description:
      "Clears the flag as resolved and sets the visit validation to accepted.",
    success: "Flag accepted — visit cleared",
  },
  escalate: {
    title: "Escalate flag",
    description: "Marks the flag escalated with high severity for further review.",
    success: "Flag escalated",
  },
  dismiss: {
    title: "Dismiss flag",
    description: "Closes the flag as a false positive and accepts the visit.",
    success: "Flag dismissed",
  },
};

interface FraudReviewDialogProps {
  flagId: string;
  action: FraudReviewAction;
  onClose: () => void;
  /** Called after the API accepted the review. */
  onReviewed: (action: FraudReviewAction) => void;
}

/** Notes + confirm dialog. Mount it only while an action is selected so the notes reset. */
export function FraudReviewDialog({
  flagId,
  action,
  onClose,
  onReviewed,
}: FraudReviewDialogProps) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const copy = COPY[action];

  async function confirm() {
    setSaving(true);
    const result = await reviewFraudFlag(flagId, action, notes);
    setSaving(false);

    if (!result.ok) {
      toast.error("Could not save review", { description: result.error });
      return;
    }
    toast.success(copy.success, {
      description: "Audit log updated with your review notes.",
    });
    onReviewed(action);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="review-notes">Review notes</Label>
          <Textarea
            id="review-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Explain the decision…"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!notes.trim() || saving}
            onClick={() => void confirm()}
          >
            {saving ? "Saving…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
