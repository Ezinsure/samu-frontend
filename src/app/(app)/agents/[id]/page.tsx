"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentDetailView } from "@/features/agents/agent-detail-view";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageAgents, getAgentDetail } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks/use-async-data";

export default function AgentDetailPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const { data: detail, loading, error, reload } = useAsyncData(
    () => getAgentDetail(params.id),
    `agent:${user?.userId}:${params.id}`,
    { enabled: Boolean(user) },
  );

  if (error) {
    return (
      <ErrorState
        title="Could not load this agent"
        description={error}
        onRetry={reload}
      />
    );
  }

  if (loading) {
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
    />
  );
}
