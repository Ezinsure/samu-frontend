import { DEMO_USERS } from "@data/index";
import { delay, matchesSearch, paginate } from "@/lib/api/helpers";
import { readDemoStore, updateDemoStore } from "@/lib/store/demo-store";
import type {
  FraudFlag,
  FraudReviewEvent,
  ListQuery,
  Paginated,
  SessionUser,
  Visit,
  VisitValidation,
} from "@/types";

export type FraudReviewAction = "accept" | "escalate" | "dismiss";

export interface FraudQuery extends ListQuery {
  status?: string;
  severity?: string;
  type?: string;
  search?: string;
}

export interface FraudListItem extends FraudFlag {
  agentName: string;
  agentCode: string;
  tcName: string;
  tcUserId: string;
  visitPurpose: string;
  visitStartedAt: string;
  visitValidation: VisitValidation;
  distanceFromRegisteredMeters: number;
  photoCount: number;
}

export interface FraudDetail extends FraudListItem {
  visit: Visit;
  agentId: string;
  reviewerName?: string;
  assignedReviewerName?: string;
  reviewHistoryEnriched: Array<
    FraudReviewEvent & { byName: string }
  >;
}

function userName(userId: string) {
  return DEMO_USERS.find((user) => user.id === userId)?.name ?? userId;
}

export function canReviewFraud(viewer?: SessionUser | null) {
  return (
    viewer?.role === "ADMIN" || viewer?.role === "OPERATIONS_MANAGER"
  );
}

export function canViewFraud(viewer?: SessionUser | null) {
  return (
    canReviewFraud(viewer) || viewer?.role === "MD_VIEWER"
  );
}

export function fraudStatusTone(status: FraudFlag["status"]) {
  if (status === "open") return "warning" as const;
  if (status === "escalated") return "danger" as const;
  if (status === "resolved") return "success" as const;
  return "neutral" as const;
}

export function fraudStatusLabel(status: FraudFlag["status"]) {
  if (status === "open") return "Open";
  if (status === "escalated") return "Escalated";
  if (status === "resolved") return "Resolved";
  return "Dismissed";
}

export function severityTone(severity: FraudFlag["severity"]) {
  if (severity === "high") return "danger" as const;
  if (severity === "medium") return "warning" as const;
  return "info" as const;
}

function enrichFlag(
  flag: FraudFlag,
  visits: Visit[],
  agents: ReturnType<typeof readDemoStore>["agents"],
): FraudListItem | null {
  const visit = visits.find((item) => item.id === flag.visitId);
  if (!visit) return null;
  const agent = agents.find((item) => item.id === visit.agentId);
  if (!agent) return null;

  return {
    ...flag,
    agentName: agent.name,
    agentCode: agent.code,
    tcName: userName(visit.tcUserId),
    tcUserId: visit.tcUserId,
    visitPurpose: visit.purpose,
    visitStartedAt: visit.startedAt,
    visitValidation: visit.validation,
    distanceFromRegisteredMeters: visit.distanceFromRegisteredMeters,
    photoCount: visit.photoCount,
  };
}

export async function getFraudFilterOptions() {
  const store = readDemoStore();
  const types = Array.from(
    new Set(store.fraudFlags.map((flag) => flag.type)),
  ).sort();
  return delay({
    types,
    statuses: ["open", "escalated", "resolved", "dismissed"] as const,
    severities: ["low", "medium", "high"] as const,
  });
}

export async function getFraudFlags(
  query: FraudQuery = {},
  viewer?: SessionUser | null,
): Promise<Paginated<FraudListItem>> {
  if (!canViewFraud(viewer)) {
    return delay(paginate([], query));
  }

  const store = readDemoStore();
  let items = store.fraudFlags
    .map((flag) => enrichFlag(flag, store.visits, store.agents))
    .filter((item): item is FraudListItem => item !== null);

  if (query.status) {
    items = items.filter((item) => item.status === query.status);
  }
  if (query.severity) {
    items = items.filter((item) => item.severity === query.severity);
  }
  if (query.type) {
    items = items.filter((item) => item.type === query.type);
  }
  if (query.search) {
    items = items.filter((item) =>
      matchesSearch(
        `${item.agentName} ${item.agentCode} ${item.type} ${item.tcName} ${item.notes ?? ""}`,
        query.search,
      ),
    );
  }

  items.sort((a, b) => {
    const rank = (status: FraudFlag["status"]) => {
      if (status === "open") return 0;
      if (status === "escalated") return 1;
      if (status === "resolved") return 2;
      return 3;
    };
    const byStatus = rank(a.status) - rank(b.status);
    if (byStatus !== 0) return byStatus;
    return (
      new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
    );
  });

  return delay(paginate(items, query));
}

export async function getFraudDetail(
  id: string,
  viewer?: SessionUser | null,
): Promise<FraudDetail | null> {
  if (!canViewFraud(viewer)) return delay(null);

  const store = readDemoStore();
  const flag = store.fraudFlags.find((item) => item.id === id);
  if (!flag) return delay(null);

  const enriched = enrichFlag(flag, store.visits, store.agents);
  if (!enriched) return delay(null);

  const visit = store.visits.find((item) => item.id === flag.visitId);
  if (!visit) return delay(null);

  return delay({
    ...enriched,
    visit,
    agentId: visit.agentId,
    reviewerName: flag.reviewedByUserId
      ? userName(flag.reviewedByUserId)
      : undefined,
    assignedReviewerName: flag.assignedReviewerId
      ? userName(flag.assignedReviewerId)
      : undefined,
    reviewHistoryEnriched: (flag.reviewHistory ?? []).map((event) => ({
      ...event,
      byName: userName(event.byUserId),
    })),
  });
}

/**
 * Review a fraud flag. TC cannot approve their own visit flags.
 * Accept clears the visit as accepted; dismiss closes as false positive;
 * escalate keeps the queue open with elevated severity.
 */
export async function reviewFraudFlag(
  flagId: string,
  action: FraudReviewAction,
  notes: string,
  actor: SessionUser,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canReviewFraud(actor)) {
    return delay({
      ok: false,
      error: "You are not authorized to review fraud flags.",
    });
  }

  if (!notes.trim()) {
    return delay({ ok: false, error: "Review notes are required." });
  }

  const store = readDemoStore();
  const flag = store.fraudFlags.find((item) => item.id === flagId);
  if (!flag) {
    return delay({ ok: false, error: "Fraud flag not found." });
  }

  const visit = store.visits.find((item) => item.id === flag.visitId);
  if (!visit) {
    return delay({ ok: false, error: "Linked visit not found." });
  }

  if (visit.tcUserId === actor.userId) {
    return delay({
      ok: false,
      error: "You cannot review a flag on your own visit submission.",
    });
  }

  if (flag.status === "resolved" || flag.status === "dismissed") {
    return delay({
      ok: false,
      error: "This flag has already been closed.",
    });
  }

  const now = new Date().toISOString();
  const event: FraudReviewEvent = {
    id: `freview-${Date.now()}`,
    at: now,
    byUserId: actor.userId,
    action,
    notes: notes.trim(),
  };

  let nextStatus: FraudFlag["status"] = flag.status;
  let nextSeverity = flag.severity;
  let nextVisitValidation = visit.validation;
  let actionLabel = action;

  if (action === "accept") {
    nextStatus = "resolved";
    nextVisitValidation = "accepted";
    actionLabel = "accept";
  } else if (action === "dismiss") {
    nextStatus = "dismissed";
    nextVisitValidation = "accepted";
  } else {
    nextStatus = "escalated";
    nextSeverity = "high";
  }

  updateDemoStore((state) => {
    const fraudFlags = state.fraudFlags.map((item) =>
      item.id === flagId
        ? {
            ...item,
            status: nextStatus,
            severity: nextSeverity,
            resolution: notes.trim(),
            reviewedAt: now,
            reviewedByUserId: actor.userId,
            assignedReviewerId:
              action === "escalate" ? actor.userId : item.assignedReviewerId,
            reviewHistory: [...(item.reviewHistory ?? []), event],
          }
        : item,
    );

    const visits = state.visits.map((item) =>
      item.id === visit.id
        ? {
            ...item,
            validation: nextVisitValidation,
            flaggedReason:
              action === "accept" || action === "dismiss"
                ? undefined
                : item.flaggedReason,
          }
        : item,
    );

    return {
      ...state,
      fraudFlags,
      visits,
      auditLogs: [
        {
          id: `audit-${Date.now()}`,
          actorUserId: actor.userId,
          action: `fraud.${actionLabel}`,
          objectType: "fraud_flag",
          objectId: flagId,
          timestamp: now,
          summary: `${userName(actor.userId)} ${actionLabel}ed fraud flag ${flag.type} for visit ${visit.id}.`,
        },
        ...state.auditLogs,
      ],
    };
  });

  return delay({ ok: true });
}
