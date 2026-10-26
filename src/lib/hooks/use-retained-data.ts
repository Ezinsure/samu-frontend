import { useState } from "react";

/**
 * Returns `data`, or the last non-null value while a reload is in flight.
 * Lets filter bars keep their options (and selected labels) instead of
 * flashing a skeleton every time a filter changes.
 *
 * Uses the "adjust state while rendering" pattern, so no effect is needed.
 */
export function useRetainedData<T>(data: T | null): T | null {
  const [retained, setRetained] = useState<T | null>(data);
  if (data !== null && data !== retained) setRetained(data);
  return data ?? retained;
}
