"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { DetailRow } from "@/components/shared/detail-row";
import { FormField } from "@/components/shared/form-field";
import { OptionSelect } from "@/components/shared/option-select";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  onboardingStatusTone,
  updateOnboardingCase,
  type OnboardingListItem,
} from "@/lib/api";
import {
  ONBOARDING_KIND_LABELS,
  ONBOARDING_STATUS_LABELS,
  labelsToOptions,
  serviceLineLabel,
} from "@/lib/coap/catalog";
import type { OnboardingStatus } from "@/types";

const STATUS_OPTIONS = labelsToOptions(ONBOARDING_STATUS_LABELS);

/** Status + stage editor. Mount with `key` so it resets when the record reloads. */
function ProgressCard({
  item,
  onSaved,
}: {
  item: OnboardingListItem;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<OnboardingStatus>(item.status);
  const [stageLabel, setStageLabel] = useState(item.stageLabel);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    // The API replaces the whole record, so unchanged fields are sent back as-is.
    const result = await updateOnboardingCase(item.id, {
      serviceLine: item.serviceLine,
      kind: item.kind,
      status,
      customerName: item.customerName,
      customerPhone: item.customerPhone,
      geo: item.geo,
      stageLabel: stageLabel.trim() || item.stageLabel,
      notes: item.notes,
      leadId: item.leadId,
      agentId: item.agentId,
    });
    setSaving(false);

    if (!result.ok) {
      toast.error("Could not update case", { description: result.error });
      return;
    }
    toast.success("Onboarding updated");
    onSaved();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <FormField label="Status">
          <OptionSelect
            value={status}
            onChange={(value) => setStatus(value as OnboardingStatus)}
            options={STATUS_OPTIONS}
          />
        </FormField>
        <FormField label="Stage" htmlFor="stage">
          <Input
            id="stage"
            value={stageLabel}
            onChange={(event) => setStageLabel(event.target.value)}
          />
        </FormField>
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save progress"}
        </Button>
      </CardContent>
    </Card>
  );
}

interface OnboardingDetailProps {
  item: OnboardingListItem;
  canWrite: boolean;
  /** Refetch the record after a successful save. */
  onSaved: () => void;
}

/** Onboarding case summary with an inline progress editor for writers. */
export function OnboardingDetail({ item, canWrite, onSaved }: OnboardingDetailProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={item.customerName}
        description={`${serviceLineLabel(item.serviceLine)} · ${ONBOARDING_KIND_LABELS[item.kind] ?? item.kind}`}
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/onboarding">All cases</Link>
            </Button>
            {canWrite ? (
              <Button asChild>
                <Link
                  href={`/sales/new?service=${item.serviceLine}&onboardingId=${item.id}`}
                >
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
            <DetailRow label="Phone" value={item.customerPhone} />
            <DetailRow label="Coordinator" value={item.tcName} />
            <DetailRow
              label="Location"
              value={`${item.geo.district} · ${item.geo.sector}`}
            />
            {item.notes ? <DetailRow label="Notes" value={item.notes} /> : null}
          </CardContent>
        </Card>

        {canWrite ? (
          <ProgressCard
            key={`${item.status}:${item.updatedAt}`}
            item={item}
            onSaved={onSaved}
          />
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
