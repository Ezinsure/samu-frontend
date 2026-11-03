"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pipelineAction } from "@/lib/api/agents";
import type { Agent, SessionUser } from "@/types";

export function AgentPipelineActions({
  agent,
  viewer,
}: {
  agent: Agent;
  viewer?: SessionUser | null;
}) {
  const router = useRouter();
  const canAct =
    viewer?.role === "ADMIN" || viewer?.role === "TERRITORY_COORDINATOR";
  const [examScore, setExamScore] = useState(String(agent.examScore ?? ""));
  const [busy, setBusy] = useState(false);

  if (!canAct || agent.status === "Certified") {
    return agent.examScore != null ? (
      <p className="text-sm text-foreground-muted">
        Exam score: {agent.examScore}%
        {agent.iremboAccountCreatedAt
          ? ` · Irembo account noted ${new Date(agent.iremboAccountCreatedAt).toLocaleDateString()}`
          : ""}
      </p>
    ) : null;
  }

  async function run(
    action: "start_training" | "record_exam" | "certify",
    extra?: { examScore?: number; iremboAccountCreated?: boolean },
  ) {
    setBusy(true);
    const result = await pipelineAction(agent.id, { action, ...extra });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Pipeline updated");
    router.refresh();
    // result shape is MutationResult<{ agent: Agent }>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pipeline actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        {agent.status === "Candidate" ? (
          <Button
            type="button"
            disabled={busy}
            onClick={() => void run("start_training")}
          >
            Start training
          </Button>
        ) : null}
        <div className="flex items-end gap-2">
          <Input
            className="w-24"
            type="number"
            min={0}
            max={100}
            placeholder="Score %"
            value={examScore}
            onChange={(e) => setExamScore(e.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() =>
              void run("record_exam", { examScore: Number(examScore) })
            }
          >
            Record exam
          </Button>
        </div>
        <Button
          type="button"
          disabled={busy}
          onClick={() =>
            void run("certify", {
              examScore: Number(examScore) || agent.examScore,
              iremboAccountCreated: true,
            })
          }
        >
          Certify as Irembo agent (≥80%)
        </Button>
      </CardContent>
    </Card>
  );
}
