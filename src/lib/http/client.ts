/**
 * Thin fetch wrapper for the SAMU API.
 * - Sends httpOnly auth cookies (`credentials: "include"`).
 * - Unwraps `{ data }` envelopes and normalises `{ error }` into `ApiError`.
 * - On 401 it tries one silent `/auth/refresh` (single-flight) and retries once.
 */

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
).replace(/\/+$/, "");

const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
  /** Skip the silent refresh+retry on 401 (used by auth endpoints). */
  skipRefresh?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${API_BASE_URL}${API_PREFIX}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function parseError(response: Response): Promise<ApiError> {
  let code = "HTTP_ERROR";
  let message = `Request failed (${response.status})`;
  let details: unknown;
  try {
    const payload = (await response.json()) as {
      error?: { code?: string; message?: string; details?: unknown };
    };
    if (payload.error) {
      code = payload.error.code ?? code;
      message = payload.error.message ?? message;
      details = payload.error.details;
    }
  } catch {
    // Non-JSON error body — keep defaults.
  }
  return new ApiError(response.status, code, message, details);
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const hasBody = options.body !== undefined && !(options.body instanceof FormData);
  const init: RequestInit = {
    method: options.method ?? "GET",
    credentials: "include",
    signal: options.signal,
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body:
      options.body instanceof FormData
        ? options.body
        : hasBody
          ? JSON.stringify(options.body)
          : undefined,
  };
  return fetch(buildUrl(path, options.query), init);
}

/** Returns the unwrapped `data` field of the response envelope. */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  let response = await send(path, options);

  if (response.status === 401 && !options.skipRefresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      response = await send(path, options);
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) return undefined as T;

  const payload = (await response.json()) as { data: T };
  return payload.data;
}

/** Returns the full envelope — use for paginated lists (`{ data, meta }`). */
export async function apiRequestEnvelope<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  let response = await send(path, options);

  if (response.status === 401 && !options.skipRefresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      response = await send(path, options);
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
}
