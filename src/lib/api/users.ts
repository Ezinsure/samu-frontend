import { apiRequest } from "@/lib/http/client";
import { apiRequestList } from "@/lib/http/list";
import { runMutation, type MutationResult } from "@/lib/http/mutation";
import { roleLabelFor } from "@/lib/auth/session";
import type { FilterOption } from "@/components/shared/filter-select";
import type { AppRole, ListQuery, Paginated, SessionUser } from "@/types";

export type UserStatus = "active" | "pending" | "disabled";

/** User row as returned by the admin `/users` API. */
export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: AppRole;
  status: UserStatus;
  avatarInitials: string | null;
  agentId: string | null;
  agentName: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserQuery extends ListQuery {
  role?: AppRole;
  status?: UserStatus;
}

export interface UserCreateInput {
  name: string;
  email: string;
  phone: string;
  role: AppRole;
  /** Portal link, only meaningful for AGENT users. */
  agentId: string;
  /** Blank = email the user a set-password link. */
  password: string;
}

export interface UserUpdateInput {
  name: string;
  email: string;
  phone: string;
  role: AppRole;
  status: UserStatus;
  agentId: string;
}

/** What happened to the invite email after creating a user. */
export type InviteStatus = "none" | "sent" | "not_configured" | "failed";

export const USER_ROLES: AppRole[] = [
  "ADMIN",
  "OPERATIONS_MANAGER",
  "MD_VIEWER",
  "TERRITORY_COORDINATOR",
  "AGENT",
];

export const USER_ROLE_OPTIONS: FilterOption[] = USER_ROLES.map((role) => ({
  value: role,
  label: roleLabelFor(role),
}));

export const USER_STATUS_OPTIONS: FilterOption[] = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending approval" },
  { value: "disabled", label: "Deactivated" },
];

export function userStatusLabel(status: UserStatus) {
  return USER_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export function userStatusTone(status: UserStatus) {
  if (status === "active") return "success" as const;
  if (status === "pending") return "warning" as const;
  return "inactive" as const;
}

/** UI hint only — the API restricts user management to ADMIN. */
export function canManageUsers(viewer?: SessionUser | null) {
  return viewer?.role === "ADMIN";
}

const userPath = (id: string) => `/users/${encodeURIComponent(id)}`;

export function getUsers(query: UserQuery = {}): Promise<Paginated<ManagedUser>> {
  return apiRequestList<ManagedUser>("/users", { query: { ...query } });
}

/** Create an account; `invite` says whether the set-password email went out. */
export function createUser(
  input: UserCreateInput,
): Promise<MutationResult<{ user: ManagedUser; invite: InviteStatus }>> {
  return runMutation(() =>
    apiRequest("/users", {
      method: "POST",
      body: {
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone.trim() || null,
        role: input.role,
        agentId: input.role === "AGENT" && input.agentId ? input.agentId : null,
        // Omitted (not blank) so the API sends an invite instead.
        password: input.password || undefined,
      },
    }),
  );
}

export function updateUser(
  id: string,
  input: UserUpdateInput,
): Promise<MutationResult<{ user: ManagedUser }>> {
  return runMutation(() =>
    apiRequest(userPath(id), {
      method: "PATCH",
      body: {
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone.trim() || null,
        role: input.role,
        status: input.status,
        agentId: input.role === "AGENT" && input.agentId ? input.agentId : null,
      },
    }),
  );
}

/** Deactivate (`disabled`) or reactivate (`active`) without touching other fields. */
export function setUserStatus(
  id: string,
  status: UserStatus,
): Promise<MutationResult<{ user: ManagedUser }>> {
  return runMutation(() =>
    apiRequest(userPath(id), { method: "PATCH", body: { status } }),
  );
}

export function setUserPassword(
  id: string,
  password: string,
): Promise<MutationResult<{ ok: true }>> {
  return runMutation(() =>
    apiRequest(`${userPath(id)}/password`, { method: "POST", body: { password } }),
  );
}

/** `delivered` is false when no email provider is configured on the server. */
export function sendUserResetLink(
  id: string,
): Promise<MutationResult<{ delivered: boolean }>> {
  return runMutation(() =>
    apiRequest(`${userPath(id)}/reset-link`, { method: "POST" }),
  );
}

export function deleteUser(id: string): Promise<MutationResult<{ ok: true }>> {
  return runMutation(() => apiRequest(userPath(id), { method: "DELETE" }));
}
