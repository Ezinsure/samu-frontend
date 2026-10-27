"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateProfile } from "@/lib/auth/account";
import { useAuth } from "@/lib/auth/auth-context";
import type { SessionUser } from "@/types";

/** Editable name/phone plus read-only identity facts (email and role are admin-managed). */
export function ProfileForm({ user }: { user: SessionUser }) {
  const { refresh } = useAuth();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [saving, setSaving] = useState(false);

  const changed = name.trim() !== user.name || phone.trim() !== user.phone;
  const valid = name.trim().length >= 2 && (phone.trim() === "" || phone.trim().length >= 7);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const result = await updateProfile({ name, phone });
    if (!result.ok) {
      setSaving(false);
      toast.error("Could not update profile", { description: result.error });
      return;
    }
    await refresh(); // pushes the new name into the top bar and session
    setSaving(false);
    toast.success("Profile updated");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Your email and role are managed by an administrator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <FormField label="Full name" htmlFor="profile-name">
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              required
            />
          </FormField>
          <FormField label="Phone" htmlFor="profile-phone">
            <Input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2507…"
            />
          </FormField>
          <FormField label="Email" htmlFor="profile-email">
            <Input id="profile-email" value={user.email} disabled readOnly />
          </FormField>
          <FormField label="Role">
            <div className="flex h-9 items-center">
              <StatusBadge label={user.roleLabel} tone="info" />
            </div>
          </FormField>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={!changed || !valid || saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
