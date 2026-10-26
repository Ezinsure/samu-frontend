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
import { canManageCoap, createFieldActivity } from "@/lib/api";
import {
  ACTIVITY_TYPE_LABELS,
  DEFAULT_GEO,
  labelsToOptions,
} from "@/lib/coap/catalog";
import type { FieldActivityType, ServiceLine } from "@/types";

const TYPE_OPTIONS = labelsToOptions(ACTIVITY_TYPE_LABELS);
const today = () => new Date().toISOString().slice(0, 10);

export default function NewActivityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const options = useCoapOptions();
  const coordinator = useCoordinatorChoice(options.data?.coordinators);

  const initialService = useInitialService("irembo");
  const [serviceLine, setServiceLine] = useState<ServiceLine>(initialService);
  const [activityType, setActivityType] =
    useState<FieldActivityType>("education");
  const [date, setDate] = useState(today);
  const [peopleReached, setPeopleReached] = useState("0");
  const [geo, setGeo] = useState<GeoValue>(DEFAULT_GEO);
  const [venue, setVenue] = useState("");
  const [summary, setSummary] = useState("");
  const [outcome, setOutcome] = useState("");
  const [saving, setSaving] = useState(false);

  if (!canManageCoap(user)) {
    return <ReadOnlyNotice title="Log activity" backHref="/activities" />;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (coordinator.required && !coordinator.tcUserId) {
      toast.error("Select the coordinator who ran this activity");
      return;
    }

    setSaving(true);
    const result = await createFieldActivity({
      serviceLine,
      activityType,
      date,
      geo,
      venue: venue.trim(),
      peopleReached: Math.max(0, Number(peopleReached) || 0),
      summary: summary.trim(),
      outcome: outcome.trim(),
      tcUserId: coordinator.tcUserId,
    });
    setSaving(false);

    if (!result.ok) {
      toast.error("Could not save activity", { description: result.error });
      return;
    }
    toast.success("Activity logged");
    router.push(`/activities/${result.data.id}`);
  }

  return (
    <FormShell
      title="Log field activity"
      description="Record education, demos, mobilization, or support sessions."
      cardTitle="Activity details"
      backHref="/activities"
      submitLabel="Save activity"
      saving={saving}
      onSubmit={onSubmit}
    >
      <FormField label="Service line">
        <ServiceSelect
          value={serviceLine}
          onChange={(value) => value !== "all" && setServiceLine(value)}
        />
      </FormField>
      <FormField label="Activity type">
        <OptionSelect
          value={activityType}
          onChange={(value) => setActivityType(value as FieldActivityType)}
          options={TYPE_OPTIONS}
        />
      </FormField>
      <FormField label="Date" htmlFor="date">
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
      </FormField>
      <FormField label="People reached" htmlFor="reached">
        <Input
          id="reached"
          type="number"
          min={0}
          value={peopleReached}
          onChange={(event) => setPeopleReached(event.target.value)}
        />
      </FormField>
      <GeoFields value={geo} onChange={setGeo} options={options.data} />
      <CoordinatorField
        choice={coordinator}
        coordinators={options.data?.coordinators ?? []}
      />
      <FormField label="Venue" htmlFor="venue" className="md:col-span-2">
        <Input
          id="venue"
          value={venue}
          onChange={(event) => setVenue(event.target.value)}
          required
        />
      </FormField>
      <FormField label="Summary" htmlFor="summary" className="md:col-span-2">
        <Textarea
          id="summary"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          rows={3}
          required
        />
      </FormField>
      <FormField label="Outcome" htmlFor="outcome" className="md:col-span-2">
        <Textarea
          id="outcome"
          value={outcome}
          onChange={(event) => setOutcome(event.target.value)}
          rows={2}
          minLength={2}
          required
        />
      </FormField>
    </FormShell>
  );
}
