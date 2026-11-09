"use client";

import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ChangePasswordForm } from "@/features/profile/change-password-form";
import { ProfileForm } from "@/features/profile/profile-form";
import { useAuth } from "@/lib/auth/auth-context";

export default function ProfilePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const forcePassword =
    user?.mustChangePassword || searchParams.get("changePassword") === "1";

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your photo, contact details, and password. Changing your password signs you out on other devices."
      />
      {forcePassword ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Temporary password in use</p>
          <p className="mt-1 text-amber-900/90">
            Please set a new password below before continuing to use SAMU.
          </p>
        </div>
      ) : null}
      {/* Keyed so the form re-initialises when the stored profile changes. */}
      <ProfileForm
        key={`${user.userId}:${user.name}:${user.phone}:${user.avatarUrl ?? ""}:${user.workingDistrict ?? ""}:${user.nidMasked ?? ""}`}
        user={user}
      />
      <div id="change-password">
        <ChangePasswordForm required={Boolean(user.mustChangePassword)} />
      </div>
    </div>
  );
}
