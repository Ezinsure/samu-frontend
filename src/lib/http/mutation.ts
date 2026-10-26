import { ApiError, apiRequest, getErrorMessage, type RequestOptions } from "@/lib/http/client";

/** Outcome of a create/update call — pages branch on `ok` instead of try/catch. */
export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Runs an API call and converts thrown errors into a `MutationResult`. */
export async function runMutation<T>(
  action: () => Promise<T>,
): Promise<MutationResult<T>> {
  try {
    return { ok: true, data: await action() };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

/**
 * GET that resolves to `null` when the record is missing (404) or outside the
 * viewer's scope (403), so detail pages can render a "not found" state.
 */
export async function apiRequestOrNull<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T | null> {
  try {
    return await apiRequest<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && [403, 404].includes(error.status)) {
      return null;
    }
    throw error;
  }
}

/**
 * The API rejects empty optional strings (e.g. `leadId: ""`), so blank
 * top-level values from form state are dropped before sending.
 */
export function stripBlankValues<T extends object>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).filter(
      ([, value]) => value !== "" && value !== undefined,
    ),
  ) as T;
}
