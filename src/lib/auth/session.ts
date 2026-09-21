import { DEMO_USERS } from "@data/index";
import type { SessionUser, User } from "@/types";
import { appendAuditLog } from "@/lib/store/demo-store";

const SESSION_KEY = "samu.auth.session";

export function getSeedUsers(): User[] {
  return DEMO_USERS;
}

export function findSeedUserByIdentifier(identifier: string): User | undefined {
  const normalized = identifier.trim().toLowerCase();
  return DEMO_USERS.find(
    (user) =>
      user.email.toLowerCase() === normalized ||
      user.phone.replace(/\s/g, "") === identifier.trim().replace(/\s/g, ""),
  );
}

export function toSessionUser(user: User): SessionUser {
  return {
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roleLabel: user.roleLabel,
    territoryIds: user.territoryIds,
    agentId: user.agentId,
    avatarInitials: user.avatarInitials,
    loggedInAt: new Date().toISOString(),
  };
}

export function readSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function writeSession(session: SessionUser) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function loginWithCredentials(
  identifier: string,
  password: string,
): { ok: true; session: SessionUser } | { ok: false; error: string } {
  const user = findSeedUserByIdentifier(identifier);
  if (!user || !user.active || user.password !== password) {
    return {
      ok: false,
      error: "Invalid email/phone or password. Use a seeded demo account.",
    };
  }

  const session = toSessionUser(user);
  writeSession(session);
  appendAuditLog({
    actorUserId: user.id,
    action: "user.login",
    objectType: "user",
    objectId: user.id,
    summary: `${user.name} signed in.`,
  });
  return { ok: true, session };
}

export function logoutCurrentUser() {
  const session = readSession();
  if (session) {
    appendAuditLog({
      actorUserId: session.userId,
      action: "user.logout",
      objectType: "user",
      objectId: session.userId,
      summary: `${session.name} signed out.`,
    });
  }
  clearSession();
}

export function homePathForRole(role: SessionUser["role"]): string {
  if (role === "AGENT") return "/agent";
  return "/dashboard";
}
