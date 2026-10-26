import { apiRequest } from "@/lib/http/client";
import type {
  DashboardAnalytics,
  DashboardFilters,
} from "@/lib/api/dashboard-types";
import type { SmsConfirmationStatus } from "@/types";

export interface AnalyticsWorkspace extends DashboardAnalytics {
  confirmationBreakdown: Array<{
    key: SmsConfirmationStatus;
    label: string;
    value: number;
    fill: string;
  }>;
  /** `month` is the two-digit month (`"09"`). */
  confirmationTrend: Array<{
    month: string;
    rate: number;
    confirmed: number;
    total: number;
  }>;
}

/** Dashboard analytics plus the SMS confirmation breakdown and trend. */
export function getAnalyticsWorkspace(
  filters: DashboardFilters = {},
): Promise<AnalyticsWorkspace> {
  return apiRequest("/insights/analytics", { query: { ...filters } });
}
