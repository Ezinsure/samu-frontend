"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { OptionSelect } from "@/components/shared/option-select";
import { PasswordInput } from "@/components/shared/password-input";
import { PasswordStrength } from "@/components/shared/password-strength";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getAgents } from "@/lib/api/agents";
import {
  USER_ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
  createUser,
  updateUser,
  type InviteStatus,
  type ManagedUser,
  type UserStatus,
} from "@/lib/api/users";
import { useAuth } from "@/lib/auth/auth-context";
import { isPasswordStrong } from "@/lib/auth/password-rules";
import { useUserData } from "@/lib/hooks/use-user-data";
import {
  isValidNid,
  isValidRwandaMobile,
  normalizeNidDigits,
  normalizeRwandaMobile,
  nidInputProps,
  rwandaPhoneInputProps,
} from "@/lib/validation/fields";
import type { AppRole } from "@/types";

/** Radix Select cannot hold `""`, so "no agent" uses this sentinel. */
const NO_AGENT = "none";

interface FormState {
  name: string;
  email: string;
  phone: string;
  role: AppRole;
  status: UserStatus;
  agentId: string;
  password: string;
  workingProvince: string;
  workingDistrict: string;
  nid: string;
}

function initialState(user: ManagedUser | null): FormState {
  return {
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    role: user?.role ?? "TERRITORY_COORDINATOR",
    status: user?.status ?? "active",
    agentId: user?.agentId ?? "",
    password: "",
    workingProvince: user?.workingProvince ?? "",
    workingDistrict: user?.workingDistrict ?? "",
    nid: "",
  };
}

/** Toast that tells the admin what happened to the invite email. */
function announceCreated(name: string, invite: InviteStatus) {
  if (invite === "sent") {
    toast.success(`${name} created`, {
      description: "A link to set their password was emailed to them.",
    });
  } else if (invite === "not_configured") {
    toast.warning(`${name} created, but no email was sent`, {
      description:
        "Email is not configured on the server. Use “Set password” to give them access.",
    });
  } else if (invite === "failed") {
    toast.warning(`${name} created, but the invite email failed`, {
      description: "Use “Send reset link” to retry, or set a password manually.",
    });
  } else {
    toast.success(`${name} created`);
  }
}

/** Agent picker shown for AGENT users; the API rejects agents that already have a login. */
function AgentLinkField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const agents = useUserData(() => getAgents({ pageSize: 100 }), "user-form-agents");
  const options = [
    { value: NO_AGENT, label: "Not linked" },
    ...(agents.data?.data ?? []).map((agent) => ({
      value: agent.id,
      label: `${agent.name} (${agent.code})`,
    })),
  ];

  return (
    <FormField label="Linked agent" htmlFor="user-agent" className="sm:col-span-2">
      <OptionSelect
        id="user-agent"
        value={value || NO_AGENT}
        onChange={(next) => onChange(next === NO_AGENT ? "" : next)}
        options={options}
        placeholder={agents.loading ? "Loading agents…" : "Select agent"}
      />
    </FormField>
  );
}

interface UserFormBodyProps {
  user: ManagedUser | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Form body — mounted only while the dialog is open so it always starts fresh. */
function UserFormBody({ user, onClose, onSaved }: UserFormBodyProps) {
  const { user: me } = useAuth();
  const isEdit = user !== null;
  const isSelf = isEdit && user.id === me?.userId;

  const [form, setForm] = useState(() => initialState(user));
  const [saving, setSaving] = useState(false);
  const patch = (changes: Partial<FormState>) =>
    setForm((current) => ({ ...current, ...changes }));

  const valid =
    form.name.trim().length >= 2 &&
    form.email.includes("@") &&
    (form.phone.trim() === "" || isValidRwandaMobile(form.phone)) &&
    (form.workingProvince.trim() === "" || form.workingProvince.trim().length >= 2) &&
    (form.workingDistrict.trim() === "" || form.workingDistrict.trim().length >= 2) &&
    (form.nid.trim() === "" || isValidNid(form.nid, { exact16: true })) &&
    (isEdit || form.password === "" || isPasswordStrong(form.password));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (form.phone.trim() && !isValidRwandaMobile(form.phone)) {
      toast.error("Phone must be a Rwandan mobile number starting with 07");
      return;
    }
    if (form.nid.trim() && !isValidNid(form.nid, { exact16: true })) {
      toast.error("National ID must be exactly 16 digits");
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone.trim() ? normalizeRwandaMobile(form.phone) : "",
      role: form.role,
      status: form.status,
      agentId: form.agentId,
      password: form.password,
      workingProvince: form.workingProvince,
      workingDistrict: form.workingDistrict,
      nid: form.nid.trim() ? normalizeNidDigits(form.nid) : undefined,
    };

    setSaving(true);

    if (isEdit) {
      const result = await updateUser(user.id, payload);
      setSaving(false);
      if (!result.ok) {
        toast.error("Could not save changes", { description: result.error });
        return;
      }
      toast.success("User updated");
    } else {
      const result = await createUser(payload);
      setSaving(false);
      if (!result.ok) {
        toast.error("Could not create user", { description: result.error });
        return;
      }
      announceCreated(result.data.user.name, result.data.invite);
    }

    onSaved();
    onClose();
  }

  return (
    <form onSubmit={submit}>
      {isEdit ? (
        <div className="mb-5 flex items-center gap-4">
          <UserAvatar
            name={user.name}
            avatarUrl={user.avatarUrl}
            avatarInitials={user.avatarInitials}
            className="h-16 w-16 text-base"
            previewable
          />
          <div className="min-w-0">
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-xs text-foreground-secondary">{user.email}</p>
            {user.avatarUrl ? (
              <p className="mt-1 text-xs text-foreground-muted">
                Click the photo to enlarge
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="user-name">
          <Input
            id="user-name"
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Email" htmlFor="user-email">
          <Input
            id="user-email"
            type="email"
            value={form.email}
            onChange={(e) => patch({ email: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Phone" htmlFor="user-phone">
          <Input
            id="user-phone"
            value={form.phone}
            onChange={(e) => patch({ phone: e.target.value })}
            {...rwandaPhoneInputProps()}
          />
        </FormField>
        <FormField label="Role" htmlFor="user-role">
          <OptionSelect
            id="user-role"
            value={form.role}
            onChange={(role) => patch({ role: role as AppRole })}
            options={USER_ROLE_OPTIONS}
            disabled={isSelf}
          />
        </FormField>
        <FormField label="Working province" htmlFor="user-province">
          <Input
            id="user-province"
            value={form.workingProvince}
            onChange={(e) => patch({ workingProvince: e.target.value })}
            placeholder="e.g. Kigali City"
          />
        </FormField>
        <FormField label="Working district" htmlFor="user-district">
          <Input
            id="user-district"
            value={form.workingDistrict}
            onChange={(e) => patch({ workingDistrict: e.target.value })}
            placeholder="e.g. Gasabo"
          />
        </FormField>
        <FormField label="National ID" htmlFor="user-nid" className="sm:col-span-2">
          <Input
            id="user-nid"
            value={form.nid}
            onChange={(e) => patch({ nid: normalizeNidDigits(e.target.value) })}
            placeholder="16 digits"
            {...nidInputProps()}
          />
          <p className="text-xs text-foreground-muted">
            {isEdit && user.nidMasked
              ? `On file: ${user.nidMasked}. Enter a new number only to replace it.`
              : "Optional. Exactly 16 digits, stored masked."}
          </p>
        </FormField>
        {isEdit ? (
          <FormField label="Status" htmlFor="user-status">
            <OptionSelect
              id="user-status"
              value={form.status}
              onChange={(status) => patch({ status: status as UserStatus })}
              options={USER_STATUS_OPTIONS}
              disabled={isSelf}
            />
          </FormField>
        ) : null}
        {form.role === "AGENT" ? (
          <AgentLinkField
            value={form.agentId}
            onChange={(agentId) => patch({ agentId })}
          />
        ) : null}
        {!isEdit ? (
          <FormField label="Password (optional)" htmlFor="user-password" className="sm:col-span-2">
            <PasswordInput
              id="user-password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => patch({ password: e.target.value })}
            />
            {form.password ? (
              <PasswordStrength password={form.password} className="pt-1" />
            ) : (
              <p className="text-xs text-foreground-secondary">
                Leave blank to email the user a link to set their own password.
              </p>
            )}
          </FormField>
        ) : null}
      </div>
      {isSelf ? (
        <p className="mt-3 text-xs text-foreground-secondary">
          You cannot change your own role or status.
        </p>
      ) : null}
      <DialogFooter className="mt-6">
        <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={!valid || saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create user"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface UserFormDialogProps extends UserFormBodyProps {
  open: boolean;
}

/** Create (`user = null`) or edit dialog. */
export function UserFormDialog({ open, user, onClose, onSaved }: UserFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{user ? `Edit ${user.name}` : "New user"}</DialogTitle>
          <DialogDescription>
            {user
              ? "Update contact details, work location, role or status."
              : "Create a sign-in for a coordinator, COA, or agent."}
          </DialogDescription>
        </DialogHeader>
        {open ? <UserFormBody user={user} onClose={onClose} onSaved={onSaved} /> : null}
      </DialogContent>
    </Dialog>
  );
}
