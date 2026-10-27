import { useSyncExternalStore } from "react";

/** Subscription that never fires: the snapshot is static per environment. */
const subscribeNoop = () => () => {};

/**
 * `false` during SSR and hydration, `true` in the browser afterwards.
 * Use it to gate client-only values (theme, localStorage) without
 * a hydration mismatch or a set-state-in-effect.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}
