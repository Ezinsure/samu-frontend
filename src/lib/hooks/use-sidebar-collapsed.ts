import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "samu.sidebar.collapsed";
const CHANGE_EVENT = "samu:sidebar-collapsed";

function subscribe(onChange: () => void) {
  // `storage` covers other tabs; the custom event covers this tab.
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const getSnapshot = () => window.localStorage.getItem(STORAGE_KEY) === "true";
// The server (and first hydration pass) always renders expanded.
const getServerSnapshot = () => false;

/** Sidebar collapsed flag persisted in localStorage and shared across tabs. */
export function useSidebarCollapsed(): [boolean, (next: boolean) => void] {
  const collapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setCollapsed = useCallback((next: boolean) => {
    window.localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [collapsed, setCollapsed];
}
