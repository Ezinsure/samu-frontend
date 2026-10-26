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
import { canManageCoap, createLead } from "@/lib/api";
import {
  DEFAULT_GEO,
  LEAD_ENTITY_LABELS,
  LEAD_STATUS_LABELS,
  labelsToOptions,
} from "@/lib/coap/catalog";
import type { LeadEntityType, LeadStatus, ServiceLine } from "@/types";

const ENTITY_OPTIONS = labelsToOptions(LEAD_ENTITY_LABELS);
const STATUS_OPTIONS = labelsToOptions(LEAD_STATUS_LABELS);

export default function NewLeadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const options = useCoapOptions();
  const coordinator = useCoordinatorChoice(options.data?.coordinators);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [entityType, setEntityType] = useState<LeadEntityType>("person");
  const initialService = useInitialService("irembo");
  const [serviceLine, setServiceLine] = useState<ServiceLine>(initialService);
  const [status, setStatus] = useState<LeadStatus>("new");
  const [geo, setGeo] = useState<GeoValue>(DEFAULT_GEO);
  const [interestSummary, setInterestSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (!canManageCoap(user)) {
    return <ReadOnlyNotice title="Create lead" backHref="/leads" />;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (coordinator.required && !coordinator.tcUserId) {
      toast.error("Select the coordinator who owns this lead");
      return;
    }

    setSaving(true);
    const result = await createLead({
      name: name.trim(),
      phone: phone.trim(),
      entityType,
      serviceLine,
      status,
      geo,
      interestSummary: interestSummary.trim(),
      notes: notes.trim(),
      tcUserId: coordinator.tcUserId,
    });
    setSaving(false);

    if (!result.ok) {
      toast.error("Could not save lead", { description: result.error });
      return;
    }
    toast.success("Lead created");
    router.push(`/leads/${result.data.id}`);
  }

  return (
    <FormShell
      title="New lead"
      description="Capture interest from a community member, household, or business."
      cardTitle="Lead details"
      backHref="/leads"
      submitLabel="Save lead"
      saving={saving}
      onSubmit={onSubmit}
    >
      <FormField label="Name" htmlFor="name" className="md:col-span-2">
        <Input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </FormField>
      <FormField label="Phone" htmlFor="phone">
        <Input
          id="phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
        />
      </FormField>
      <FormField label="Entity type">
        <OptionSelect
          value={entityType}
          onChange={(value) => setEntityType(value as LeadEntityType)}
          options={ENTITY_OPTIONS}
        />
      </FormField>
      <FormField label="Service line">
        <ServiceSelect
          value={serviceLine}
          onChange={(value) => value !== "all" && setServiceLine(value)}
        />
      </FormField>
      <FormField label="Status">
        <OptionSelect
          value={status}
          onChange={(value) => setStatus(value as LeadStatus)}
          options={STATUS_OPTIONS}
        />
      </FormField>
      <GeoFields value={geo} onChange={setGeo} options={options.data} />
      <CoordinatorField
        choice={coordinator}
        coordinators={options.data?.coordinators ?? []}
      />
      <FormField label="Interest summary" htmlFor="interest" className="md:col-span-2">
        <Input
          id="interest"
          value={interestSummary}
          onChange={(event) => setInterestSummary(event.target.value)}
          placeholder="What do they need?"
        />
      </FormField>
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
