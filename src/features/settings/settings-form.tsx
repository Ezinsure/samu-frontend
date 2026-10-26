"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  KPI_LABELS,
  updateSettings,
  type SystemSettingsView,
} from "@/lib/api";
import {
  SETTINGS_SECTIONS,
  draftToPatch,
  toDraft,
  type NumericSettingKey,
  type SettingsDraft,
} from "./fields";

interface SettingsFormProps {
  settings: SystemSettingsView;
  /** Admin can edit; Ops sees the same screen read-only. */
  editable: boolean;
  /** Refetch after a successful save (the form remounts with stored values). */
  onSaved: () => void;
}

/** System settings: thresholds, KPI targets and SMS templates. */
export function SettingsForm({ settings, editable, onSaved }: SettingsFormProps) {
  // Seeded from the server; the page remounts this form after every reload.
  const [draft, setDraft] = useState<SettingsDraft>(() => toDraft(settings));
  const [saving, setSaving] = useState(false);

  function setNumber(key: NumericSettingKey, value: string) {
    setDraft((current) => ({
      ...current,
      numbers: { ...current.numbers, [key]: value },
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = draftToPatch(draft);
    if (!parsed.ok) {
      toast.error("Check the highlighted values", { description: parsed.error });
      return;
    }

    setSaving(true);
    const result = await updateSettings(parsed.patch);
    setSaving(false);

    if (!result.ok) {
      toast.error("Could not save settings", { description: result.error });
      return;
    }
    toast.success("Settings saved", {
      description: "The change was recorded in the audit log.",
    });
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader
        title="Settings"
        description={
          editable
            ? "System thresholds, KPI targets and SMS templates."
            : "Read-only view — only an Admin can change settings."
        }
        actions={
          editable ? (
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save changes"}
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {SETTINGS_SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <p className="text-sm text-foreground-secondary">
                {section.description}
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((field) => (
                <FormField
                  key={field.key}
                  label={field.label}
                  htmlFor={field.key}
                >
                  <Input
                    id={field.key}
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={1}
                    disabled={!editable}
                    value={draft.numbers[field.key]}
                    onChange={(event) => setNumber(field.key, event.target.value)}
                  />
                  <p className="text-xs text-foreground-secondary">
                    {field.hint}
                  </p>
                </FormField>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly KPI targets</CardTitle>
          <p className="text-sm text-foreground-secondary">
            Used to mark each report KPI as met or below target.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Object.keys(draft.kpiTargets).map((key) => (
            <FormField
              key={key}
              label={KPI_LABELS[key] ?? key}
              htmlFor={`kpi-${key}`}
            >
              <Input
                id={`kpi-${key}`}
                type="number"
                min={0}
                disabled={!editable}
                value={draft.kpiTargets[key]}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    kpiTargets: {
                      ...current.kpiTargets,
                      [key]: event.target.value,
                    },
                  }))
                }
              />
            </FormField>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SMS templates</CardTitle>
          <p className="text-sm text-foreground-secondary">
            Messages sent from the messaging centre (max 500 characters).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(draft.smsTemplates).map((id) => (
            <FormField key={id} label={id} htmlFor={`sms-${id}`}>
              <Textarea
                id={`sms-${id}`}
                rows={3}
                maxLength={500}
                disabled={!editable}
                value={draft.smsTemplates[id]}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    smsTemplates: {
                      ...current.smsTemplates,
                      [id]: event.target.value,
                    },
                  }))
                }
              />
            </FormField>
          ))}
        </CardContent>
      </Card>

      {settings.updatedAt ? (
        <p className="text-xs text-foreground-secondary">
          Last updated {new Date(settings.updatedAt).toLocaleString()}
        </p>
      ) : null}
    </form>
  );
}
