import { DEMO_USERS } from "@data/index";
import { delay, matchesSearch, paginate } from "@/lib/api/helpers";
import { readDemoStore, updateDemoStore } from "@/lib/store/demo-store";
import type {
  ActionItem,
  ListQuery,
  Meeting,
  Paginated,
  SensitizationEvent,
  SessionUser,
  TrainingSession,
} from "@/types";

export const SENSITIZATION_EVENT_TYPES = [
  "Community Meeting",
  "Market Campaign",
  "School Outreach",
  "Church / Mosque Briefing",
  "Other",
];

export const TRAINING_TOPICS = [
  "Ezinsure System",
  "Insurance Products",
  "Telecom Services",
  "BK Tools",
  "Sales & Pitching",
  "Other",
];

export const TRAINING_FORMATS = [
  "Group session",
  "One-on-one",
  "Virtual",
  "On-the-job coaching",
];

export const MEETING_TYPES: Meeting["meetingType"][] = [
  "Agent Meeting",
  "Partner / Authority",
  "Head Office",
];

function userName(userId: string) {
  return DEMO_USERS.find((user) => user.id === userId)?.name ?? userId;
}

export function canCreateActivities(viewer?: SessionUser | null) {
  return (
    viewer?.role === "TERRITORY_COORDINATOR" || viewer?.role === "ADMIN"
  );
}

export function canManageActionItems(viewer?: SessionUser | null) {
  return (
    viewer?.role === "TERRITORY_COORDINATOR" ||
    viewer?.role === "ADMIN" ||
    viewer?.role === "OPERATIONS_MANAGER"
  );
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

function sourceHref(
  sourceType: ActionItem["sourceType"],
  sourceId: string,
): string {
  if (sourceType === "visit") return `/visits/${sourceId}`;
  if (sourceType === "sensitization") return `/sensitization/${sourceId}`;
  if (sourceType === "training") return `/training/${sourceId}`;
  if (sourceType === "meeting") return `/meetings/${sourceId}`;
  return `/monthly-reports`;
}

export async function getActivityGeoOptions(viewer?: SessionUser | null) {
  const store = readDemoStore();
  let territories = store.territories;
  if (viewer?.role === "TERRITORY_COORDINATOR") {
    const districtIds = new Set(
      territories
        .filter(
          (item) =>
            item.type === "district" && item.tcUserId === viewer.userId,
        )
        .map((item) => item.id),
    );
    territories = territories.filter(
      (item) =>
        item.type === "province" ||
        districtIds.has(item.id) ||
        (item.parentId ? districtIds.has(item.parentId) : false),
    );
  }

  const provinces = territories
    .filter((item) => item.type === "province")
    .map((item) => item.name)
    .sort();
  const districts = territories
    .filter((item) => item.type === "district")
    .map((item) => ({
      name: item.name,
      province:
        territories.find((parent) => parent.id === item.parentId)?.name ?? "",
      id: item.id,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const sectors = territories
    .filter((item) => item.type === "sector")
    .map((item) => {
      const district = territories.find((parent) => parent.id === item.parentId);
      return {
        name: item.name,
        district: district?.name ?? "",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return delay({ provinces, districts, sectors });
}

/* ---------------- Sensitization ---------------- */

export interface SensitizationQuery extends ListQuery {
  search?: string;
  district?: string;
  eventType?: string;
  tcUserId?: string;
}

export interface SensitizationListItem extends SensitizationEvent {
  tcName: string;
  actionCount: number;
}

export interface SensitizationInput {
  date: string;
  province: string;
  district: string;
  sector: string;
  venue: string;
  eventType: string;
  peopleReached: number;
  approach: string;
  outcome: string;
  followUpTitle?: string;
  followUpDescription?: string;
  followUpDueDate?: string;
}

export async function getSensitizations(
  query: SensitizationQuery = {},
  viewer?: SessionUser | null,
): Promise<Paginated<SensitizationListItem>> {
  const store = readDemoStore();
  let items = scopeByTc(store.sensitizations, viewer).map((item) => ({
    ...item,
    tcName: userName(item.tcUserId),
    actionCount: store.actionItems.filter(
      (action) =>
        action.sourceType === "sensitization" && action.sourceId === item.id,
    ).length,
  }));

  if (query.district) {
    items = items.filter((item) => item.geo.district === query.district);
  }
  if (query.eventType) {
    items = items.filter((item) => item.eventType === query.eventType);
  }
  if (query.tcUserId) {
    items = items.filter((item) => item.tcUserId === query.tcUserId);
  }
  if (query.search) {
    items = items.filter((item) =>
      matchesSearch(
        `${item.venue} ${item.eventType} ${item.geo.district} ${item.outcome} ${item.tcName}`,
        query.search,
      ),
    );
  }

  items.sort((a, b) => b.date.localeCompare(a.date));
  return delay(paginate(items, query));
}

export async function getSensitizationDetail(
  id: string,
  viewer?: SessionUser | null,
) {
  const store = readDemoStore();
  const item = store.sensitizations.find((entry) => entry.id === id);
  if (!item) return delay(null);
  if (
    viewer?.role === "TERRITORY_COORDINATOR" &&
    item.tcUserId !== viewer.userId
  ) {
    return delay(null);
  }
  const actions = store.actionItems.filter(
    (action) =>
      action.sourceType === "sensitization" && action.sourceId === item.id,
  );
  return delay({
    ...item,
    tcName: userName(item.tcUserId),
    actions: actions.map((action) => ({
      ...action,
      ownerName: userName(action.ownerUserId),
      sourceHref: sourceHref(action.sourceType, action.sourceId),
    })),
  });
}

export async function createSensitization(
  input: SensitizationInput,
  actor: SessionUser,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!canCreateActivities(actor)) {
    return delay({ ok: false, error: "Not authorized to create events." });
  }
  if (
    !input.date ||
    !input.venue.trim() ||
    !input.approach.trim() ||
    !input.outcome.trim()
  ) {
    return delay({ ok: false, error: "Complete all required fields." });
  }

  const id = `sens-${Date.now()}`;
  const tcUserId =
    actor.role === "TERRITORY_COORDINATOR" ? actor.userId : actor.userId;
  const now = new Date().toISOString();

  updateDemoStore((state) => {
    const created: SensitizationEvent = {
      id,
      tcUserId,
      date: input.date,
      geo: {
        province: input.province,
        district: input.district,
        sector: input.sector,
      },
      venue: input.venue.trim(),
      eventType: input.eventType,
      peopleReached: Math.max(0, input.peopleReached),
      approach: input.approach.trim(),
      outcome: input.outcome.trim(),
    };

    let actionItems = state.actionItems;
    if (input.followUpTitle?.trim()) {
      const district = state.territories.find(
        (item) =>
          item.type === "district" && item.name === input.district,
      );
      actionItems = [
        {
          id: `action-${Date.now()}`,
          title: input.followUpTitle.trim(),
          description:
            input.followUpDescription?.trim() ||
            `Follow-up from sensitization at ${input.venue}.`,
          sourceType: "sensitization",
          sourceId: id,
          ownerUserId: tcUserId,
          priority: "medium",
          dueDate:
            input.followUpDueDate ||
            new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          status: "open",
          territoryId: district?.id,
        },
        ...actionItems,
      ];
    }

    return {
      ...state,
      sensitizations: [created, ...state.sensitizations],
      actionItems,
      auditLogs: [
        {
          id: `audit-${Date.now()}`,
          actorUserId: actor.userId,
          action: "sensitization.create",
          objectType: "sensitization",
          objectId: id,
          timestamp: now,
          summary: `Sensitization recorded at ${created.venue} (${created.peopleReached} reached).`,
        },
        ...state.auditLogs,
      ],
    };
  });

  return delay({ ok: true, id });
}

/* ---------------- Training ---------------- */

export interface TrainingQuery extends ListQuery {
  search?: string;
  topic?: string;
  tcUserId?: string;
}

export interface TrainingListItem extends TrainingSession {
  tcName: string;
  actionCount: number;
}

export interface TrainingInput {
  date: string;
  province: string;
  district: string;
  sector: string;
  topic: string;
  format: string;
  approach: string;
  outcome: string;
  attendeeAgentIds: string[];
  followUpTitle?: string;
  followUpDescription?: string;
  followUpDueDate?: string;
}

export async function getTrainings(
  query: TrainingQuery = {},
  viewer?: SessionUser | null,
): Promise<Paginated<TrainingListItem>> {
  const store = readDemoStore();
  let items = scopeByTc(store.trainings, viewer).map((item) => ({
    ...item,
    tcName: userName(item.tcUserId),
    actionCount: store.actionItems.filter(
      (action) =>
        action.sourceType === "training" && action.sourceId === item.id,
    ).length,
  }));

  if (query.topic) items = items.filter((item) => item.topic === query.topic);
  if (query.tcUserId) {
    items = items.filter((item) => item.tcUserId === query.tcUserId);
  }
  if (query.search) {
    items = items.filter((item) =>
      matchesSearch(
        `${item.topic} ${item.format} ${item.geo.district} ${item.outcome} ${item.tcName}`,
        query.search,
      ),
    );
  }

  items.sort((a, b) => b.date.localeCompare(a.date));
  return delay(paginate(items, query));
}

export async function getTrainingDetail(
  id: string,
  viewer?: SessionUser | null,
) {
  const store = readDemoStore();
  const item = store.trainings.find((entry) => entry.id === id);
  if (!item) return delay(null);
  if (
    viewer?.role === "TERRITORY_COORDINATOR" &&
    item.tcUserId !== viewer.userId
  ) {
    return delay(null);
  }

  const attendees = store.agents.filter((agent) =>
    item.attendeeAgentIds.includes(agent.id),
  );
  const actions = store.actionItems.filter(
    (action) => action.sourceType === "training" && action.sourceId === item.id,
  );

  return delay({
    ...item,
    tcName: userName(item.tcUserId),
    attendees,
    actions: actions.map((action) => ({
      ...action,
      ownerName: userName(action.ownerUserId),
      sourceHref: sourceHref(action.sourceType, action.sourceId),
    })),
  });
}

export async function createTraining(
  input: TrainingInput,
  actor: SessionUser,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!canCreateActivities(actor)) {
    return delay({ ok: false, error: "Not authorized to record training." });
  }
  if (
    !input.date ||
    !input.topic ||
    !input.approach.trim() ||
    !input.outcome.trim()
  ) {
    return delay({ ok: false, error: "Complete all required fields." });
  }
  if (input.attendeeAgentIds.length === 0) {
    return delay({ ok: false, error: "Select at least one attendee agent." });
  }

  const id = `train-${Date.now()}`;
  const tcUserId = actor.userId;
  const now = new Date().toISOString();

  updateDemoStore((state) => {
    const created: TrainingSession = {
      id,
      tcUserId,
      date: input.date,
      geo: {
        province: input.province,
        district: input.district,
        sector: input.sector,
      },
      topic: input.topic,
      format: input.format,
      agentsTrained: input.attendeeAgentIds.length,
      approach: input.approach.trim(),
      outcome: input.outcome.trim(),
      attendeeAgentIds: [...input.attendeeAgentIds],
    };

    let actionItems = state.actionItems;
    if (input.followUpTitle?.trim()) {
      const district = state.territories.find(
        (item) =>
          item.type === "district" && item.name === input.district,
      );
      actionItems = [
        {
          id: `action-${Date.now()}`,
          title: input.followUpTitle.trim(),
          description:
            input.followUpDescription?.trim() ||
            `Follow-up from training: ${input.topic}.`,
          sourceType: "training",
          sourceId: id,
          ownerUserId: tcUserId,
          priority: "medium",
          dueDate:
            input.followUpDueDate ||
            new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          status: "open",
          territoryId: district?.id,
        },
        ...actionItems,
      ];
    }

    return {
      ...state,
      trainings: [created, ...state.trainings],
      actionItems,
      auditLogs: [
        {
          id: `audit-${Date.now()}`,
          actorUserId: actor.userId,
          action: "training.create",
          objectType: "training",
          objectId: id,
          timestamp: now,
          summary: `Training recorded: ${created.topic} (${created.agentsTrained} agents).`,
        },
        ...state.auditLogs,
      ],
    };
  });

  return delay({ ok: true, id });
}

/* ---------------- Meetings ---------------- */

export interface MeetingQuery extends ListQuery {
  search?: string;
  meetingType?: string;
  tcUserId?: string;
}

export interface MeetingListItem extends Meeting {
  tcName: string;
  actionCount: number;
}

export interface MeetingInput {
  date: string;
  location: string;
  meetingType: Meeting["meetingType"];
  participantCount: number;
  agenda: string;
  decisions: string;
  followUpTitle?: string;
  followUpDescription?: string;
  followUpDueDate?: string;
}

export async function getMeetings(
  query: MeetingQuery = {},
  viewer?: SessionUser | null,
): Promise<Paginated<MeetingListItem>> {
  const store = readDemoStore();
  let items = scopeByTc(store.meetings, viewer).map((item) => ({
    ...item,
    tcName: userName(item.tcUserId),
    actionCount: store.actionItems.filter(
      (action) =>
        action.sourceType === "meeting" && action.sourceId === item.id,
    ).length,
  }));

  if (query.meetingType) {
    items = items.filter((item) => item.meetingType === query.meetingType);
  }
  if (query.tcUserId) {
    items = items.filter((item) => item.tcUserId === query.tcUserId);
  }
  if (query.search) {
    items = items.filter((item) =>
      matchesSearch(
        `${item.location} ${item.meetingType} ${item.agenda} ${item.decisions} ${item.tcName}`,
        query.search,
      ),
    );
  }

  items.sort((a, b) => b.date.localeCompare(a.date));
  return delay(paginate(items, query));
}

export async function getMeetingDetail(
  id: string,
  viewer?: SessionUser | null,
) {
  const store = readDemoStore();
  const item = store.meetings.find((entry) => entry.id === id);
  if (!item) return delay(null);
  if (
    viewer?.role === "TERRITORY_COORDINATOR" &&
    item.tcUserId !== viewer.userId
  ) {
    return delay(null);
  }
  const actions = store.actionItems.filter(
    (action) => action.sourceType === "meeting" && action.sourceId === item.id,
  );
  return delay({
    ...item,
    tcName: userName(item.tcUserId),
    actions: actions.map((action) => ({
      ...action,
      ownerName: userName(action.ownerUserId),
      sourceHref: sourceHref(action.sourceType, action.sourceId),
    })),
  });
}

export async function createMeeting(
  input: MeetingInput,
  actor: SessionUser,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!canCreateActivities(actor)) {
    return delay({ ok: false, error: "Not authorized to record meetings." });
  }
  if (
    !input.date ||
    !input.location.trim() ||
    !input.agenda.trim() ||
    !input.decisions.trim()
  ) {
    return delay({ ok: false, error: "Complete all required fields." });
  }

  const id = `meet-${Date.now()}`;
  const tcUserId = actor.userId;
  const now = new Date().toISOString();

  updateDemoStore((state) => {
    const created: Meeting = {
      id,
      tcUserId,
      date: input.date,
      location: input.location.trim(),
      meetingType: input.meetingType,
      participantCount: Math.max(1, input.participantCount),
      agenda: input.agenda.trim(),
      decisions: input.decisions.trim(),
    };

    let actionItems = state.actionItems;
    if (input.followUpTitle?.trim()) {
      actionItems = [
        {
          id: `action-${Date.now()}`,
          title: input.followUpTitle.trim(),
          description:
            input.followUpDescription?.trim() ||
            `Follow-up from ${input.meetingType} meeting.`,
          sourceType: "meeting",
          sourceId: id,
          ownerUserId: tcUserId,
          priority: "medium",
          dueDate:
            input.followUpDueDate ||
            new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          status: "open",
        },
        ...actionItems,
      ];
    }

    return {
      ...state,
      meetings: [created, ...state.meetings],
      actionItems,
      auditLogs: [
        {
          id: `audit-${Date.now()}`,
          actorUserId: actor.userId,
          action: "meeting.create",
          objectType: "meeting",
          objectId: id,
          timestamp: now,
          summary: `Meeting recorded: ${created.meetingType} at ${created.location}.`,
        },
        ...state.auditLogs,
      ],
    };
  });

  return delay({ ok: true, id });
}

/* ---------------- Action items ---------------- */

export interface ActionQuery extends ListQuery {
  search?: string;
  status?: string;
  priority?: string;
  sourceType?: string;
  ownerUserId?: string;
}

export interface ActionListItem extends ActionItem {
  ownerName: string;
  sourceHref: string;
  sourceLabel: string;
  territoryName?: string;
}

function sourceLabel(sourceType: ActionItem["sourceType"], sourceId: string) {
  return `${sourceType} · ${sourceId}`;
}

export async function getActionItems(
  query: ActionQuery = {},
  viewer?: SessionUser | null,
): Promise<Paginated<ActionListItem>> {
  const store = readDemoStore();
  let items = store.actionItems;

  if (viewer?.role === "TERRITORY_COORDINATOR") {
    items = items.filter((item) => item.ownerUserId === viewer.userId);
  }

  let enriched: ActionListItem[] = items.map((item) => ({
    ...item,
    ownerName: userName(item.ownerUserId),
    sourceHref: sourceHref(item.sourceType, item.sourceId),
    sourceLabel: sourceLabel(item.sourceType, item.sourceId),
    territoryName: item.territoryId
      ? store.territories.find((territory) => territory.id === item.territoryId)
          ?.name
      : undefined,
  }));

  if (query.status) {
    enriched = enriched.filter((item) => item.status === query.status);
  }
  if (query.priority) {
    enriched = enriched.filter((item) => item.priority === query.priority);
  }
  if (query.sourceType) {
    enriched = enriched.filter((item) => item.sourceType === query.sourceType);
  }
  if (query.ownerUserId) {
    enriched = enriched.filter((item) => item.ownerUserId === query.ownerUserId);
  }
  if (query.search) {
    enriched = enriched.filter((item) =>
      matchesSearch(
        `${item.title} ${item.description} ${item.ownerName} ${item.sourceLabel}`,
        query.search,
      ),
    );
  }

  enriched.sort((a, b) => {
    const rank = (status: ActionItem["status"]) => {
      if (status === "open") return 0;
      if (status === "in_progress") return 1;
      return 2;
    };
    const byStatus = rank(a.status) - rank(b.status);
    if (byStatus !== 0) return byStatus;
    return a.dueDate.localeCompare(b.dueDate);
  });

  return delay(paginate(enriched, query));
}

export async function updateActionItemStatus(
  id: string,
  status: ActionItem["status"],
  actor: SessionUser,
  resolutionNotes?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canManageActionItems(actor)) {
    return delay({ ok: false, error: "Not authorized to update action items." });
  }

  const store = readDemoStore();
  const item = store.actionItems.find((entry) => entry.id === id);
  if (!item) return delay({ ok: false, error: "Action item not found." });

  if (
    actor.role === "TERRITORY_COORDINATOR" &&
    item.ownerUserId !== actor.userId
  ) {
    return delay({
      ok: false,
      error: "You can only update your own action items.",
    });
  }

  const now = new Date().toISOString();
  updateDemoStore((state) => ({
    ...state,
    actionItems: state.actionItems.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            status,
            completionDate:
              status === "done"
                ? now.slice(0, 10)
                : entry.completionDate,
            resolutionNotes:
              status === "done"
                ? resolutionNotes?.trim() || entry.resolutionNotes
                : entry.resolutionNotes,
          }
        : entry,
    ),
    auditLogs: [
      {
        id: `audit-${Date.now()}`,
        actorUserId: actor.userId,
        action: "action_item.status",
        objectType: "action_item",
        objectId: id,
        timestamp: now,
        summary: `Action item marked ${status}: ${item.title}.`,
      },
      ...state.auditLogs,
    ],
  }));

  return delay({ ok: true });
}

export async function createActionItem(
  input: {
    title: string;
    description: string;
    sourceType: ActionItem["sourceType"];
    sourceId: string;
    priority: ActionItem["priority"];
    dueDate: string;
    territoryId?: string;
  },
  actor: SessionUser,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!canManageActionItems(actor)) {
    return delay({ ok: false, error: "Not authorized to create action items." });
  }
  if (!input.title.trim() || !input.dueDate) {
    return delay({ ok: false, error: "Title and due date are required." });
  }

  const id = `action-${Date.now()}`;
  const now = new Date().toISOString();
  updateDemoStore((state) => ({
    ...state,
    actionItems: [
      {
        id,
        title: input.title.trim(),
        description: input.description.trim(),
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        ownerUserId: actor.userId,
        priority: input.priority,
        dueDate: input.dueDate,
        status: "open",
        territoryId: input.territoryId,
      },
      ...state.actionItems,
    ],
    auditLogs: [
      {
        id: `audit-${Date.now()}`,
        actorUserId: actor.userId,
        action: "action_item.create",
        objectType: "action_item",
        objectId: id,
        timestamp: now,
        summary: `Action item created: ${input.title.trim()}.`,
      },
      ...state.auditLogs,
    ],
  }));

  return delay({ ok: true, id });
}

export function actionPriorityTone(priority: ActionItem["priority"]) {
  if (priority === "high") return "danger" as const;
  if (priority === "medium") return "warning" as const;
  return "info" as const;
}

export function actionStatusTone(status: ActionItem["status"]) {
  if (status === "done") return "success" as const;
  if (status === "in_progress") return "info" as const;
  return "warning" as const;
}
