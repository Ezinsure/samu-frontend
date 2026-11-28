"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { OptionSelect } from "@/components/shared/option-select";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  removeAvatar,
  updateProfile,
  uploadAvatar,
} from "@/lib/auth/account";
import { useAuth } from "@/lib/auth/auth-context";
import {
  districtsForProvince,
  normalizeProvinceName,
  RWANDA_PROVINCE_LIST,
} from "@/lib/geo/rwanda-locations";
import {
  isValidNid,
  isValidRwandaMobile,
  normalizeNidDigits,
  normalizeRwandaMobile,
  nidInputProps,
  rwandaPhoneInputProps,
} from "@/lib/validation/fields";
import type { SessionUser } from "@/types";

const GEO_NONE = "__none__";

/** Editable profile + avatar upload; email and role stay admin-managed. */
export function ProfileForm({ user }: { user: SessionUser }) {
  const { refresh } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [workingProvince, setWorkingProvince] = useState(
    user.workingProvince
      ? normalizeProvinceName(user.workingProvince)
      : "",
  );
  const [workingDistrict, setWorkingDistrict] = useState(
    user.workingDistrict ?? "",
  );
  const districtOptions = workingProvince
    ? districtsForProvince(workingProvince)
    : [];
  const [nid, setNid] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const changed =
    name.trim() !== user.name ||
    phone.trim() !== user.phone ||
    workingProvince.trim() !== (user.workingProvince ?? "") ||
    workingDistrict.trim() !== (user.workingDistrict ?? "") ||
    nid.trim().length > 0;

  const valid =
    name.trim().length >= 2 &&
    (phone.trim() === "" || isValidRwandaMobile(phone)) &&
    (workingProvince.trim() === "" || workingProvince.trim().length >= 2) &&
    (workingDistrict.trim() === "" || workingDistrict.trim().length >= 2) &&
    (nid.trim() === "" || isValidNid(nid, { exact16: true }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (phone.trim() && !isValidRwandaMobile(phone)) {
      toast.error("Phone must be a Rwandan mobile number starting with 07");
      return;
    }
    if (nid.trim() && !isValidNid(nid, { exact16: true })) {
      toast.error("National ID must be exactly 16 digits");
      return;
    }
    setSaving(true);
    const result = await updateProfile({
      name,
      phone: phone.trim() ? normalizeRwandaMobile(phone) : "",
      workingProvince,
      workingDistrict,
      nid: nid.trim() ? normalizeNidDigits(nid) : undefined,
    });
    if (!result.ok) {
      setSaving(false);
      toast.error("Could not update profile", { description: result.error });
      return;
    }
    setNid("");
    await refresh();
    setSaving(false);
    toast.success("Profile updated");
  }

  async function onAvatarSelected(file: File | undefined) {
    if (!file) return;
    setAvatarBusy(true);
    const result = await uploadAvatar(file);
    setAvatarBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!result.ok) {
      toast.error("Could not upload photo", { description: result.error });
      return;
    }
    await refresh();
    toast.success("Profile photo updated");
  }

  async function onRemoveAvatar() {
    setAvatarBusy(true);
    const result = await removeAvatar();
    setAvatarBusy(false);
    if (!result.ok) {
      toast.error("Could not remove photo", { description: result.error });
      return;
    }
    await refresh();
    toast.success("Profile photo removed");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Your email and role are managed by an administrator.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <UserAvatar
            name={user.name}
            avatarUrl={user.avatarUrl}
            avatarInitials={user.avatarInitials}
            className="h-16 w-16 text-base"
            previewable
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">Profile photo</p>
            <p className="text-xs text-foreground-muted">
              JPEG, PNG, or WebP · max 2 MB
              {user.avatarUrl ? " · click photo to enlarge" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => void onAvatarSelected(e.target.files?.[0])}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={avatarBusy}
                onClick={() => fileRef.current?.click()}
              >
                {avatarBusy ? "Working…" : "Upload photo"}
              </Button>
              {user.avatarUrl ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={avatarBusy}
                  onClick={() => void onRemoveAvatar()}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        </div>

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
              {...rwandaPhoneInputProps()}
            />
          </FormField>
          <FormField label="Working province" htmlFor="profile-province">
            <OptionSelect
              value={workingProvince || GEO_NONE}
              onChange={(province) => {
                if (province === GEO_NONE) {
                  setWorkingProvince("");
                  setWorkingDistrict("");
                  return;
                }
                setWorkingProvince(province);
                const nextDistricts = districtsForProvince(province);
                setWorkingDistrict((current) =>
                  nextDistricts.includes(current)
                    ? current
                    : (nextDistricts[0] ?? ""),
                );
              }}
              options={[
                { value: GEO_NONE, label: "Not set" },
                ...RWANDA_PROVINCE_LIST.map((p) => ({ value: p, label: p })),
              ]}
            />
          </FormField>
          <FormField label="Working district" htmlFor="profile-district">
            <OptionSelect
              value={workingDistrict || GEO_NONE}
              onChange={(district) =>
                setWorkingDistrict(district === GEO_NONE ? "" : district)
              }
              options={[
                { value: GEO_NONE, label: "Not set" },
                ...Array.from(
                  new Set([workingDistrict, ...districtOptions].filter(Boolean)),
                ).map((d) => ({ value: d, label: d })),
              ]}
            />
          </FormField>
          <FormField label="National ID" htmlFor="profile-nid">
            <Input
              id="profile-nid"
              value={nid}
              onChange={(e) => setNid(normalizeNidDigits(e.target.value))}
              placeholder="16 digits"
              {...nidInputProps()}
            />
            <p className="text-xs text-foreground-muted">
              {user.nidMasked
                ? `On file: ${user.nidMasked}. Enter a new number only to replace it.`
                : "Optional. Exactly 16 digits, stored masked."}
            </p>
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
