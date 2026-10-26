"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { OptionSelect } from "@/components/shared/option-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createOnboardingCase } from "@/lib/api";
import {
  DEFAULT_GEO,
  ONBOARDING_KIND_LABELS,
  ONBOARDING_STATUS_LABELS,
  labelsToOptions,
} from "@/lib/coap/catalog";
import type { OnboardingKind, OnboardingStatus, ServiceLine } from "@/types";
import { CoordinatorField, useCoordinatorChoice } from "./coordinator-field";
import { FormShell } from "./form-shell";
import { GeoFields, type GeoValue } from "./geo-fields";
import { ServiceSelect } from "./service-select";
import { useCoapOptions } from "./use-coap-options";

const KIND_OPTIONS = labelsToOptions(ONBOARDING_KIND_LABELS);
const STATUS_OPTIONS = labelsToOptions(ONBOARDING_STATUS_LABELS);

/** Most likely onboarding kind for each service line (used to prefill). */
export const DEFAULT_KIND_BY_SERVICE: Record<ServiceLine, OnboardingKind> = {
  irembo: "irembo_agent",
  bk: "bk_account",
  internet: "internet_activation",
  device_financing: "device_registration",
  clean_cooking: "cooker_purchase",
  insurance: "customer",
};

export interface OnboardingFormInitial {
  serviceLine: ServiceLine;
  customerName?: string;
  customerPhone?: string;
  geo?: GeoValue;
  leadId?: string;
}

/** Create-onboarding form; `initial` seeds the fields (e.g. from a lead). */
export function OnboardingForm({ initial }: { initial: OnboardingFormInitial }) {
  const router = useRouter();
  const options = useCoapOptions();
  const coordinator = useCoordinatorChoice(options.data?.coordinators);

  const [customerName, setCustomerName] = useState(initial.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(
    initial.customerPhone ?? "",
  );
  const [serviceLine, setServiceLine] = useState<ServiceLine>(
    initial.serviceLine,
  );
  const [kind, setKind] = useState<OnboardingKind>(
    DEFAULT_KIND_BY_SERVICE[initial.serviceLine],
  );
  const [status, setStatus] = useState<OnboardingStatus>("not_started");
  const [stageLabel, setStageLabel] = useState("Intake");
  const [geo, setGeo] = useState<GeoValue>(initial.geo ?? DEFAULT_GEO);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  /** Changing the service line also suggests the matching onboarding kind. */
  function changeService(next: ServiceLine) {
    setServiceLine(next);
    setKind(DEFAULT_KIND_BY_SERVICE[next]);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (coordinator.required && !coordinator.tcUserId) {
      toast.error("Select the coordinator who owns this case");
      return;
    }

    setSaving(true);
    const result = await createOnboardingCase({
      serviceLine,
      kind,
      status,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      geo,
      stageLabel: stageLabel.trim(),
      notes: notes.trim(),
      leadId: initial.leadId,
      tcUserId: coordinator.tcUserId,
    });
    setSaving(false);

    if (!result.ok) {
      toast.error("Could not save case", { description: result.error });
      return;
    }
    toast.success("Onboarding case created");
    router.push(`/onboarding/${result.data.id}`);
  }

  return (
    <FormShell
      title="New onboarding case"
      description="Track a customer or agent through activation with a partner."
      cardTitle="Case details"
      backHref="/onboarding"
      submitLabel="Save case"
      saving={saving}
      onSubmit={onSubmit}
    >
      <FormField label="Customer name" htmlFor="cname">
        <Input
          id="cname"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          required
        />
      </FormField>
      <FormField label="Customer phone" htmlFor="cphone">
        <Input
          id="cphone"
          value={customerPhone}
          onChange={(event) => setCustomerPhone(event.target.value)}
          required
        />
      </FormField>
      <FormField label="Service line">
        <ServiceSelect
          value={serviceLine}
          onChange={(value) => value !== "all" && changeService(value)}
        />
      </FormField>
      <FormField label="Kind">
        <OptionSelect
          value={kind}
          onChange={(value) => setKind(value as OnboardingKind)}
          options={KIND_OPTIONS}
        />
      </FormField>
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
          required
        />
      </FormField>
      <GeoFields value={geo} onChange={setGeo} options={options.data} />
      <CoordinatorField
        choice={coordinator}
        coordinators={options.data?.coordinators ?? []}
      />
      <FormField label="Notes" htmlFor="notes" className="md:col-span-2">
        <Textarea
          id="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
        />
      </FormField>
    </FormShell>
  );
}
