import type { FieldActivity, FieldActivityType, ListQuery, ServiceLine } from "@/types";
import { createResourceClient } from "./resource";

export interface ActivityQuery extends ListQuery {
  serviceLine?: ServiceLine;
  activityType?: FieldActivityType;
  tcUserId?: string;
}

export type ActivityListItem = FieldActivity & { tcName: string };

export interface ActivityInput {
  serviceLine: ServiceLine;
  activityType: FieldActivityType;
  /** `YYYY-MM-DD` */
  date: string;
  geo: FieldActivity["geo"];
  venue: string;
  peopleReached: number;
  summary: string;
  outcome: string;
  leadId?: string;
  agentId?: string;
  /** Required for Admin / Ops; the API forces the TC's own id for coordinators. */
  tcUserId?: string;
}

const activities = createResourceClient<
  ActivityListItem,
  ActivityInput,
  ActivityQuery
>("/field-activities", "activity");

export const getFieldActivities = activities.list;
export const getFieldActivityById = activities.getById;
export const createFieldActivity = activities.create;
export const updateFieldActivity = activities.update;
