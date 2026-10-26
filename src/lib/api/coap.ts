import { DEMO_USERS } from "@data/index";
import { SERVICE_LINES, serviceLineLabel } from "@/lib/coap/catalog";
import { delay, matchesSearch, paginate } from "@/lib/api/helpers";
import {
  appendAuditLog,
  readDemoStore,
  updateDemoStore,
} from "@/lib/store/demo-store";
import type {
  CommunityFeedback,
  FieldActivity,
  FeedbackKind,
  FeedbackSeverity,
  FeedbackStatus,
  FieldActivityType,
  Lead,
  LeadEntityType,
  LeadStatus,
  ListQuery,
  OnboardingCase,
  OnboardingKind,
  OnboardingStatus,
  Paginated,
  SaleProductCategory,
  SaleRecord,
  ServiceLine,
  SessionUser,
} from "@/types";

function tcName(userId: string) {
  return DEMO_USERS.find((user) => user.id === userId)?.name ?? userId;
}

function scopeByTc<T extends { tcUserId: string }>(
  items: T[],
  viewer?: SessionUser | null,
) {
  if (viewer?.role === "TERRITORY_COORDINATOR") {
    return items.filter((item) => item.tcUserId === viewer.userId);
  }
  return items;
}

function canWriteCoap(viewer?: SessionUser | null) {
  return (
    viewer?.role === "ADMIN" ||
    viewer?.role === "OPERATIONS_MANAGER" ||
    viewer?.role === "TERRITORY_COORDINATOR"
  );
}

export function canManageCoap(viewer?: SessionUser | null) {
  return canWriteCoap(viewer);
}

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/* -------------------------------------------------------------------------- */
/* Leads                                                                      */
/* -------------------------------------------------------------------------- */

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
  tcUserId?: string;
}

export async function getLeads(
  query: LeadQuery = {},
  viewer?: SessionUser | null,
): Promise<Paginated<LeadListItem>> {
  let items = scopeByTc(readDemoStore().leads, viewer);
  if (query.serviceLine) {
    items = items.filter((item) => item.serviceLine === query.serviceLine);
  }
  if (query.status) {
    items = items.filter((item) => item.status === query.status);
  }
  if (query.tcUserId) {
    items = items.filter((item) => item.tcUserId === query.tcUserId);
  }
  items = items.filter((item) =>
    matchesSearch(
      `${item.name} ${item.phone} ${item.interestSummary ?? ""} ${item.geo.district}`,
      query.search,
    ),
  );
  items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return delay(
    paginate(
      items.map((item) => ({ ...item, tcName: tcName(item.tcUserId) })),
      query,
    ),
  );
}

export async function getLeadById(
  leadId: string,
  viewer?: SessionUser | null,
): Promise<LeadListItem | null> {
  const lead = scopeByTc(readDemoStore().leads, viewer).find(
    (item) => item.id === leadId,
  );
  return delay(lead ? { ...lead, tcName: tcName(lead.tcUserId) } : null);
}

export async function createLead(
  input: LeadInput,
  viewer?: SessionUser | null,
): Promise<Lead> {
  if (!canWriteCoap(viewer)) throw new Error("Not allowed to create leads");
  const tcUserId =
    viewer?.role === "TERRITORY_COORDINATOR"
      ? viewer.userId
      : input.tcUserId ?? viewer?.userId ?? "user-tc-kigali";
  const stamp = nowIso();
  const lead: Lead = {
    id: id("lead"),
    name: input.name,
    phone: input.phone,
    entityType: input.entityType,
    serviceLine: input.serviceLine,
    status: input.status,
    geo: input.geo,
    tcUserId,
    notes: input.notes,
    interestSummary: input.interestSummary,
    createdAt: stamp,
    updatedAt: stamp,
    convertedAt: input.status === "converted" ? stamp : undefined,
  };
  updateDemoStore((state) => ({ ...state, leads: [lead, ...state.leads] }));
  appendAuditLog({
    actorUserId: viewer?.userId ?? "system",
    action: "lead.create",
    objectType: "lead",
    objectId: lead.id,
    summary: `Created lead ${lead.name} (${serviceLineLabel(lead.serviceLine)})`,
  });
  return delay(lead);
}

export async function updateLead(
  leadId: string,
  input: LeadInput,
  viewer?: SessionUser | null,
): Promise<Lead> {
  if (!canWriteCoap(viewer)) throw new Error("Not allowed to update leads");
  const stamp = nowIso();
  let updated: Lead | null = null;
  updateDemoStore((state) => {
    const existing = state.leads.find((item) => item.id === leadId);
    if (!existing) throw new Error("Lead not found");
    if (
      viewer?.role === "TERRITORY_COORDINATOR" &&
      existing.tcUserId !== viewer.userId
    ) {
      throw new Error("Lead not in your territory");
    }
    updated = {
      ...existing,
      name: input.name,
      phone: input.phone,
      entityType: input.entityType,
      serviceLine: input.serviceLine,
      status: input.status,
      geo: input.geo,
      notes: input.notes,
      interestSummary: input.interestSummary,
      updatedAt: stamp,
      convertedAt:
        input.status === "converted"
          ? existing.convertedAt ?? stamp
          : existing.convertedAt,
    };
    return {
      ...state,
      leads: state.leads.map((item) =>
        item.id === leadId ? (updated as Lead) : item,
      ),
    };
  });
  if (!updated) throw new Error("Lead not found");
  return delay(updated);
}

/* -------------------------------------------------------------------------- */
/* Field activities                                                           */
/* -------------------------------------------------------------------------- */

export interface ActivityQuery extends ListQuery {
  serviceLine?: ServiceLine;
  activityType?: FieldActivityType;
  tcUserId?: string;
}

export type ActivityListItem = FieldActivity & { tcName: string };

export interface ActivityInput {
  serviceLine: ServiceLine;
  activityType: FieldActivityType;
  date: string;
  geo: FieldActivity["geo"];
  venue: string;
  peopleReached: number;
  summary: string;
  outcome: string;
  leadId?: string;
  agentId?: string;
  tcUserId?: string;
}

export async function getFieldActivities(
  query: ActivityQuery = {},
  viewer?: SessionUser | null,
): Promise<Paginated<ActivityListItem>> {
  let items = scopeByTc(readDemoStore().fieldActivities, viewer);
  if (query.serviceLine) {
    items = items.filter((item) => item.serviceLine === query.serviceLine);
  }
  if (query.activityType) {
    items = items.filter((item) => item.activityType === query.activityType);
  }
  if (query.tcUserId) {
    items = items.filter((item) => item.tcUserId === query.tcUserId);
  }
  items = items.filter((item) =>
    matchesSearch(
      `${item.venue} ${item.summary} ${item.outcome} ${item.geo.district}`,
      query.search,
    ),
  );
  items.sort((a, b) => b.date.localeCompare(a.date));
  return delay(
    paginate(
      items.map((item) => ({ ...item, tcName: tcName(item.tcUserId) })),
      query,
    ),
  );
}

export async function getFieldActivityById(
  activityId: string,
  viewer?: SessionUser | null,
): Promise<ActivityListItem | null> {
  const item = scopeByTc(readDemoStore().fieldActivities, viewer).find(
    (row) => row.id === activityId,
  );
  return delay(item ? { ...item, tcName: tcName(item.tcUserId) } : null);
}

export async function createFieldActivity(
  input: ActivityInput,
  viewer?: SessionUser | null,
): Promise<FieldActivity> {
  if (!canWriteCoap(viewer)) throw new Error("Not allowed to create activities");
  const tcUserId =
    viewer?.role === "TERRITORY_COORDINATOR"
      ? viewer.userId
      : input.tcUserId ?? viewer?.userId ?? "user-tc-kigali";
  const activity: FieldActivity = {
    id: id("fact"),
    tcUserId,
    serviceLine: input.serviceLine,
    activityType: input.activityType,
    date: input.date,
    geo: input.geo,
    venue: input.venue,
    peopleReached: input.peopleReached,
    summary: input.summary,
    outcome: input.outcome,
    leadId: input.leadId,
    agentId: input.agentId,
    createdAt: nowIso(),
  };
  updateDemoStore((state) => ({
    ...state,
    fieldActivities: [activity, ...state.fieldActivities],
  }));
  appendAuditLog({
    actorUserId: viewer?.userId ?? "system",
    action: "activity.create",
    objectType: "field_activity",
    objectId: activity.id,
    summary: `Logged ${activity.activityType} for ${serviceLineLabel(activity.serviceLine)}`,
  });
  return delay(activity);
}

/* -------------------------------------------------------------------------- */
/* Onboarding                                                                 */
/* -------------------------------------------------------------------------- */

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
  tcUserId?: string;
}

export async function getOnboardingCases(
  query: OnboardingQuery = {},
  viewer?: SessionUser | null,
): Promise<Paginated<OnboardingListItem>> {
  let items = scopeByTc(readDemoStore().onboardingCases, viewer);
  if (query.serviceLine) {
    items = items.filter((item) => item.serviceLine === query.serviceLine);
  }
  if (query.status) {
    items = items.filter((item) => item.status === query.status);
  }
  if (query.tcUserId) {
    items = items.filter((item) => item.tcUserId === query.tcUserId);
  }
  items = items.filter((item) =>
    matchesSearch(
      `${item.customerName} ${item.customerPhone} ${item.stageLabel} ${item.geo.district}`,
      query.search,
    ),
  );
  items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return delay(
    paginate(
      items.map((item) => ({ ...item, tcName: tcName(item.tcUserId) })),
      query,
    ),
  );
}

export async function getOnboardingById(
  caseId: string,
  viewer?: SessionUser | null,
): Promise<OnboardingListItem | null> {
  const item = scopeByTc(readDemoStore().onboardingCases, viewer).find(
    (row) => row.id === caseId,
  );
  return delay(item ? { ...item, tcName: tcName(item.tcUserId) } : null);
}

export async function createOnboardingCase(
  input: OnboardingInput,
  viewer?: SessionUser | null,
): Promise<OnboardingCase> {
  if (!canWriteCoap(viewer)) throw new Error("Not allowed to create onboarding");
  const tcUserId =
    viewer?.role === "TERRITORY_COORDINATOR"
      ? viewer.userId
      : input.tcUserId ?? viewer?.userId ?? "user-tc-kigali";
  const stamp = nowIso();
  const row: OnboardingCase = {
    id: id("ob"),
    tcUserId,
    serviceLine: input.serviceLine,
    kind: input.kind,
    status: input.status,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    leadId: input.leadId,
    agentId: input.agentId,
    geo: input.geo,
    stageLabel: input.stageLabel,
    notes: input.notes,
    startedAt: stamp,
    updatedAt: stamp,
    completedAt: input.status === "completed" ? stamp : undefined,
  };
  updateDemoStore((state) => ({
    ...state,
    onboardingCases: [row, ...state.onboardingCases],
  }));
  appendAuditLog({
    actorUserId: viewer?.userId ?? "system",
    action: "onboarding.create",
    objectType: "onboarding",
    objectId: row.id,
    summary: `Started onboarding for ${row.customerName}`,
  });
  return delay(row);
}

export async function updateOnboardingCase(
  caseId: string,
  input: OnboardingInput,
  viewer?: SessionUser | null,
): Promise<OnboardingCase> {
  if (!canWriteCoap(viewer)) throw new Error("Not allowed to update onboarding");
  const stamp = nowIso();
  let updated: OnboardingCase | null = null;
  updateDemoStore((state) => {
    const existing = state.onboardingCases.find((item) => item.id === caseId);
    if (!existing) throw new Error("Onboarding case not found");
    if (
      viewer?.role === "TERRITORY_COORDINATOR" &&
      existing.tcUserId !== viewer.userId
    ) {
      throw new Error("Case not in your territory");
    }
    updated = {
      ...existing,
      ...input,
      tcUserId: existing.tcUserId,
      updatedAt: stamp,
      completedAt:
        input.status === "completed"
          ? existing.completedAt ?? stamp
          : existing.completedAt,
    };
    return {
      ...state,
      onboardingCases: state.onboardingCases.map((item) =>
        item.id === caseId ? (updated as OnboardingCase) : item,
      ),
    };
  });
  if (!updated) throw new Error("Onboarding case not found");
  return delay(updated);
}

/* -------------------------------------------------------------------------- */
/* Sales                                                                      */
/* -------------------------------------------------------------------------- */

export interface SaleQuery extends ListQuery {
  serviceLine?: ServiceLine;
  tcUserId?: string;
}

export type SaleListItem = SaleRecord & { tcName: string };

export interface SaleInput {
  serviceLine: ServiceLine;
  productCategory: SaleProductCategory;
  productName: string;
  quantity: number;
  amountRwf: number;
  customerName: string;
  customerPhone: string;
  geo: SaleRecord["geo"];
  soldAt: string;
  leadId?: string;
  onboardingId?: string;
  depositRwf?: number;
  installmentMonths?: number;
  notes?: string;
  tcUserId?: string;
}

export async function getSales(
  query: SaleQuery = {},
  viewer?: SessionUser | null,
): Promise<Paginated<SaleListItem>> {
  let items = scopeByTc(readDemoStore().sales, viewer);
  if (query.serviceLine) {
    items = items.filter((item) => item.serviceLine === query.serviceLine);
  }
  if (query.tcUserId) {
    items = items.filter((item) => item.tcUserId === query.tcUserId);
  }
  items = items.filter((item) =>
    matchesSearch(
      `${item.customerName} ${item.productName} ${item.geo.district}`,
      query.search,
    ),
  );
  items.sort((a, b) => b.soldAt.localeCompare(a.soldAt));
  return delay(
    paginate(
      items.map((item) => ({ ...item, tcName: tcName(item.tcUserId) })),
      query,
    ),
  );
}

export async function getSaleById(
  saleId: string,
  viewer?: SessionUser | null,
): Promise<SaleListItem | null> {
  const item = scopeByTc(readDemoStore().sales, viewer).find(
    (row) => row.id === saleId,
  );
  return delay(item ? { ...item, tcName: tcName(item.tcUserId) } : null);
}

export async function createSale(
  input: SaleInput,
  viewer?: SessionUser | null,
): Promise<SaleRecord> {
  if (!canWriteCoap(viewer)) throw new Error("Not allowed to create sales");
  const tcUserId =
    viewer?.role === "TERRITORY_COORDINATOR"
      ? viewer.userId
      : input.tcUserId ?? viewer?.userId ?? "user-tc-kigali";
  const sale: SaleRecord = {
    id: id("sale"),
    tcUserId,
    serviceLine: input.serviceLine,
    productCategory: input.productCategory,
    productName: input.productName,
    quantity: input.quantity,
    amountRwf: input.amountRwf,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    leadId: input.leadId,
    onboardingId: input.onboardingId,
    depositRwf: input.depositRwf,
    installmentMonths: input.installmentMonths,
    geo: input.geo,
    soldAt: input.soldAt,
    notes: input.notes,
  };
  updateDemoStore((state) => ({ ...state, sales: [sale, ...state.sales] }));
  appendAuditLog({
    actorUserId: viewer?.userId ?? "system",
    action: "sale.create",
    objectType: "sale",
    objectId: sale.id,
    summary: `Recorded sale ${sale.productName} (${sale.amountRwf} RWF)`,
  });
  return delay(sale);
}

/* -------------------------------------------------------------------------- */
/* Feedback                                                                   */
/* -------------------------------------------------------------------------- */

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
  tcUserId?: string;
}

export async function getCommunityFeedback(
  query: FeedbackQuery = {},
  viewer?: SessionUser | null,
): Promise<Paginated<FeedbackListItem>> {
  let items = scopeByTc(readDemoStore().communityFeedback, viewer);
  if (query.serviceLine) {
    items = items.filter((item) => item.serviceLine === query.serviceLine);
  }
  if (query.kind) {
    items = items.filter((item) => item.kind === query.kind);
  }
  if (query.status) {
    items = items.filter((item) => item.status === query.status);
  }
  if (query.tcUserId) {
    items = items.filter((item) => item.tcUserId === query.tcUserId);
  }
  items = items.filter((item) =>
    matchesSearch(
      `${item.title} ${item.description} ${item.geo.district}`,
      query.search,
    ),
  );
  items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return delay(
    paginate(
      items.map((item) => ({ ...item, tcName: tcName(item.tcUserId) })),
      query,
    ),
  );
}

export async function getFeedbackById(
  feedbackId: string,
  viewer?: SessionUser | null,
): Promise<FeedbackListItem | null> {
  const item = scopeByTc(readDemoStore().communityFeedback, viewer).find(
    (row) => row.id === feedbackId,
  );
  return delay(item ? { ...item, tcName: tcName(item.tcUserId) } : null);
}

export async function createCommunityFeedback(
  input: FeedbackInput,
  viewer?: SessionUser | null,
): Promise<CommunityFeedback> {
  if (!canWriteCoap(viewer)) throw new Error("Not allowed to create feedback");
  const tcUserId =
    viewer?.role === "TERRITORY_COORDINATOR"
      ? viewer.userId
      : input.tcUserId ?? viewer?.userId ?? "user-tc-kigali";
  const stamp = nowIso();
  const row: CommunityFeedback = {
    id: id("fb"),
    tcUserId,
    serviceLine: input.serviceLine,
    kind: input.kind,
    severity: input.severity,
    status: input.status,
    title: input.title,
    description: input.description,
    geo: input.geo,
    leadId: input.leadId,
    createdAt: stamp,
    updatedAt: stamp,
    resolutionNotes: input.resolutionNotes,
  };
  updateDemoStore((state) => ({
    ...state,
    communityFeedback: [row, ...state.communityFeedback],
  }));
  appendAuditLog({
    actorUserId: viewer?.userId ?? "system",
    action: "feedback.create",
    objectType: "feedback",
    objectId: row.id,
    summary: `Logged community ${row.kind}: ${row.title}`,
  });
  return delay(row);
}

export async function updateCommunityFeedback(
  feedbackId: string,
  input: FeedbackInput,
  viewer?: SessionUser | null,
): Promise<CommunityFeedback> {
  if (!canWriteCoap(viewer)) throw new Error("Not allowed to update feedback");
  const stamp = nowIso();
  let updated: CommunityFeedback | null = null;
  updateDemoStore((state) => {
    const existing = state.communityFeedback.find(
      (item) => item.id === feedbackId,
    );
    if (!existing) throw new Error("Feedback not found");
    if (
      viewer?.role === "TERRITORY_COORDINATOR" &&
      existing.tcUserId !== viewer.userId
    ) {
      throw new Error("Feedback not in your territory");
    }
    updated = {
      ...existing,
      serviceLine: input.serviceLine,
      kind: input.kind,
      severity: input.severity,
      status: input.status,
      title: input.title,
      description: input.description,
      geo: input.geo,
      leadId: input.leadId,
      resolutionNotes: input.resolutionNotes,
      updatedAt: stamp,
    };
    return {
      ...state,
      communityFeedback: state.communityFeedback.map((item) =>
        item.id === feedbackId ? (updated as CommunityFeedback) : item,
      ),
    };
  });
  if (!updated) throw new Error("Feedback not found");
  return delay(updated);
}

/* -------------------------------------------------------------------------- */
/* Services hub + programme dashboard                                         */
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

export async function getServicesWorkspace(
  viewer?: SessionUser | null,
): Promise<{ lines: ServiceLineSummary[] }> {
  const store = readDemoStore();
  const leads = scopeByTc(store.leads, viewer);
  const activities = scopeByTc(store.fieldActivities, viewer);
  const onboarding = scopeByTc(store.onboardingCases, viewer);
  const sales = scopeByTc(store.sales, viewer);
  const feedback = scopeByTc(store.communityFeedback, viewer);

  const lines = SERVICE_LINES.map((meta) => {
    const lineLeads = leads.filter((item) => item.serviceLine === meta.id);
    const lineSales = sales.filter((item) => item.serviceLine === meta.id);
    return {
      id: meta.id,
      label: meta.label,
      shortLabel: meta.shortLabel,
      description: meta.description,
      tasks: meta.tasks,
      leads: lineLeads.length,
      openLeads: lineLeads.filter(
        (item) => item.status !== "converted" && item.status !== "lost",
      ).length,
      activities: activities.filter((item) => item.serviceLine === meta.id)
        .length,
      onboardingOpen: onboarding.filter(
        (item) =>
          item.serviceLine === meta.id &&
          item.status !== "completed" &&
          item.status !== "cancelled",
      ).length,
      sales: lineSales.length,
      salesAmountRwf: lineSales.reduce((sum, item) => sum + item.amountRwf, 0),
      feedbackOpen: feedback.filter(
        (item) =>
          item.serviceLine === meta.id &&
          (item.status === "open" || item.status === "acknowledged"),
      ).length,
    };
  });

  return delay({ lines });
}

export interface CoapDashboard {
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

export async function getCoapDashboard(
  viewer?: SessionUser | null,
): Promise<CoapDashboard> {
  const store = readDemoStore();
  const leads = scopeByTc(store.leads, viewer);
  const activities = scopeByTc(store.fieldActivities, viewer);
  const onboarding = scopeByTc(store.onboardingCases, viewer);
  const sales = scopeByTc(store.sales, viewer);
  const feedback = scopeByTc(store.communityFeedback, viewer);

  const monthPrefix = "2026-09";

  return delay({
    summary: {
      openLeads: leads.filter(
        (item) => item.status !== "converted" && item.status !== "lost",
      ).length,
      activitiesThisMonth: activities.filter((item) =>
        item.date.startsWith(monthPrefix),
      ).length,
      onboardingInProgress: onboarding.filter(
        (item) =>
          item.status === "in_progress" || item.status === "pending_partner",
      ).length,
      salesThisMonth: sales.filter((item) =>
        item.soldAt.startsWith(monthPrefix),
      ).length,
      salesAmountRwf: sales
        .filter((item) => item.soldAt.startsWith(monthPrefix))
        .reduce((sum, item) => sum + item.amountRwf, 0),
      feedbackOpen: feedback.filter(
        (item) => item.status === "open" || item.status === "acknowledged",
      ).length,
      peopleReached: activities.reduce(
        (sum, item) => sum + item.peopleReached,
        0,
      ),
    },
    byService: SERVICE_LINES.map((meta) => ({
      serviceLine: meta.id,
      label: meta.shortLabel,
      leads: leads.filter((item) => item.serviceLine === meta.id).length,
      activities: activities.filter((item) => item.serviceLine === meta.id)
        .length,
      sales: sales.filter((item) => item.serviceLine === meta.id).length,
      onboarding: onboarding.filter((item) => item.serviceLine === meta.id)
        .length,
    })),
    recentLeads: leads
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5)
      .map((item) => ({ ...item, tcName: tcName(item.tcUserId) })),
    recentActivities: activities
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map((item) => ({ ...item, tcName: tcName(item.tcUserId) })),
  });
}

export async function getCoapFilterOptions(viewer?: SessionUser | null) {
  const store = readDemoStore();
  const leads = scopeByTc(store.leads, viewer);
  const provinces = Array.from(
    new Set(leads.map((item) => item.geo.province)),
  ).sort();
  const districts = Array.from(
    new Set(leads.map((item) => item.geo.district)),
  ).sort();
  return delay({
    provinces:
      provinces.length > 0
        ? provinces
        : ["Kigali City", "Southern Province"],
    districts:
      districts.length > 0
        ? districts
        : ["Gasabo", "Kicukiro", "Nyarugenge", "Huye", "Muhanga"],
    sectors: ["Remera", "Kimironko", "Kanombe", "Nyamirambo", "Gikondo", "Ngoma", "Nyamabuye"],
    coordinators: DEMO_USERS.filter(
      (user) => user.role === "TERRITORY_COORDINATOR",
    ).map((user) => ({ id: user.id, name: user.name })),
    serviceLines: SERVICE_LINES.map((item) => ({
      id: item.id,
      label: item.shortLabel,
    })),
  });
}

export function leadStatusTone(status: LeadStatus) {
  if (status === "converted") return "success" as const;
  if (status === "lost") return "danger" as const;
  if (status === "qualified") return "info" as const;
  if (status === "contacted") return "warning" as const;
  return "neutral" as const;
}

export function onboardingStatusTone(status: OnboardingStatus) {
  if (status === "completed") return "success" as const;
  if (status === "cancelled") return "danger" as const;
  if (status === "pending_partner") return "warning" as const;
  if (status === "in_progress") return "info" as const;
  return "neutral" as const;
}

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
