import { apiRequest } from "@/lib/http/client";
import { runMutation, type MutationResult } from "@/lib/http/mutation";
import type { SessionUser, SystemSettings } from "@/types";

export interface SystemSettingsView extends SystemSettings {
  smsTemplates: Record<string, string>;
  updatedAt?: string;
  updatedByUserId?: string;
}

/** Fields the Admin may change (all optional — send only what changed). */
export type SystemSettingsPatch = Partial<
  Omit<SystemSettingsView, "updatedAt" | "updatedByUserId">
>;

/** UI hint only — the API restricts updates to ADMIN. */
export function canEditSettings(viewer?: SessionUser | null) {
  return viewer?.role === "ADMIN";
}

export function canViewSettings(viewer?: SessionUser | null) {
  return canEditSettings(viewer) || viewer?.role === "OPERATIONS_MANAGER";
}

/** Admin + Ops can read; the response always contains every setting. */
export function getSettings(): Promise<SystemSettingsView> {
  return apiRequest("/admin/settings");
}

/** Admin only. Returns the stored settings after the update. */
export function updateSettings(
  patch: SystemSettingsPatch,
): Promise<MutationResult<SystemSettingsView>> {
  return runMutation(() =>
    apiRequest<SystemSettingsView>("/admin/settings", {
      method: "PATCH",
      body: patch,
    }),
  );
}
