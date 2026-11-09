import { apiRequest } from "@/lib/http/client";
import { runMutation, type MutationResult } from "@/lib/http/mutation";
import { toSessionUser, type ApiUser } from "@/lib/auth/session";
import type { SessionUser } from "@/types";

/**
 * Self-service account calls (profile, password, recovery).
 * Auth-free endpoints pass `skipRefresh` so a 401 is never retried.
 */

export interface ProfileInput {
  name: string;
  phone: string;
  workingProvince?: string;
  workingDistrict?: string;
  /** Raw NID to mask; empty string leaves unchanged. */
  nid?: string;
}

/** Update the signed-in user's own profile fields. */
export function updateProfile(
  input: ProfileInput,
): Promise<MutationResult<SessionUser>> {
  return runMutation(async () => {
    const body: Record<string, unknown> = {
      name: input.name.trim(),
      phone: input.phone.trim() || null,
      workingProvince: input.workingProvince?.trim() || null,
      workingDistrict: input.workingDistrict?.trim() || null,
    };
    const nid = input.nid?.trim();
    if (nid) body.nid = nid;

    const data = await apiRequest<{ user: ApiUser }>("/auth/me", {
      method: "PATCH",
      body,
    });
    return toSessionUser(data.user);
  });
}

/** Upload a JPEG/PNG/WebP profile photo (max 2 MB). */
export function uploadAvatar(file: File): Promise<MutationResult<SessionUser>> {
  const body = new FormData();
  body.append("file", file);
  return runMutation(async () => {
    const data = await apiRequest<{ user: ApiUser }>("/auth/me/avatar", {
      method: "POST",
      body,
    });
    return toSessionUser(data.user);
  });
}

export function removeAvatar(): Promise<MutationResult<SessionUser>> {
  return runMutation(async () => {
    const data = await apiRequest<{ user: ApiUser }>("/auth/me/avatar", {
      method: "DELETE",
    });
    return toSessionUser(data.user);
  });
}

/** Change the password; the API keeps this device signed in and revokes the rest. */
export function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<MutationResult<SessionUser>> {
  return runMutation(async () => {
    const data = await apiRequest<{ user: ApiUser }>("/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    });
    return toSessionUser(data.user);
  });
}

/** Ask for a reset link. The API answers the same way whether or not the email exists. */
export function requestPasswordReset(
  email: string,
): Promise<MutationResult<{ ok: true }>> {
  return runMutation(() =>
    apiRequest<{ ok: true }>("/auth/forgot-password", {
      method: "POST",
      body: { email: email.trim() },
      skipRefresh: true,
    }),
  );
}

/** Set a new password using the token from the emailed link. */
export function resetPassword(
  token: string,
  password: string,
): Promise<MutationResult<{ ok: true }>> {
  return runMutation(() =>
    apiRequest<{ ok: true }>("/auth/reset-password", {
      method: "POST",
      body: { token, password },
      skipRefresh: true,
    }),
  );
}
