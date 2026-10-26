import type { Lead, LeadEntityType, LeadStatus, ListQuery, ServiceLine } from "@/types";
import { createResourceClient } from "./resource";

export interface LeadQuery extends ListQuery {
  serviceLine?: ServiceLine;
  status?: LeadStatus;
  tcUserId?: string;
}

export type LeadListItem = Lead & { tcName: string };

export interface LeadInput {
  name: string;
  phone: string;
  entityType: LeadEntityType;
  serviceLine: ServiceLine;
  status: LeadStatus;
  geo: Lead["geo"];
  notes?: string;
  interestSummary?: string;
  /** Required for Admin / Ops; the API forces the TC's own id for coordinators. */
  tcUserId?: string;
}

const leads = createResourceClient<LeadListItem, LeadInput, LeadQuery>(
  "/leads",
  "lead",
);

export const getLeads = leads.list;
export const getLeadById = leads.getById;
export const createLead = leads.create;
export const updateLead = leads.update;

export function leadStatusTone(status: LeadStatus) {
  if (status === "converted") return "success" as const;
  if (status === "lost") return "danger" as const;
  if (status === "qualified") return "info" as const;
  if (status === "contacted") return "warning" as const;
  return "neutral" as const;
}
