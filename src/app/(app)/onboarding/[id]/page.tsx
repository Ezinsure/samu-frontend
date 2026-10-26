"use client";

import { useParams } from "next/navigation";
import { OnboardingDetail } from "@/features/coap/onboarding-detail";
import { RecordGate } from "@/features/coap/record-states";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCoap, getOnboardingById } from "@/lib/api";
import { useUserData } from "@/lib/hooks/use-user-data";

export default function OnboardingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const state = useUserData(() => getOnboardingById(id), `onboarding:${id}`);

  return (
    <RecordGate
      state={state}
      notFoundTitle="Case not found"
      backHref="/onboarding"
    >
      {(item) => (
        <OnboardingDetail
          item={item}
          canWrite={canManageCoap(user)}
          onSaved={state.reload}
        />
      )}
    </RecordGate>
  );
}
