"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";

export default function AgentPortalPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent portal"
        description="Coming soon — agents will confirm Territory Coordinator visits within a 10m radius."
      />
      <Card>
        <CardHeader>
          <CardTitle>Signed in as</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground-secondary">
          {user?.name} ({user?.email}). Visit confirmation and proximity checks
          will ship in a later phase.
        </CardContent>
      </Card>
      <EmptyState
        title="Confirmation workflow not enabled yet"
        description="Later, agents will receive a confirmation request after a TC visit and must approve it while within 10 meters of the registered location."
      />
    </div>
  );
}
