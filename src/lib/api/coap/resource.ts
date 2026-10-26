import { apiRequest } from "@/lib/http/client";
import { apiRequestList } from "@/lib/http/list";
import {
  apiRequestOrNull,
  runMutation,
  stripBlankValues,
  type MutationResult,
} from "@/lib/http/mutation";
import type { ListQuery, Paginated, SessionUser } from "@/types";

/** UI hint only — the API enforces the real permission. */
export function canManageCoap(viewer?: SessionUser | null) {
  return (
    viewer?.role === "ADMIN" ||
    viewer?.role === "OPERATIONS_MANAGER" ||
    viewer?.role === "TERRITORY_COORDINATOR"
  );
}

/**
 * Typed REST client for one COAP resource (`/leads`, `/sales`, ...).
 *
 * Single-record responses are wrapped as `{ data: { <envelopeKey>: record } }`,
 * so `envelopeKey` names the wrapper (e.g. `"lead"`).
 */
export function createResourceClient<
  TItem,
  TInput extends object,
  TQuery extends ListQuery,
>(basePath: string, envelopeKey: string) {
  type Envelope = Record<string, TItem>;
  const recordPath = (id: string) => `${basePath}/${encodeURIComponent(id)}`;

  return {
    list: (query: TQuery = {} as TQuery): Promise<Paginated<TItem>> =>
      // Query objects only hold primitives; `Object.fromEntries` sidesteps the
      // missing index signature on the query interfaces.
      apiRequestList<TItem>(basePath, {
        query: Object.fromEntries(Object.entries(query)),
      }),

    /** `null` when missing or outside the viewer's scope. */
    getById: async (id: string): Promise<TItem | null> => {
      const data = await apiRequestOrNull<Envelope>(recordPath(id));
      return data?.[envelopeKey] ?? null;
    },

    create: (input: TInput): Promise<MutationResult<TItem>> =>
      runMutation(async () => {
        const data = await apiRequest<Envelope>(basePath, {
          method: "POST",
          body: stripBlankValues(input),
        });
        return data[envelopeKey];
      }),

    update: (id: string, input: TInput): Promise<MutationResult<TItem>> =>
      runMutation(async () => {
        const data = await apiRequest<Envelope>(recordPath(id), {
          method: "PATCH",
          body: stripBlankValues(input),
        });
        return data[envelopeKey];
      }),
  };
}
