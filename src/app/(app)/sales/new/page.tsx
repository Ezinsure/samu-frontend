"use client";

import { useSearchParams } from "next/navigation";
import { SaleForm, type SaleFormInitial } from "@/features/coap/sale-form";
import { RecordSkeleton, ReadOnlyNotice } from "@/features/coap/record-states";
import { useInitialService } from "@/features/coap/use-initial-service";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCoap, getOnboardingById } from "@/lib/api";
import { useUserData } from "@/lib/hooks/use-user-data";

export default function NewSalePage() {
  const { user } = useAuth();
  const onboardingId = useSearchParams().get("onboardingId");
  const fallbackService = useInitialService("internet");

  // `?onboardingId=` prefills the customer from the onboarding case.
  const onboarding = useUserData(
    () =>
      onboardingId ? getOnboardingById(onboardingId) : Promise.resolve(null),
    `sale-onboarding:${onboardingId ?? "none"}`,
  );

  if (!canManageCoap(user)) {
    return <ReadOnlyNotice title="Record sale" backHref="/sales" />;
  }
  if (onboarding.loading) return <RecordSkeleton />;

  const initial: SaleFormInitial = onboarding.data
    ? {
        serviceLine: onboarding.data.serviceLine,
        customerName: onboarding.data.customerName,
        customerPhone: onboarding.data.customerPhone,
        geo: onboarding.data.geo,
        leadId: onboarding.data.leadId,
        onboardingId: onboarding.data.id,
      }
    : { serviceLine: fallbackService };

  return <SaleForm initial={initial} />;
}
