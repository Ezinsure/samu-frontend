"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentDetailView } from "@/features/agents/agent-detail-view";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageAgents, getAgentDetail, type AgentDetail } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import type { Agent } from "@/types";

export default function AgentDetailPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const { data, loading, error, reload } = useAsyncData(
    () => getAgentDetail(params.id),
    `agent:${user?.userId}:${params.id}`,
    { enabled: Boolean(user) },
  );
  const [detail, setDetail] = useState<AgentDetail | null>(null);

  useEffect(() => {
    if (data) setDetail(data);
  }, [data]);

  function handleAgentUpdated(agent: Agent) {
    setDetail((current) => (current ? { ...current, agent } : current));
  }

  if (error) {
    return (
      <ErrorState
        title="Could not load this agent"
        description={error}
        onRetry={reload}
      />
    );
  }

  if ((loading && !detail) || (!detail && !error)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!detail) {
    return (
      <EmptyState
        title="Agent not found"
        description="This agent does not exist or is outside your assigned territory."
        action={
          <Button asChild>
            <Link href="/agents">Back to agents</Link>
          </Button>
        }
      />
    );
  }

  return (
    <AgentDetailView
      detail={detail}
      canManage={canManageAgents(user)}
      viewer={user}
      onAgentUpdated={handleAgentUpdated}
    />
  );
}
