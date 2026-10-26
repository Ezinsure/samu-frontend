"use client";

import { useSearchParams } from "next/navigation";
import {
  OnboardingForm,
  type OnboardingFormInitial,
} from "@/features/coap/onboarding-form";
import { RecordSkeleton, ReadOnlyNotice } from "@/features/coap/record-states";
import { useInitialService } from "@/features/coap/use-initial-service";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCoap, getLeadById } from "@/lib/api";
import { useUserData } from "@/lib/hooks/use-user-data";

export default function NewOnboardingPage() {
  const { user } = useAuth();
  const leadId = useSearchParams().get("leadId");
  const fallbackService = useInitialService("irembo");

  // `?leadId=` prefills the form from the lead; resolves to null when absent.
  const lead = useUserData(
    () => (leadId ? getLeadById(leadId) : Promise.resolve(null)),
    `onboarding-lead:${leadId ?? "none"}`,
  );

  if (!canManageCoap(user)) {
    return <ReadOnlyNotice title="New onboarding case" backHref="/onboarding" />;
  }
  if (lead.loading) return <RecordSkeleton />;

  const initial: OnboardingFormInitial = lead.data
    ? {
        serviceLine: lead.data.serviceLine,
        customerName: lead.data.name,
        customerPhone: lead.data.phone,
        geo: lead.data.geo,
        leadId: lead.data.id,
      }
    : { serviceLine: fallbackService };

  return <OnboardingForm initial={initial} />;
}
