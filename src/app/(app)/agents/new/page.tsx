"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentForm } from "@/features/agents/agent-form";
import { useAgentFormOptions } from "@/features/agents/use-agent-form-options";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageAgents, createAgent, type AgentInput } from "@/lib/api";

export default function NewAgentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const options = useAgentFormOptions();

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

  async function handleSubmit(input: AgentInput) {
    setSubmitting(true);
    const result = await createAgent(input);
    setSubmitting(false);

    if (!result.ok) {
      toast.error("Could not create agent", { description: result.error });
      return;
    }
    toast.success("Agent created", {
      description: `${result.agent.name} is now in the directory.`,
    });
    router.push(`/agents/${result.agent.id}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New agent"
        description="Register a local agent and assign a territory coordinator."
        actions={
          <Button asChild variant="secondary">
            <Link href="/agents">Cancel</Link>
          </Button>
        }
      />
      {options.error ? (
        <ErrorState
          title="Could not load form options"
          description={options.error}
          onRetry={options.reload}
        />
      ) : !options.data ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <AgentForm
          coordinators={options.data.coordinators}
          provinces={options.data.provinces}
          districts={options.data.districts}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/agents")}
        />
      )}
    </div>
  );
}
