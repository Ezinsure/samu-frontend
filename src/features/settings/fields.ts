import type { SystemSettingsView } from "@/lib/api";

/** Integer settings edited as plain number inputs. */
export type NumericSettingKey =
  | "gpsDistanceMeters"
  | "agentGreenDays"
  | "agentYellowDays"
  | "tcComplianceGreen"
  | "tcComplianceYellow"
  | "monthlyReportDueDay";

export interface NumericFieldDef {
  key: NumericSettingKey;
  label: string;
  hint: string;
  /** Same bounds the API validates, so errors show before the request. */
  min: number;
  max: number;
}

export interface SettingsSection {
  title: string;
  description: string;
  fields: NumericFieldDef[];
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    title: "Visit validation",
    description: "Applied to every new agent visit.",
    fields: [
      {
        key: "gpsDistanceMeters",
        label: "GPS distance threshold (m)",
        hint: "Visits further than this from the agent's registered location are flagged.",
        min: 1,
        max: 5000,
      },
    ],
  },
  {
    title: "Agent visit compliance",
    description: "Stored for the compliance colours; not yet used to recalculate them.",
    fields: [
      {
        key: "agentGreenDays",
        label: "Green window (days)",
        hint: "Days between visits considered compliant.",
        min: 1,
        max: 365,
      },
      {
        key: "agentYellowDays",
        label: "Yellow window (days)",
        hint: "Days after which an agent is shown as due soon.",
        min: 1,
        max: 365,
      },
    ],
  },
  {
    title: "Coordinator compliance",
    description: "Stored for coordinator scoring; not yet used in calculations.",
    fields: [
      {
        key: "tcComplianceGreen",
        label: "Green threshold (%)",
        hint: "Share of agents compliant for a green coordinator.",
        min: 0,
        max: 100,
      },
      {
        key: "tcComplianceYellow",
        label: "Yellow threshold (%)",
        hint: "Share of agents compliant for a yellow coordinator.",
        min: 0,
        max: 100,
      },
    ],
  },
  {
    title: "Monthly reporting",
    description: "Reports are due on this day of the following month.",
    fields: [
      {
        key: "monthlyReportDueDay",
        label: "Report due day",
        hint: "Day of month (1–28).",
        min: 1,
        max: 28,
      },
    ],
  },
];

/** Form draft: everything is a string so partially typed values are allowed. */
export interface SettingsDraft {
  numbers: Record<NumericSettingKey, string>;
  kpiTargets: Record<string, string>;
  smsTemplates: Record<string, string>;
}

const NUMERIC_KEYS = SETTINGS_SECTIONS.flatMap((section) =>
  section.fields.map((field) => field.key),
);

export function toDraft(settings: SystemSettingsView): SettingsDraft {
  return {
    numbers: Object.fromEntries(
      NUMERIC_KEYS.map((key) => [key, String(settings[key])]),
    ) as SettingsDraft["numbers"],
    kpiTargets: Object.fromEntries(
      Object.entries(settings.kpiTargets).map(([k, v]) => [k, String(v)]),
    ),
    smsTemplates: { ...settings.smsTemplates },
  };
}

/** Converts the draft to an API patch, or returns the first validation error. */
export function draftToPatch(
  draft: SettingsDraft,
): { ok: true; patch: Partial<SystemSettingsView> } | { ok: false; error: string } {
  const patch: Record<string, unknown> = {};

  for (const section of SETTINGS_SECTIONS) {
    for (const field of section.fields) {
      const value = Number(draft.numbers[field.key]);
      if (
        draft.numbers[field.key].trim() === "" ||
        !Number.isInteger(value) ||
        value < field.min ||
        value > field.max
      ) {
        return {
          ok: false,
          error: `${field.label} must be a whole number from ${field.min} to ${field.max}.`,
        };
      }
      patch[field.key] = value;
    }
  }

  const kpiTargets: Record<string, number> = {};
  for (const [key, raw] of Object.entries(draft.kpiTargets)) {
    const value = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(value) || value < 0) {
      return { ok: false, error: `KPI target "${key}" must be zero or more.` };
    }
    kpiTargets[key] = value;
  }
  patch.kpiTargets = kpiTargets;

  for (const [id, text] of Object.entries(draft.smsTemplates)) {
    if (!text.trim()) return { ok: false, error: `SMS template "${id}" cannot be empty.` };
  }
  patch.smsTemplates = draft.smsTemplates;

  return { ok: true, patch: patch as Partial<SystemSettingsView> };
}
