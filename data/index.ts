/**
 * Dummy datasets for the SAMU UI demo.
 *
 * Rules:
 * - Feature pages and components MUST NOT import from this folder directly.
 * - Only `src/lib/api/*` adapters may read/write these modules.
 * - Later: replace adapter internals with real HTTP calls and remove this folder.
 */

export const DATA_LAYER_VERSION = "0.3.0-coap";

export { DEMO_USERS, DEMO_ACCOUNT_PICKS } from "./users";
export { TERRITORIES } from "./geography";
export { AGENTS } from "./agents";
export {
  VISITS,
  SENSITIZATIONS,
  TRAININGS,
  MEETINGS,
  ACTION_ITEMS,
  MONTHLY_REPORTS,
  FRAUD_FLAGS,
  AUDIT_LOGS,
  SCORECARDS,
} from "./operations";
export {
  LEADS,
  FIELD_ACTIVITIES,
  ONBOARDING_CASES,
  SALE_RECORDS,
  COMMUNITY_FEEDBACK,
} from "./coap";
export { DEFAULT_SETTINGS } from "./settings";
