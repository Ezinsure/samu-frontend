"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canManageCoap,
  getOnboardingById,
  onboardingStatusTone,
  updateOnboardingCase,
  type OnboardingListItem,
} from "@/lib/api";
import {
  ONBOARDING_STATUS_LABELS,
  serviceLineLabel,
} from "@/lib/coap/catalog";
import type { OnboardingStatus } from "@/types";

export default function OnboardingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canWrite = canManageCoap(user) && user?.role !== "MD_VIEWER";
  const [item, setItem] = useState<OnboardingListItem | null | undefined>(
    undefined,
  );
  const [status, setStatus] = useState<OnboardingStatus>("in_progress");
  const [stageLabel, setStageLabel] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void getOnboardingById(id, user).then((result) => {
      if (!active) return;
      setItem(result);
      if (result) {
        setStatus(result.status);
        setStageLabel(result.stageLabel);
      }
    });
    return () => {
      active = false;
    };
  }, [id, user]);

  if (item === undefined) return <Skeleton className="h-64 w-full" />;
  if (!item) {
    return (
      <div className="space-y-4">
        <PageHeader title="Case not found" />
        <Button asChild variant="secondary">
          <Link href="/onboarding">Back</Link>
        </Button>
      </div>
    );
  }

  async function saveProgress() {
    if (!item) return;
    setSaving(true);
    try {
      const updated = await updateOnboardingCase(
        item.id,
        {
          serviceLine: item.serviceLine,
          kind: item.kind,
          status,
          customerName: item.customerName,
          customerPhone: item.customerPhone,
          geo: item.geo,
          stageLabel,
          notes: item.notes,
          leadId: item.leadId,
          agentId: item.agentId,
        },
        user,
      );
      setItem({ ...updated, tcName: item.tcName });
      toast.success("Onboarding updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update case",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.customerName}
        description={`${serviceLineLabel(item.serviceLine)} · ${item.kind.replaceAll("_", " ")}`}
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/onboarding">All cases</Link>
            </Button>
            {canWrite ? (
              <Button asChild>
                <Link href={`/sales/new?service=${item.serviceLine}&onboardingId=${item.id}`}>
                  Record sale
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <StatusBadge
        label={ONBOARDING_STATUS_LABELS[item.status]}
        tone={onboardingStatusTone(item.status)}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Phone" value={item.customerPhone} />
            <Row label="Coordinator" value={item.tcName} />
            <Row
              label="Location"
              value={`${item.geo.district} · ${item.geo.sector}`}
            />
            {item.notes ? <Row label="Notes" value={item.notes} /> : null}
          </CardContent>
        </Card>

        {canWrite ? (
          <Card>
            <CardHeader>
              <CardTitle>Update progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as OnboardingStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ONBOARDING_STATUS_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stage">Stage</Label>
                <Input
                  id="stage"
                  value={stageLabel}
                  onChange={(e) => setStageLabel(e.target.value)}
                />
              </div>
              <Button type="button" onClick={() => void saveProgress()} disabled={saving}>
                {saving ? "Saving…" : "Save progress"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Stage</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">{item.stageLabel}</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-foreground-secondary">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
