import { apiRequest } from "@/lib/http/client";
import type {
  FieldActivityType,
  LeadStatus,
  OnboardingStatus,
  ServiceLine,
} from "@/types";
import type { ActivityListItem } from "./activities";
import type { LeadListItem } from "./leads";

/* -------------------------------------------------------------------------- */
/* Services hub                                                               */
/* -------------------------------------------------------------------------- */

export interface ServiceLineSummary {
  id: ServiceLine;
  label: string;
  shortLabel: string;
  description: string;
  tasks: string[];
  leads: number;
  openLeads: number;
  activities: number;
  onboardingOpen: number;
  sales: number;
  salesAmountRwf: number;
  feedbackOpen: number;
}

/** Per-service cockpit: summary counters plus the latest records of each type. */
export interface ServiceLineWorkspace {
  line: ServiceLineSummary;
  recent: {
    leads: Array<{ id: string; name: string; status: LeadStatus }>;
    activities: Array<{
      id: string;
      activityType: FieldActivityType;
      venue: string;
      date: string;
    }>;
    onboarding: Array<{
      id: string;
      customerName: string;
      status: OnboardingStatus;
    }>;
    sales: Array<{ id: string; productName: string; amountRwf: number }>;
  };
}

/** Summaries for all six service lines (TC users see their own numbers). */
export function getServicesWorkspace(): Promise<{ lines: ServiceLineSummary[] }> {
  return apiRequest("/coap/services");
}

/** Cockpit for one service line. */
export function getServiceLineWorkspace(
  line: ServiceLine,
): Promise<ServiceLineWorkspace> {
  return apiRequest(`/coap/services/${encodeURIComponent(line)}/workspace`);
}

/* -------------------------------------------------------------------------- */
/* Programme dashboard                                                        */
/* -------------------------------------------------------------------------- */

export interface CoapDashboard {
  /** Month the "this month" KPIs refer to (`YYYY-MM`). */
  month: string;
  summary: {
    openLeads: number;
    activitiesThisMonth: number;
    onboardingInProgress: number;
    salesThisMonth: number;
    salesAmountRwf: number;
    feedbackOpen: number;
    peopleReached: number;
  };
  byService: Array<{
    serviceLine: ServiceLine;
    label: string;
    leads: number;
    activities: number;
    sales: number;
    onboarding: number;
  }>;
  recentLeads: LeadListItem[];
  recentActivities: ActivityListItem[];
}

/** Programme KPIs. `month` is `YYYY-MM`; the API defaults to the current UTC month. */
export function getCoapDashboard(month?: string): Promise<CoapDashboard> {
  return apiRequest("/insights/coap-dashboard", { query: { month } });
}

/* -------------------------------------------------------------------------- */
/* Form options                                                               */
/* -------------------------------------------------------------------------- */

export interface CoapFilterOptions {
  provinces: string[];
  districts: string[];
  sectors: string[];
  coordinators: Array<{ id: string; name: string }>;
  serviceLines: Array<{ id: ServiceLine; label: string }>;
}

/** Geography, coordinator and service-line choices for COAP forms. */
export function getCoapFilterOptions(): Promise<CoapFilterOptions> {
  return apiRequest("/insights/coap-filter-options");
}