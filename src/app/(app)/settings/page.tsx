"use client";

import { RecordGate } from "@/features/coap/record-states";
import { SettingsForm } from "@/features/settings/settings-form";
import { useAuth } from "@/lib/auth/auth-context";
import { canEditSettings, getSettings } from "@/lib/api";
import { useUserData } from "@/lib/hooks/use-user-data";

export default function SettingsPage() {
  const { user } = useAuth();
  const state = useUserData(() => getSettings(), "settings");

  return (
    <RecordGate state={state} notFoundTitle="Settings unavailable" backHref="/dashboard">
      {(settings) => (
        <SettingsForm
          settings={settings}
          editable={canEditSettings(user)}
          onSaved={state.reload}
        />
      )}
    </RecordGate>
  );
}
