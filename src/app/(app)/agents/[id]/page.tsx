"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgentById } from "@/lib/api";
import type { Agent } from "@/types";

export default function AgentDetailPreviewPage() {
  const params = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getAgentById(params.id).then((result) => {
      if (!active) return;
      setAgent(result);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!agent) {
    return (
      <EmptyState
        title="Agent not found"
        description="This agent is not in the demo dataset."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />
    );
  }

  const tone =
    agent.compliance === "green"
      ? "success"
      : agent.compliance === "yellow"
        ? "warning"
        : "danger";

  return (
    <div className="space-y-6">
      <PageHeader
        title={agent.name}
        description={`${agent.code} · Full agent profile module arrives in Phase 4.`}
        actions={
          <Button asChild variant="secondary">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Summary</CardTitle>
          <StatusBadge
            label={
              agent.compliance === "green"
                ? "Compliant"
                : agent.compliance === "yellow"
                  ? "Due soon"
                  : "Overdue"
            }
            tone={tone}
          />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-foreground-secondary">District</p>
            <p className="text-sm font-medium">
              {agent.geo.district}, {agent.geo.sector}
            </p>
          </div>
          <div>
            <p className="text-xs text-foreground-secondary">Phone</p>
            <p className="text-sm font-medium">{agent.phone}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-secondary">Status</p>
            <p className="text-sm font-medium">{agent.status}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-secondary">Last visit</p>
            <p className="text-sm font-medium">
              {agent.lastVisitAt
                ? new Date(agent.lastVisitAt).toLocaleString()
                : "Never"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
