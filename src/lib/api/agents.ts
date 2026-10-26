import { ApiError, apiRequest, getErrorMessage } from "@/lib/http/client";
import { apiRequestList } from "@/lib/http/list";
import type {
  Agent,
  AgentServices,
  AgentStatus,
  ComplianceTone,
  GeoLocation,
  ListQuery,
  Paginated,
  SessionUser,
  Visit,
} from "@/types";

export interface AgentQuery extends ListQuery {
  province?: string;
  district?: string;
  status?: string;
  tcUserId?: string;
  compliance?: string;
}

export interface AgentAssignment {
  id: string;
  agentId: string;
  tcUserId: string;
  tcName: string;
  startedAt: string;
  endedAt?: string;
  active: boolean;
}

export interface AgentDetail {
  agent: Agent;
  visits: Visit[];
  assignments: AgentAssignment[];
  tcName: string;
}

export interface AgentInput {
  name: string;
  phone: string;
  email?: string;
  code?: string;
  status: AgentStatus;
  geo: GeoLocation;
  registeredLocation: { lat: number; lng: number };
  tcUserId: string;
  services: AgentServices;
  clientsRegistered?: number;
  recruitedThisMonth?: boolean;
  reactivatedThisMonth?: boolean;
  nidVerified?: boolean;
}

export interface AgentFilterOptions {
  provinces: string[];
  districts: string[];
  statuses: string[];
  coordinators: Array<{ id: string; name: string }>;
}

export type AgentRow = Agent & { tcName: string };

export type AgentMutationResult =
  | { ok: true; agent: Agent }
  | { ok: false; error: string };

/** UI hint only — the API enforces the real permission. */
export function canManageAgents(viewer?: SessionUser | null) {
  return viewer?.role === "ADMIN";
}

/**
 * The API rejects empty optional strings (e.g. a 2-char minimum on `code`),
 * so blank form fields are dropped before sending.
 */
function toAgentPayload(input: AgentInput) {
  return {
    ...input,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    code: input.code?.trim() || undefined,
  };
}

/** Filter facets (provinces, districts, statuses, coordinators) for list UIs. */
export function getAgentFilterOptions(): Promise<AgentFilterOptions> {
  return apiRequest<AgentFilterOptions>("/agents/filters");
}

/** Paginated agent directory. TC users are scoped to their agents server-side. */
export function getAgents(
  query: AgentQuery = {},
): Promise<Paginated<AgentRow>> {
  return apiRequestList<AgentRow>("/agents", { query: { ...query } });
}

/**
 * Agent detail with visit and assignment history.
 * Returns `null` when the agent is missing or outside the viewer's scope.
 */
export async function getAgentDetail(id: string): Promise<AgentDetail | null> {
  try {
    return await apiRequest<AgentDetail>(`/agents/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && [403, 404].includes(error.status)) {
      return null;
    }
    throw error;
  }
}

/** Convenience wrapper for forms that only need the agent record. */
export async function getAgentById(id: string): Promise<Agent | null> {
  return (await getAgentDetail(id))?.agent ?? null;
}

export async function createAgent(
  input: AgentInput,
): Promise<AgentMutationResult> {
  try {
    const data = await apiRequest<{ agent: Agent }>("/agents", {
      method: "POST",
      body: toAgentPayload(input),
    });
    return { ok: true, agent: data.agent };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function updateAgent(
  id: string,
  input: AgentInput,
): Promise<AgentMutationResult> {
  try {
    const data = await apiRequest<{ agent: Agent }>(
      `/agents/${encodeURIComponent(id)}`,
      { method: "PATCH", body: toAgentPayload(input) },
    );
    return { ok: true, agent: data.agent };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export function complianceTone(compliance: ComplianceTone) {
  if (compliance === "green") return "success" as const;
  if (compliance === "yellow") return "warning" as const;
  return "danger" as const;
}

export function complianceLabel(compliance: ComplianceTone) {
  if (compliance === "green") return "Compliant";
  if (compliance === "yellow") return "Due soon";
  return "Overdue";
}

/** Badge tone for an agent's account status. */
export function agentStatusTone(status: AgentStatus) {
  if (status === "Active") return "success" as const;
  if (status === "Inactive") return "inactive" as const;
  if (status === "Suspended") return "danger" as const;
  return "warning" as const;
}

/** Default readiness checklist used to prefill the "new agent" form. */
export const DEFAULT_AGENT_SERVICES: AgentServices = {
  iremboTools: true,
  insuranceTools: true,
  telecomTools: true,
  bkTools: false,
  smartphone: true,
  printer: true,
  internetAvailable: true,
  internetType: "Solektra Telecom",
  brandingVisible: true,
  trainedOnServices: true,
  activelySelling: true,
  cleanCookingTools: false,
  starlinkReady: false,
};
