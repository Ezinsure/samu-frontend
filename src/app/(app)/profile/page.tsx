"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ChangePasswordForm } from "@/features/profile/change-password-form";
import { ProfileForm } from "@/features/profile/profile-form";
import { useAuth } from "@/lib/auth/auth-context";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your photo, contact details, and password. Changing your password signs you out on other devices."
      />
      {/* Keyed so the form re-initialises when the stored profile changes. */}
      <ProfileForm
        key={`${user.userId}:${user.name}:${user.phone}:${user.avatarUrl ?? ""}:${user.workingDistrict ?? ""}:${user.nidMasked ?? ""}`}
        user={user}
      />
      <ChangePasswordForm />
    </div>
  );
}
