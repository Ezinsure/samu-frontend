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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  assignTerritoryCoordinator,
  type TerritoryCoordinator,
  type TerritoryWorkspace,
} from "@/lib/api";

interface AssignCoordinatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: TerritoryWorkspace;
  coordinators: TerritoryCoordinator[];
  /** Called after a successful assignment so the parent can reload data. */
  onAssigned: () => void;
}

/** Admin dialog to assign or reassign the coordinator of a district. */
export function AssignCoordinatorDialog({
  open,
  onOpenChange,
  workspace,
  coordinators,
  onAssigned,
}: AssignCoordinatorDialogProps) {
  const [tcUserId, setTcUserId] = useState(workspace.territory.tcUserId ?? "");
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    if (!tcUserId) return;
    setSaving(true);
    const result = await assignTerritoryCoordinator(
      workspace.territory.id,
      tcUserId,
    );
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Territory coordinator updated", {
      description: `${workspace.territory.name} agents were reassigned to the new TC.`,
    });
    onOpenChange(false);
    onAssigned();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {workspace.tcName ? "Reassign coordinator" : "Assign coordinator"}
          </DialogTitle>
          <DialogDescription>
            Assigning a new TC closes the previous territory assignment and
            updates all agents in {workspace.territory.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="tc-select">Territory coordinator</Label>
          <Select value={tcUserId} onValueChange={setTcUserId}>
            <SelectTrigger id="tc-select">
              <SelectValue placeholder="Select coordinator" />
            </SelectTrigger>
            <SelectContent>
              {coordinators.map((coordinator) => (
                <SelectItem key={coordinator.id} value={coordinator.id}>
                  {coordinator.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!tcUserId || saving}
            onClick={() => void handleConfirm()}
          >
            {saving ? "Saving…" : "Confirm assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
