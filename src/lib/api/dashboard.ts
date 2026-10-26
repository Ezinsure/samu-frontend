import { apiRequest } from "@/lib/http/client";
import type {
  DashboardAnalytics,
  DashboardFilters,
} from "@/lib/api/dashboard-types";

export type {
  DashboardAnalytics,
  DashboardFilters,
} from "@/lib/api/dashboard-types";
export { defaultDashboardFilters } from "@/lib/api/dashboard-types";

/**
 * Compliance, visit and coordinator analytics. The API scopes the result to
 * the viewer (TCs only ever see their own agents).
 */
export function getDashboardAnalytics(
  filters: DashboardFilters = {},
): Promise<DashboardAnalytics> {
  return apiRequest("/insights/dashboard", { query: { ...filters } });
}
