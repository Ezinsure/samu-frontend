"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Account details from the current demo session."
      />
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-foreground-secondary">Full name</p>
            <p className="text-sm font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-secondary">Role</p>
            <div className="mt-1">
              <StatusBadge label={user.roleLabel} tone="info" />
            </div>
          </div>
          <div>
            <p className="text-xs text-foreground-secondary">Email</p>
            <p className="text-sm font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-secondary">Phone</p>
            <p className="text-sm font-medium">{user.phone}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-secondary">Session started</p>
            <p className="text-sm font-medium">
              {new Date(user.loggedInAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-foreground-secondary">Territories</p>
            <p className="text-sm font-medium">
              {user.territoryIds.length > 0
                ? user.territoryIds.join(", ")
                : "National / unscoped"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
