"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useAsyncData } from "@/lib/hooks/use-async-data";

/**
 * `useAsyncData` for role-scoped API calls: waits for the session and
 * refetches when a different user signs in (the key includes their id).
 */
export function useUserData<T>(loader: () => Promise<T>, key: string) {
  const { user } = useAuth();
  return useAsyncData(loader, `${user?.userId ?? "anon"}:${key}`, {
    enabled: Boolean(user),
  });
}
