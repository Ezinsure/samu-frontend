import { API_BASE_URL, apiRequest } from "@/lib/http/client";
import { apiRequestList } from "@/lib/http/list";
import { runMutation, type MutationResult } from "@/lib/http/mutation";
import { roleLabelFor } from "@/lib/auth/session";
import type { FilterOption } from "@/components/shared/filter-select";
import type { AppRole, ListQuery, Paginated, SessionUser } from "@/types";
import { PRODUCT_USER_ROLES } from "@/types";

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
  avatarUrl?: string | null;
  nidMasked?: string | null;
  workingDistrict?: string | null;
  workingProvince?: string | null;
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
  workingProvince?: string;
  workingDistrict?: string;
  /** Raw NID digits; omit to leave unset. */
  nid?: string;
}

export interface UserUpdateInput {
  name: string;
  email: string;
  phone: string;
  role: AppRole;
  status: UserStatus;
  agentId: string;
  workingProvince?: string;
  workingDistrict?: string;
  /** Raw NID digits to replace; omit to keep existing masked value. */
  nid?: string;
}

/** What happened to the invite email after creating a user. */
export type InviteStatus = "none" | "sent" | "not_configured" | "failed";

/** Creatable / assignable roles in the product UI. */
export const USER_ROLES: AppRole[] = [...PRODUCT_USER_ROLES];

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
        workingProvince: input.workingProvince?.trim() || null,
        workingDistrict: input.workingDistrict?.trim() || null,
        nid: input.nid?.trim() || undefined,
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
        workingProvince: input.workingProvince?.trim() || null,
        workingDistrict: input.workingDistrict?.trim() || null,
        nid: input.nid?.trim() || undefined,
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

export type CoaImportPreviewStatus =
  | "ready"
  | "invalid"
  | "duplicate_in_file"
  | "exists";

export type CoaImportPreviewRow = {
  row: number;
  name: string;
  email: string;
  phone: string;
  nid?: string;
  workingDistrict: string;
  status: CoaImportPreviewStatus;
  reason?: string;
};

export type CoaImportPreview = {
  filename: string;
  total: number;
  ready: number;
  invalid: number;
  duplicates: number;
  exists: number;
  rows: CoaImportPreviewRow[];
};

export type CoaImportRowResult = {
  row: number;
  email: string;
  name?: string;
  phone?: string;
  status: "created" | "skipped";
  invite?: InviteStatus;
  reason?: string;
};

export type CoaImportResult = {
  created: number;
  skipped: number;
  invites: {
    sent: number;
    failed: number;
    not_configured: number;
  };
  rows: CoaImportRowResult[];
};

/** Parse + validate a COA import file without creating accounts. */
export function previewCoaImport(
  file: File,
): Promise<MutationResult<CoaImportPreview>> {
  const body = new FormData();
  body.append("file", file);
  return runMutation(() =>
    apiRequest<CoaImportPreview>("/users/import-coas/preview", {
      method: "POST",
      body,
    }),
  );
}

/** Bulk-create COA accounts; emails branded temporary passwords. */
export function importCoaAccounts(
  file: File,
): Promise<MutationResult<CoaImportResult>> {
  const body = new FormData();
  body.append("file", file);
  return runMutation(() =>
    apiRequest<CoaImportResult>("/users/import-coas", {
      method: "POST",
      body,
    }),
  );
}

export async function downloadCoaImportTemplate(): Promise<void> {
  const url = `${API_BASE_URL}/api/v1/users/coa-import-template.csv`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Template download failed (${res.status})`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = "coa-import-template.csv";
  a.click();
  URL.revokeObjectURL(objectUrl);
}
