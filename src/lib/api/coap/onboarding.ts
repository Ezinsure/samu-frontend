import type {
  ListQuery,
  OnboardingCase,
  OnboardingKind,
  OnboardingStatus,
  ServiceLine,
} from "@/types";
import { createResourceClient } from "./resource";

export interface OnboardingQuery extends ListQuery {
  serviceLine?: ServiceLine;
  status?: OnboardingStatus;
  tcUserId?: string;
}

export type OnboardingListItem = OnboardingCase & { tcName: string };

export interface OnboardingInput {
  serviceLine: ServiceLine;
  kind: OnboardingKind;
  status: OnboardingStatus;
  customerName: string;
  customerPhone: string;
  geo: OnboardingCase["geo"];
  stageLabel: string;
  notes?: string;
  leadId?: string;
  agentId?: string;
  /** Required for Admin / Ops; the API forces the TC's own id for coordinators. */
  tcUserId?: string;
}

const onboarding = createResourceClient<
  OnboardingListItem,
  OnboardingInput,
  OnboardingQuery
>("/onboarding", "onboarding");

export const getOnboardingCases = onboarding.list;
export const getOnboardingById = onboarding.getById;
export const createOnboardingCase = onboarding.create;
export const updateOnboardingCase = onboarding.update;

export function onboardingStatusTone(status: OnboardingStatus) {
  if (status === "completed") return "success" as const;
  if (status === "cancelled") return "danger" as const;
  if (status === "pending_partner") return "warning" as const;
  if (status === "in_progress") return "info" as const;
  return "neutral" as const;
}
