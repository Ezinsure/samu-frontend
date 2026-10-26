"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { OptionSelect } from "@/components/shared/option-select";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  feedbackSeverityTone,
  feedbackStatusTone,
  updateCommunityFeedback,
  type FeedbackListItem,
} from "@/lib/api";
import {
  FEEDBACK_KIND_LABELS,
  FEEDBACK_STATUS_LABELS,
  labelsToOptions,
  serviceLineLabel,
} from "@/lib/coap/catalog";
import type { FeedbackStatus } from "@/types";

const STATUS_OPTIONS = labelsToOptions(FEEDBACK_STATUS_LABELS);

/** Status + resolution editor. Mount with `key` so it resets when the record reloads. */
function StatusCard({
  item,
  onSaved,
}: {
  item: FeedbackListItem;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<FeedbackStatus>(item.status);
  const [resolutionNotes, setResolutionNotes] = useState(
    item.resolutionNotes ?? "",
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    // The API replaces the whole record, so unchanged fields are sent back as-is.
    const result = await updateCommunityFeedback(item.id, {
      serviceLine: item.serviceLine,
      kind: item.kind,
      severity: item.severity,
      status,
      title: item.title,
      description: item.description,
      geo: item.geo,
      leadId: item.leadId,
      resolutionNotes: resolutionNotes.trim() || undefined,
    });
    setSaving(false);

    if (!result.ok) {
      toast.error("Could not update feedback", { description: result.error });
      return;
    }
    toast.success("Feedback updated");
    onSaved();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <FormField label="Status">
          <OptionSelect
            value={status}
            onChange={(value) => setStatus(value as FeedbackStatus)}
            options={STATUS_OPTIONS}
          />
        </FormField>
        <FormField label="Resolution notes" htmlFor="resolution">
          <Textarea
            id="resolution"
            value={resolutionNotes}
            onChange={(event) => setResolutionNotes(event.target.value)}
            rows={3}
          />
        </FormField>
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}

interface FeedbackDetailProps {
  item: FeedbackListItem;
  canWrite: boolean;
  /** Refetch the record after a successful save. */
  onSaved: () => void;
}

/** Feedback summary with an inline status editor for writers. */
export function FeedbackDetail({ item, canWrite, onSaved }: FeedbackDetailProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={item.title}
        description={`${FEEDBACK_KIND_LABELS[item.kind]}${
          item.serviceLine ? ` · ${serviceLineLabel(item.serviceLine)}` : ""
        }`}
        actions={
          <Button asChild variant="secondary">
            <Link href="/feedback">All feedback</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <StatusBadge
          label={item.severity}
          tone={feedbackSeverityTone(item.severity)}
        />
        <StatusBadge label={item.status} tone={feedbackStatusTone(item.status)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-foreground">{item.description}</p>
            <p className="text-foreground-secondary">
              {item.geo.province} · {item.geo.district} · {item.geo.sector}
            </p>
            <p className="text-foreground-secondary">Logged by {item.tcName}</p>
            {item.resolutionNotes ? (
              <p className="text-foreground-secondary">
                Resolution: {item.resolutionNotes}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {canWrite ? (
          <StatusCard
            key={`${item.status}:${item.updatedAt}`}
            item={item}
            onSaved={onSaved}
          />
        ) : null}
      </div>
    </div>
  );
}
