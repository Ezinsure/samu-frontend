"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canReviewReport,
  createMonthlyReport,
  getReportFilterOptions,
  previousPeriod,
} from "@/lib/api";
import { useUserData } from "@/lib/hooks/use-user-data";

/** Body of the dialog — mounted only while open so the form resets each time. */
function CreateReportForm({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const needsCoordinator = canReviewReport(user);

  const [period, setPeriod] = useState(previousPeriod());
  const [tcUserId, setTcUserId] = useState("");
  const [saving, setSaving] = useState(false);

  const options = useUserData(
    () => getReportFilterOptions(),
    "report-options",
  );

  async function submit() {
    setSaving(true);
    const result = await createMonthlyReport({
      period,
      tcUserId: needsCoordinator ? tcUserId : undefined,
    });
    setSaving(false);

    if (!result.ok) {
      toast.error("Could not start the report", { description: result.error });
      return;
    }
    toast.success(`Report ${result.data.period} ready`, {
      description: "KPIs were calculated from your visits and COAP records.",
    });
    router.push(`/monthly-reports/${result.data.id}`);
  }

  const invalid = !/^\d{4}-\d{2}$/.test(period) || (needsCoordinator && !tcUserId);

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="report-period">Reporting month</Label>
          <Input
            id="report-period"
            type="month"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          />
        </div>
        {needsCoordinator ? (
          <div className="space-y-2">
            <Label>Territory coordinator</Label>
            <Select value={tcUserId} onValueChange={setTcUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select coordinator" />
              </SelectTrigger>
              <SelectContent>
                {(options.data?.coordinators ?? []).map((tc) => (
                  <SelectItem key={tc.id} value={tc.id}>
                    {tc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={invalid || saving}
          onClick={() => void submit()}
        >
          {saving ? "Starting…" : "Start report"}
        </Button>
      </DialogFooter>
    </>
  );
}

/** "New report" button + dialog; opens the existing report if the month is already started. */
export function CreateReportDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New report
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a monthly report</DialogTitle>
            <DialogDescription>
              Pick the reporting month. If a report already exists for it, you
              will be taken to that one.
            </DialogDescription>
          </DialogHeader>
          {open ? <CreateReportForm onClose={() => setOpen(false)} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
