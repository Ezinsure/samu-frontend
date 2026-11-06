"use client";

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
import type { CoaMetric } from "@/lib/api/coa-metrics";

interface LogFilePlaceholderDialogProps {
  metric: CoaMetric | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** File uploads land in Phase 4 — keep UX honest until R2 wiring ships. */
export function LogFilePlaceholderDialog({
  metric,
  open,
  onOpenChange,
}: LogFilePlaceholderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{metric?.label ?? "Document evidence"}</DialogTitle>
          <DialogDescription>
            Signed agreements and certificates will upload here next. Progress
            for this metric counts each attached file once uploads are live.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-foreground-secondary">
          You can still track other service lines that use client details today.
        </p>
        <DialogFooter>
          <Button
            type="button"
            onClick={() => {
              toast.info("Document upload opens in the next release");
              onOpenChange(false);
            }}
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
