import { apiRequest } from "@/lib/http/client";
import { apiRequestList } from "@/lib/http/list";
import {
  runMutation,
  stripBlankValues,
  type MutationResult,
} from "@/lib/http/mutation";
import type { ListQuery, Paginated, SessionUser } from "@/types";

export type MessageStatus = "stub_queued" | "stub_sent" | "stub_failed";

export interface MessageQuery extends ListQuery {
  status?: MessageStatus;
}

export interface OutboxMessage {
  id: string;
  toPhone: string;
  body: string;
  templateId?: string;
  status: MessageStatus;
  visitId?: string;
  agentId?: string;
  providerRef?: string;
  createdByName?: string;
  createdAt: string;
}

export interface MessagingStatus {
  /** `"stub"` until a real SMS gateway is connected. */
  provider: string;
  enabled: boolean;
  note: string;
  /** Template ids available for sending. */
  templates: string[];
  queued: number;
}

export interface SendSmsInput {
  toPhone: string;
  /** Free text; omit when sending a template. */
  body?: string;
  templateId?: string;
  agentId?: string;
  visitId?: string;
}

/** UI hint only — the API restricts messaging to Admin + Ops. */
export function canUseMessaging(viewer?: SessionUser | null) {
  return viewer?.role === "ADMIN" || viewer?.role === "OPERATIONS_MANAGER";
}

export function messageStatusTone(status: MessageStatus) {
  if (status === "stub_sent") return "success" as const;
  if (status === "stub_failed") return "danger" as const;
  return "warning" as const;
}

export function messageStatusLabel(status: MessageStatus) {
  if (status === "stub_sent") return "Sent (stub)";
  if (status === "stub_failed") return "Failed (stub)";
  return "Queued (stub)";
}

export function getMessagingStatus(): Promise<MessagingStatus> {
  return apiRequest("/messaging/status");
}

export function getMessages(
  query: MessageQuery = {},
): Promise<Paginated<OutboxMessage>> {
  return apiRequestList<OutboxMessage>("/messaging", { query: { ...query } });
}

/** Records the SMS in the outbox (no external gateway yet). */
export function sendSms(
  input: SendSmsInput,
): Promise<MutationResult<OutboxMessage>> {
  return runMutation(async () => {
    const data = await apiRequest<{ message: OutboxMessage }>("/messaging/sms", {
      method: "POST",
      body: stripBlankValues(input),
    });
    return data.message;
  });
}
