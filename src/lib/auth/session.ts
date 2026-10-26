import type { AppRole, SessionUser } from "@/types";
import { ApiError, apiRequest, getErrorMessage } from "@/lib/http/client";

/** Shape returned by `/auth/*` endpoints (see backend `PublicUser`). */
interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  status: string;
  phone: string | null;
  avatarInitials: string | null;
  agentId: string | null;
  lastLoginAt: string | null;
}

const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: "Administrator",
  OPERATIONS_MANAGER: "Operations Manager",
  MD_VIEWER: "MD Viewer",
  TERRITORY_COORDINATOR: "Territory Coordinator",
  AGENT: "Agent",
};

export function roleLabelFor(role: AppRole): string {
  return ROLE_LABELS[role] ?? role;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function toSessionUser(user: ApiUser): SessionUser {
  return {
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    roleLabel: roleLabelFor(user.role),
    // Scoping is enforced server-side; the client no longer needs territory ids.
    territoryIds: [],
    agentId: user.agentId ?? undefined,
    avatarInitials: user.avatarInitials ?? initialsFromName(user.name),
    loggedInAt: user.lastLoginAt ?? new Date().toISOString(),
  };
}

export function homePathForRole(role: AppRole): string {
  if (role === "AGENT") return "/agent";
  return "/dashboard";
}

/** Current session from the httpOnly cookie, or `null` when signed out. */
export async function fetchSession(): Promise<SessionUser | null> {
  try {
    const data = await apiRequest<{ user: ApiUser }>("/auth/me");
    return toSessionUser(data.user);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<{ ok: true; session: SessionUser } | { ok: false; error: string }> {
  try {
    const data = await apiRequest<{ user: ApiUser }>("/auth/login", {
      method: "POST",
      body: { email: email.trim(), password },
      skipRefresh: true,
    });
    return { ok: true, session: toSessionUser(data.user) };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function logoutCurrentUser(): Promise<void> {
  try {
    await apiRequest("/auth/logout", { method: "POST", skipRefresh: true });
  } catch {
    // Cookies may already be gone — the UI still signs the user out locally.
  }
}

export interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export async function registerAccount(
  input: RegisterInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await apiRequest("/auth/register", {
      method: "POST",
      body: {
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone?.trim() || undefined,
        password: input.password,
      },
      skipRefresh: true,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}
