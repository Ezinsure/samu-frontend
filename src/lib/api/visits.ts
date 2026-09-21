import { DEMO_USERS } from "@data/index";
import { delay, matchesSearch, paginate } from "@/lib/api/helpers";
import { readDemoStore, updateDemoStore } from "@/lib/store/demo-store";
import type {
  Agent,
  AgentServices,
  Coordinates,
  ListQuery,
  Paginated,
  SessionUser,
  Visit,
  VisitPurpose,
  VisitValidation,
} from "@/types";

export const VISIT_PURPOSES: VisitPurpose[] = [
  "Ezinsure Support",
  "Performance Review",
  "Problem Solving",
];

export const INTERNET_TYPES = [
  "Solektra Telecom",
  "MTN",
  "Airtel",
  "Mango",
  "Other",
];

export interface VisitQuery extends ListQuery {
  tcUserId?: string;
  agentId?: string;
  validation?: string;
  confirmation?: string;
  purpose?: string;
  search?: string;
}

export interface VisitListItem extends Visit {
  agentName: string;
  agentCode: string;
  agentDistrict: string;
  tcName: string;
}

export interface VisitDetail extends VisitListItem {
  agent: Agent;
  fraudFlags: Array<{
    id: string;
    type: string;
    severity: "low" | "medium" | "high";
    status: "open" | "escalated" | "resolved" | "dismissed";
    detectedAt: string;
    notes?: string;
  }>;
  gpsThresholdMeters: number;
}

export interface VisitCaptureInput {
  agentId: string;
  purpose: VisitPurpose;
  startedAt: string;
  endedAt: string;
  location: Coordinates;
  distanceFromRegisteredMeters: number;
  activities: string;
  outcome: string;
  challenges?: string;
  supportNeeded?: string;
  checklist: AgentServices;
  photos: Array<{ id: string; name: string; dataUrl?: string }>;
  deviceInfo?: string;
}

export function canCaptureVisits(viewer?: SessionUser | null) {
  return (
    viewer?.role === "TERRITORY_COORDINATOR" || viewer?.role === "ADMIN"
  );
}

export function canViewAllVisits(viewer?: SessionUser | null) {
  return (
    viewer?.role === "ADMIN" ||
    viewer?.role === "OPERATIONS_MANAGER" ||
    viewer?.role === "MD_VIEWER"
  );
}

function userName(userId: string) {
  return DEMO_USERS.find((user) => user.id === userId)?.name ?? userId;
}

function enrichVisit(visit: Visit, agents: Agent[]): VisitListItem | null {
  const agent = agents.find((item) => item.id === visit.agentId);
  if (!agent) return null;
  return {
    ...visit,
    agentName: agent.name,
    agentCode: agent.code,
    agentDistrict: agent.geo.district,
    tcName: userName(visit.tcUserId),
  };
}

function scopeVisits(visits: Visit[], viewer?: SessionUser | null) {
  if (viewer?.role === "TERRITORY_COORDINATOR") {
    return visits.filter((visit) => visit.tcUserId === viewer.userId);
  }
  return visits;
}

/** Haversine distance in meters between two WGS84 points. */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earth = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(h));
}

export function evaluateGpsValidation(
  distanceFromRegisteredMeters: number,
  thresholdMeters: number,
): { validation: VisitValidation; flaggedReason?: string } {
  if (distanceFromRegisteredMeters <= thresholdMeters) {
    return { validation: "accepted" };
  }
  return {
    validation: "flagged",
    flaggedReason: `GPS distance ${Math.round(distanceFromRegisteredMeters)}m above threshold (${thresholdMeters}m)`,
  };
}

export function validationTone(validation: VisitValidation) {
  if (validation === "accepted") return "success" as const;
  if (validation === "flagged") return "warning" as const;
  return "danger" as const;
}

export function validationLabel(validation: VisitValidation) {
  if (validation === "accepted") return "Accepted";
  if (validation === "flagged") return "Flagged";
  return "Rejected";
}

export function confirmationTone(status: Visit["confirmationStatus"]) {
  if (status === "confirmed") return "success" as const;
  if (status === "pending") return "info" as const;
  if (status === "disputed") return "warning" as const;
  if (status === "delivery_failed") return "danger" as const;
  return "neutral" as const;
}

export function confirmationLabel(status: Visit["confirmationStatus"]) {
  if (status === "confirmed") return "Confirmed";
  if (status === "pending") return "Pending SMS";
  if (status === "disputed") return "Disputed";
  if (status === "delivery_failed") return "Delivery failed";
  return "Expired";
}

export async function getVisitFilterOptions(viewer?: SessionUser | null) {
  const store = readDemoStore();
  const visits = scopeVisits(store.visits, viewer);
  const agentIds = new Set(visits.map((visit) => visit.agentId));
  const agents = store.agents
    .filter((agent) => {
      if (viewer?.role === "TERRITORY_COORDINATOR") {
        return agent.tcUserId === viewer.userId;
      }
      return agentIds.has(agent.id) || agent.status === "Active";
    })
    .map((agent) => ({ id: agent.id, name: agent.name, code: agent.code }));

  const coordinators = DEMO_USERS.filter(
    (user) => user.role === "TERRITORY_COORDINATOR",
  ).map((user) => ({ id: user.id, name: user.name }));

  return delay({
    agents,
    coordinators,
    purposes: VISIT_PURPOSES,
    validations: ["accepted", "flagged", "rejected"] as VisitValidation[],
    confirmations: [
      "pending",
      "confirmed",
      "disputed",
      "expired",
      "delivery_failed",
    ] as Visit["confirmationStatus"][],
    gpsThresholdMeters: store.settings.gpsDistanceMeters,
  });
}

export async function getVisits(
  query: VisitQuery = {},
  viewer?: SessionUser | null,
): Promise<Paginated<VisitListItem>> {
  const store = readDemoStore();
  let items = scopeVisits(store.visits, viewer)
    .map((visit) => enrichVisit(visit, store.agents))
    .filter((item): item is VisitListItem => item !== null);

  if (query.tcUserId) {
    items = items.filter((visit) => visit.tcUserId === query.tcUserId);
  }
  if (query.agentId) {
    items = items.filter((visit) => visit.agentId === query.agentId);
  }
  if (query.validation) {
    items = items.filter((visit) => visit.validation === query.validation);
  }
  if (query.confirmation) {
    items = items.filter(
      (visit) => visit.confirmationStatus === query.confirmation,
    );
  }
  if (query.purpose) {
    items = items.filter((visit) => visit.purpose === query.purpose);
  }
  if (query.search) {
    items = items.filter((visit) =>
      matchesSearch(
        `${visit.agentName} ${visit.agentCode} ${visit.purpose} ${visit.tcName} ${visit.agentDistrict}`,
        query.search,
      ),
    );
  }

  items.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

  return delay(paginate(items, query));
}

export async function getVisitDetail(
  id: string,
  viewer?: SessionUser | null,
): Promise<VisitDetail | null> {
  const store = readDemoStore();
  const visit = store.visits.find((item) => item.id === id);
  if (!visit) return delay(null);

  if (
    viewer?.role === "TERRITORY_COORDINATOR" &&
    visit.tcUserId !== viewer.userId
  ) {
    return delay(null);
  }

  const enriched = enrichVisit(visit, store.agents);
  if (!enriched) return delay(null);

  const agent = store.agents.find((item) => item.id === visit.agentId);
  if (!agent) return delay(null);

  const fraudFlags = store.fraudFlags.filter((flag) => flag.visitId === id);

  return delay({
    ...enriched,
    agent,
    fraudFlags,
    gpsThresholdMeters: store.settings.gpsDistanceMeters,
  });
}

export async function getGpsThreshold() {
  return delay(readDemoStore().settings.gpsDistanceMeters);
}

/**
 * Submit a field visit. Applies GPS threshold validation, queues SMS
 * confirmation, updates agent last-visit/compliance/services, and opens a
 * fraud flag when distance exceeds the configured threshold.
 */
export async function createVisit(
  input: VisitCaptureInput,
  actor: SessionUser,
): Promise<{ ok: true; visit: Visit } | { ok: false; error: string }> {
  if (!canCaptureVisits(actor)) {
    return delay({ ok: false, error: "You are not authorized to capture visits." });
  }

  const store = readDemoStore();
  const agent = store.agents.find((item) => item.id === input.agentId);
  if (!agent) {
    return delay({ ok: false, error: "Selected agent was not found." });
  }

  if (
    actor.role === "TERRITORY_COORDINATOR" &&
    agent.tcUserId !== actor.userId
  ) {
    return delay({
      ok: false,
      error: "You can only visit agents assigned to you.",
    });
  }

  if (!input.photos.length) {
    return delay({ ok: false, error: "At least one photo is required." });
  }

  if (!input.activities.trim() || !input.outcome.trim()) {
    return delay({
      ok: false,
      error: "Activities and outcome are required.",
    });
  }

  if (
    input.checklist.internetAvailable &&
    !input.checklist.internetType?.trim()
  ) {
    return delay({
      ok: false,
      error: "Select an internet type when internet is available.",
    });
  }

  const threshold = store.settings.gpsDistanceMeters;
  const gps = evaluateGpsValidation(
    input.distanceFromRegisteredMeters,
    threshold,
  );

  const started = new Date(input.startedAt).getTime();
  const ended = new Date(input.endedAt).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(ended) || ended < started) {
    return delay({ ok: false, error: "Visit timestamps are invalid." });
  }

  const durationMinutes = Math.max(
    1,
    Math.round((ended - started) / 60000),
  );

  const created: Visit = {
    id: `visit-${Date.now()}`,
    agentId: input.agentId,
    tcUserId:
      actor.role === "TERRITORY_COORDINATOR" ? actor.userId : agent.tcUserId,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    durationMinutes,
    purpose: input.purpose,
    activities: input.activities.trim(),
    outcome: input.outcome.trim(),
    location: input.location,
    distanceFromRegisteredMeters: Math.round(
      input.distanceFromRegisteredMeters,
    ),
    validation: gps.validation,
    confirmationStatus: "pending",
    photoCount: input.photos.length,
    challenges: input.challenges?.trim() || undefined,
    supportNeeded: input.supportNeeded?.trim() || undefined,
    flaggedReason: gps.flaggedReason,
    checklist: { ...input.checklist },
    photos: input.photos.map((photo) => ({ ...photo })),
    deviceInfo: input.deviceInfo,
  };

  updateDemoStore((state) => {
    const agents = state.agents.map((item) =>
      item.id === created.agentId
        ? {
            ...item,
            lastVisitAt: created.endedAt,
            compliance: "green" as const,
            services: { ...input.checklist },
          }
        : item,
    );

    const fraudFlags =
      created.validation === "flagged"
        ? [
            {
              id: `fraud-${Date.now()}`,
              visitId: created.id,
              type: "GPS mismatch",
              severity: "high" as const,
              status: "open" as const,
              detectedAt: created.endedAt,
              notes:
                created.flaggedReason ??
                `Visit captured ${created.distanceFromRegisteredMeters}m from registered location.`,
              reviewHistory: [],
            },
            ...state.fraudFlags,
          ]
        : state.fraudFlags;

    return {
      ...state,
      visits: [created, ...state.visits],
      agents,
      fraudFlags,
      auditLogs: [
        {
          id: `audit-${Date.now()}`,
          actorUserId: actor.userId,
          action: "visit.submit",
          objectType: "visit",
          objectId: created.id,
          timestamp: created.endedAt,
          summary: `Visit submitted for ${agent.name} (${created.validation}; SMS confirmation queued).`,
        },
        ...state.auditLogs,
      ],
    };
  });

  return delay({ ok: true, visit: created });
}

/** Offset a registered location slightly for demo GPS simulation. */
export function simulateNearAgentLocation(
  registered: Coordinates,
  offsetMeters = 6,
): Coordinates {
  const latOffset = offsetMeters / 111_320;
  const lngOffset =
    offsetMeters / (111_320 * Math.cos((registered.lat * Math.PI) / 180));
  return {
    lat: Number((registered.lat + latOffset).toFixed(6)),
    lng: Number((registered.lng + lngOffset).toFixed(6)),
    accuracyMeters: 5,
  };
}

export function simulateFarAgentLocation(
  registered: Coordinates,
  offsetMeters = 150,
): Coordinates {
  return simulateNearAgentLocation(registered, offsetMeters);
}
