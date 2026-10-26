import { apiRequest } from "@/lib/http/client";
import { apiRequestList } from "@/lib/http/list";
import type { ListQuery, Paginated } from "@/types";

export interface AuditQuery extends ListQuery {
  action?: string;
  objectType?: string;
  actorUserId?: string;
}

export interface AuditLogItem {
  id: string;
  actorUserId?: string;
  /** Missing for system-generated entries. */
  actorName?: string;
  action: string;
  objectType: string;
  objectId: string;
  summary: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuditFilterOptions {
  actions: string[];
  objectTypes: string[];
}

/** Newest-first audit trail (Admin + Ops). */
export function getAuditLogs(
  query: AuditQuery = {},
): Promise<Paginated<AuditLogItem>> {
  return apiRequestList<AuditLogItem>("/admin/audit", { query: { ...query } });
}

/** Distinct actions and object types for the filter dropdowns. */
export function getAuditFilterOptions(): Promise<AuditFilterOptions> {
  return apiRequest("/admin/audit/filters");
}
