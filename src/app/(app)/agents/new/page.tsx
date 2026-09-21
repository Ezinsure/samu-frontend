"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentForm } from "@/features/agents/agent-form";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canManageAgents,
  createAgent,
  getAgentFilterOptions,
  type AgentInput,
} from "@/lib/api";

export default function NewAgentPage() {
  const { user } = useAuth();
  const router = useRouter();
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
    if (!user) return;
    setSubmitting(true);
    try {
      const created = await createAgent(input, user.userId);
      toast.success("Agent created", {
        description: `${created.name} is now in the directory.`,
      });
      router.push(`/agents/${created.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New agent"
        description="Create an agent record. Changes persist in the demo store."
        actions={
          <Button asChild variant="secondary">
            <Link href="/agents">Cancel</Link>
          </Button>
        }
      />
      {!options ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <AgentForm
          coordinators={options.coordinators}
          provinces={options.provinces}
          districts={options.districts}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/agents")}
        />
      )}
    </div>
  );
}
