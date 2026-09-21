"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentForm } from "@/features/agents/agent-form";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canManageAgents,
  getAgentById,
  getAgentFilterOptions,
  updateAgent,
  type AgentInput,
} from "@/lib/api";
import type { Agent } from "@/types";

export default function EditAgentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [options, setOptions] = useState<{
    provinces: string[];
    districts: string[];
    coordinators: Array<{ id: string; name: string }>;
  } | null>(null);

  useEffect(() => {
    void getAgentFilterOptions(user).then((result) =>
      setOptions({
        provinces: result.provinces,
        districts: result.districts,
        coordinators: result.coordinators,
      }),
    );
  }, [user]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getAgentById(params.id, user).then((result) => {
      if (!active) return;
      setAgent(result);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [params.id, user]);

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

  if (loading) {
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
        description="This agent is not available in your scope."
        action={
          <Button asChild>
            <Link href="/agents">Back to agents</Link>
          </Button>
        }
      />
    );
  }

  async function handleSubmit(input: AgentInput) {
    if (!user || !agent) return;
    setSubmitting(true);
    try {
      const updated = await updateAgent(agent.id, input, user.userId);
      if (!updated) {
        toast.error("Update failed");
        return;
      }
      toast.success("Agent updated", {
        description: `${updated.name} saved to the demo store.`,
      });
      router.push(`/agents/${updated.id}`);
    } finally {
      setSubmitting(false);
    }
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
      {!options ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <AgentForm
          initial={agent}
          coordinators={options.coordinators}
          provinces={options.provinces}
          districts={options.districts}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/agents/${agent.id}`)}
        />
      )}
    </div>
  );
}
