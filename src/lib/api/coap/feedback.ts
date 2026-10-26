import type {
  CommunityFeedback,
  FeedbackKind,
  FeedbackSeverity,
  FeedbackStatus,
  ListQuery,
  ServiceLine,
} from "@/types";
import { createResourceClient } from "./resource";

export interface FeedbackQuery extends ListQuery {
  serviceLine?: ServiceLine;
  kind?: FeedbackKind;
  status?: FeedbackStatus;
  tcUserId?: string;
}

export type FeedbackListItem = CommunityFeedback & { tcName: string };

export interface FeedbackInput {
  serviceLine?: ServiceLine;
  kind: FeedbackKind;
  severity: FeedbackSeverity;
  status: FeedbackStatus;
  title: string;
  description: string;
  geo: CommunityFeedback["geo"];
  leadId?: string;
  resolutionNotes?: string;
  /** Required for Admin / Ops; the API forces the TC's own id for coordinators. */
  tcUserId?: string;
}

const feedback = createResourceClient<
  FeedbackListItem,
  FeedbackInput,
  FeedbackQuery
>("/feedback", "feedback");

export const getCommunityFeedback = feedback.list;
export const getFeedbackById = feedback.getById;
export const createCommunityFeedback = feedback.create;
export const updateCommunityFeedback = feedback.update;

export function feedbackStatusTone(status: FeedbackStatus) {
  if (status === "resolved") return "success" as const;
  if (status === "acknowledged") return "info" as const;
  return "warning" as const;
}

export function feedbackSeverityTone(severity: FeedbackSeverity) {
  if (severity === "high") return "danger" as const;
  if (severity === "medium") return "warning" as const;
  return "neutral" as const;
}
