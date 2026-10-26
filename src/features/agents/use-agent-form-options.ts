import { getAgentFilterOptions } from "@/lib/api";
import { useAuth } from "@/lib/auth/auth-context";
import { useAsyncData } from "@/lib/hooks/use-async-data";

/**
 * Province / district / coordinator choices for the agent create & edit forms.
 * Shares the same endpoint as the directory filters.
 */
export function useAgentFormOptions() {
  const { user } = useAuth();
  return useAsyncData(
    () => getAgentFilterOptions(),
    `agent-form-options:${user?.userId}`,
    { enabled: Boolean(user) },
  );
}
