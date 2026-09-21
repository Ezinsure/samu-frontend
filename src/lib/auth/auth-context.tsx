"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { SessionUser } from "@/types";
import {
  clearSession,
  homePathForRole,
  loginWithCredentials,
  logoutCurrentUser,
  readSession,
} from "@/lib/auth/session";

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  login: (
    identifier: string,
    password: string,
  ) => { ok: true; session: SessionUser } | { ok: false; error: string };
  logout: () => void;
  refresh: () => void;
  homePath: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setUser(readSession());
  }, []);

  useEffect(() => {
    refresh();
    setIsLoading(false);
  }, [refresh]);

  const login = useCallback((identifier: string, password: string) => {
    const result = loginWithCredentials(identifier, password);
    if (result.ok) setUser(result.session);
    return result;
  }, []);

  const logout = useCallback(() => {
    logoutCurrentUser();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login,
      logout,
      refresh,
      homePath: user ? homePathForRole(user.role) : "/login",
    }),
    [user, isLoading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}

/** Clears any stale session helper export for tests/tools. */
export function forceClearAuthSession() {
  clearSession();
}
