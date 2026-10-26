"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentForm } from "@/features/agents/agent-form";
import { useAgentFormOptions } from "@/features/agents/use-agent-form-options";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canManageAgents,
  getAgentById,
  updateAgent,
  type AgentInput,
} from "@/lib/api";
import { useAsyncData } from "@/lib/hooks/use-async-data";

export default function EditAgentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [submitting, setSubmitting] = useState(false);
  const options = useAgentFormOptions();
  const agentState = useAsyncData(
    () => getAgentById(params.id),
    `agent-edit:${user?.userId}:${params.id}`,
    { enabled: Boolean(user) },
  );
  const agent = agentState.data;

  if (!canManageAgents(user)) {
    return (
      <PermissionDenied
        action={
          <Button asChild>
            <Link href="/agents">Back to agents</Link>
          </Button>
        }
      />
    );
  }

  const loadError = agentState.error ?? options.error;
  if (loadError) {
    return (
      <ErrorState
        title="Could not load this agent"
        description={loadError}
        onRetry={() => {
          agentState.reload();
          options.reload();
        }}
      />
    );
  }

  if (agentState.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!agent) {
    return (
      <EmptyState
        title="Agent not found"
        description="This agent does not exist or is outside your scope."
        action={
          <Button asChild>
            <Link href="/agents">Back to agents</Link>
          </Button>
        }
      />
    );
  }

  async function handleSubmit(input: AgentInput) {
    if (!agent) return;
    setSubmitting(true);
    const result = await updateAgent(agent.id, input);
    setSubmitting(false);

    if (!result.ok) {
      toast.error("Could not update agent", { description: result.error });
      return;
    }
    toast.success("Agent updated", {
      description: `${result.agent.name} was saved.`,
    });
    router.push(`/agents/${result.agent.id}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${agent.name}`}
        description={agent.code}
        actions={
          <Button asChild variant="secondary">
            <Link href={`/agents/${agent.id}`}>Cancel</Link>
          </Button>
        }
      />
      {!options.data ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <AgentForm
          initial={agent}
          coordinators={options.data.coordinators}
          provinces={options.data.provinces}
          districts={options.data.districts}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/agents/${agent.id}`)}
        />
      )}
    </div>
  );
}
