import { useCallback, useMemo, useState } from "react";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

/** Every filter value is a string; `"all"` conventionally means "no filter". */
type FilterValues = { search: string } & Record<string, string>;

/**
 * Filter + pagination state for server-side list pages.
 *
 * - Changing any filter returns to page 1 (done in the setter, not an effect).
 * - Search is debounced; `applied` holds the values to send to the API and
 *   `key` is a stable string for `useAsyncData`.
 */
export function useListFilters<F extends FilterValues>(initial: F) {
  const [state, setState] = useState<F & { page: number }>({
    ...initial,
    page: 1,
  });
  const search = useDebouncedValue(state.search);

  const setFilters = useCallback((patch: Partial<F>) => {
    setState((current) => ({ ...current, ...patch, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setState((current) => ({ ...current, page }));
  }, []);

  const applied = useMemo(() => ({ ...state, search }), [state, search]);

  return {
    /** Live values for controlled inputs. */
    filters: state,
    /** Debounced values to send to the API. */
    applied,
    key: JSON.stringify(applied),
    setFilters,
    setPage,
  };
}

/** Maps the `"all"` sentinel to `undefined` so it is omitted from the query. */
export function filterValue<T extends string = string>(
  value: string,
): T | undefined {
  return value === "all" ? undefined : (value as T);
}
