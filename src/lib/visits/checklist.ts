import type { AgentServices } from "@/types";

/** Yes/no readiness fields (everything on `AgentServices` except free-text/optional COAP flags). */
export type ChecklistKey = Exclude<
  keyof AgentServices,
  "internetType" | "cleanCookingTools" | "starlinkReady"
>;

export interface ChecklistGroup {
  title: string;
  /** Whether the "internet type" picker is shown in this group. */
  hasInternetType?: boolean;
  items: Array<{ key: ChecklistKey; label: string }>;
}

/** Readiness checklist layout shared by the capture wizard and the visit detail page. */
export const CHECKLIST_GROUPS: ChecklistGroup[] = [
  {
    title: "Agent readiness",
    items: [
      { key: "iremboTools", label: "Irembo tools" },
      { key: "insuranceTools", label: "Insurance tools" },
      { key: "telecomTools", label: "Telecom tools" },
      { key: "bkTools", label: "BK tools" },
    ],
  },
  {
    title: "Equipment & connectivity",
    hasInternetType: true,
    items: [
      { key: "smartphone", label: "Smartphone" },
      { key: "printer", label: "Printer" },
      { key: "internetAvailable", label: "Internet available" },
    ],
  },
  {
    title: "Visibility & commercial",
    items: [
      { key: "brandingVisible", label: "Branding visible" },
      { key: "trainedOnServices", label: "Trained on services" },
      { key: "activelySelling", label: "Actively selling" },
    ],
  },
];

export const CHECKLIST_ITEMS = CHECKLIST_GROUPS.flatMap((group) => group.items);
