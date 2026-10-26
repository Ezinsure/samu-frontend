"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { OptionSelect } from "@/components/shared/option-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CoordinatorField,
  useCoordinatorChoice,
} from "@/features/coap/coordinator-field";
import { FormShell } from "@/features/coap/form-shell";
import { GeoFields, type GeoValue } from "@/features/coap/geo-fields";
import { ReadOnlyNotice } from "@/features/coap/record-states";
import { ServiceSelect } from "@/features/coap/service-select";
import { useCoapOptions } from "@/features/coap/use-coap-options";
import { useInitialService } from "@/features/coap/use-initial-service";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCoap, createCommunityFeedback } from "@/lib/api";
import {
  DEFAULT_GEO,
  FEEDBACK_KIND_LABELS,
  FEEDBACK_SEVERITY_LABELS,
  FEEDBACK_STATUS_LABELS,
  labelsToOptions,
} from "@/lib/coap/catalog";
import type {
  FeedbackKind,
  FeedbackSeverity,
  FeedbackStatus,
  ServiceLine,
} from "@/types";

const KIND_OPTIONS = labelsToOptions(FEEDBACK_KIND_LABELS);
const SEVERITY_OPTIONS = labelsToOptions(FEEDBACK_SEVERITY_LABELS);
const STATUS_OPTIONS = labelsToOptions(FEEDBACK_STATUS_LABELS);

export default function NewFeedbackPage() {
  const { user } = useAuth();
  const router = useRouter();
  const options = useCoapOptions();
  const coordinator = useCoordinatorChoice(options.data?.coordinators);

  const initialService = useInitialService("all");
  const [serviceLine, setServiceLine] = useState<ServiceLine | "all">(
    initialService,
  );
  const [kind, setKind] = useState<FeedbackKind>("need");
  const [severity, setSeverity] = useState<FeedbackSeverity>("medium");
  const [status, setStatus] = useState<FeedbackStatus>("open");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [geo, setGeo] = useState<GeoValue>(DEFAULT_GEO);
  const [saving, setSaving] = useState(false);

  if (!canManageCoap(user)) {
    return <ReadOnlyNotice title="Log feedback" backHref="/feedback" />;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (coordinator.required && !coordinator.tcUserId) {
      toast.error("Select the coordinator who collected this feedback");
      return;
    }

    setSaving(true);
    const result = await createCommunityFeedback({
      serviceLine: serviceLine === "all" ? undefined : serviceLine,
      kind,
      severity,
      status,
      title: title.trim(),
      description: description.trim(),
      geo,
      tcUserId: coordinator.tcUserId,
    });
    setSaving(false);

    if (!result.ok) {
      toast.error("Could not save feedback", { description: result.error });
      return;
    }
    toast.success("Feedback logged");
    router.push(`/feedback/${result.data.id}`);
  }

  return (
    <FormShell
      title="Log community feedback"
      description="Capture needs, challenges, and opportunities heard in the field."
      cardTitle="Feedback details"
      backHref="/feedback"
      submitLabel="Save feedback"
      saving={saving}
      onSubmit={onSubmit}
    >
      <FormField label="Title" htmlFor="title" className="md:col-span-2">
        <Input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </FormField>
      <FormField label="Kind">
        <OptionSelect
          value={kind}
          onChange={(value) => setKind(value as FeedbackKind)}
          options={KIND_OPTIONS}
        />
      </FormField>
      <FormField label="Severity">
        <OptionSelect
          value={severity}
          onChange={(value) => setSeverity(value as FeedbackSeverity)}
          options={SEVERITY_OPTIONS}
        />
      </FormField>
      <FormField label="Status">
        <OptionSelect
          value={status}
          onChange={(value) => setStatus(value as FeedbackStatus)}
          options={STATUS_OPTIONS}
        />
      </FormField>
      <FormField label="Service line (optional)">
        <ServiceSelect value={serviceLine} onChange={setServiceLine} allowAll />
      </FormField>
      <GeoFields value={geo} onChange={setGeo} options={options.data} />
      <CoordinatorField
        choice={coordinator}
        coordinators={options.data?.coordinators ?? []}
      />
      <FormField
        label="Description"
        htmlFor="description"
        className="md:col-span-2"
      >
        <Textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          required
        />
      </FormField>
    </FormShell>
  );
}
