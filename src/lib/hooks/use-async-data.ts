"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/http/client";

interface SettledResult<T> {
  /** Identity of the request this result belongs to. */
  requestKey: object;
  data: T | null;
  error: string | null;
}

export interface AsyncDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-run the loader with the same key (e.g. after a mutation). */
  reload: () => void;
}

/**
 * Loads async data (typically an API call) whenever `key` changes.
 *
 * - `key` identifies the request (e.g. `${userId}:${territoryId}`); change it
 *   to refetch. Keep it a primitive so React can compare it cheaply.
 * - `loading` is derived by comparing request identities, so no setState runs
 *   synchronously inside the effect and stale responses are never shown.
 * - Pass `enabled: false` to skip loading until a prerequisite is ready.
 */
export function useAsyncData<T>(
  loader: () => Promise<T>,
  key: string,
  options: { enabled?: boolean } = {},
): AsyncDataState<T> {
  const enabled = options.enabled ?? true;
  const [reloadCount, setReloadCount] = useState(0);
  const [settled, setSettled] = useState<SettledResult<T> | null>(null);

  // A fresh object per (key, reload, enabled) change identifies the request.
  const requestKey = useMemo(
    () => ({}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, reloadCount, enabled],
  );

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    loader()
      .then((data) => {
        if (active) setSettled({ requestKey, data, error: null });
      })
      .catch((error: unknown) => {
        if (active) {
          setSettled({ requestKey, data: null, error: getErrorMessage(error) });
        }
      });
    return () => {
      active = false;
    };
    // `loader` is intentionally excluded: it is recreated each render and only
    // matters for the render in which `requestKey` changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  if (!enabled) return { data: null, loading: false, error: null, reload };

  const isCurrent = settled?.requestKey === requestKey;
  return {
    data: isCurrent ? settled.data : null,
    loading: !isCurrent,
    error: isCurrent ? settled.error : null,
    reload,
  };
}
