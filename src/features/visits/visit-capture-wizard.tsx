"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import {
  DEFAULT_AGENT_SERVICES,
  canCaptureVisits,
  createVisit,
  getAgents,
  getVisitFilterOptions,
} from "@/lib/api";
import { useUserData } from "@/lib/hooks/use-user-data";
import { distanceMeters, evaluateGpsValidation } from "@/lib/visits/gps";
import { cn } from "@/lib/utils";
import { AgentStep } from "./capture/agent-step";
import { ChecklistStep } from "./capture/checklist-step";
import { EvidenceStep } from "./capture/evidence-step";
import { GpsStep } from "./capture/gps-step";
import { ReviewStep } from "./capture/review-step";
import {
  CAPTURE_STEPS,
  INITIAL_VISIT_DRAFT,
  type VisitDraft,
} from "./capture/types";
import { useGpsCapture } from "./capture/use-gps-capture";

/** Idempotency key so a double tap / retry cannot create duplicate visits. */
function newIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function VisitCaptureWizard() {
  const { user } = useAuth();
  const router = useRouter();
  const canCapture = canCaptureVisits(user);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<VisitDraft>(INITIAL_VISIT_DRAFT);
  const [startedAt] = useState(() => new Date().toISOString());
  const [idempotencyKey] = useState(newIdempotencyKey);
  const [submitting, setSubmitting] = useState(false);
  const gps = useGpsCapture();

  const agents = useUserData(
    () => getAgents({ page: 1, pageSize: 100, status: "Active" }),
    "visit-capture-agents",
  );
  const options = useUserData(() => getVisitFilterOptions(), "visit-options");
  const threshold = options.data?.gpsThresholdMeters ?? 10;

  const selectedAgent =
    agents.data?.data.find((agent) => agent.id === draft.agentId) ?? null;
  // Until edited, the checklist starts from the agent's current services.
  const checklist =
    draft.checklist ?? selectedAgent?.services ?? DEFAULT_AGENT_SERVICES;

  const distance = useMemo(
    () =>
      selectedAgent && gps.location
        ? distanceMeters(gps.location, selectedAgent.registeredLocation)
        : null,
    [selectedAgent, gps.location],
  );
  const gpsValidation =
    distance != null ? evaluateGpsValidation(distance, threshold).validation : null;

  function change(patch: Partial<VisitDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function canProceed() {
    if (step === 0) return Boolean(draft.agentId && draft.purpose);
    if (step === 1) return gps.location !== null && distance !== null;
    if (step === 2) {
      return !(checklist.internetAvailable && !checklist.internetType?.trim());
    }
    if (step === 3) {
      return Boolean(
        draft.activities.trim() && draft.outcome.trim() && draft.photos.length > 0,
      );
    }
    return true;
  }

  async function handleSubmit() {
    if (!selectedAgent || !gps.location) return;
    setSubmitting(true);
    const result = await createVisit(
      {
        agentId: selectedAgent.id,
        purpose: draft.purpose,
        startedAt,
        endedAt: new Date().toISOString(),
        location: gps.location,
        activities: draft.activities.trim(),
        outcome: draft.outcome.trim(),
        challenges: draft.challenges.trim(),
        supportNeeded: draft.supportNeeded.trim(),
        checklist,
        photos: draft.photos.map((photo) => photo.upload),
        deviceInfo: navigator.userAgent.slice(0, 120),
        serviceLines: draft.serviceLines,
      },
      idempotencyKey,
    );
    setSubmitting(false);

    if (!result.ok) {
      toast.error("Could not submit visit", { description: result.error });
      return;
    }
    toast.success("Visit submitted", {
      description:
        result.data.validation === "flagged"
          ? "GPS flagged for review. Agent confirmation SMS queued."
          : "GPS accepted. Agent confirmation SMS queued.",
    });
    router.push(`/visits/${result.data.id}`);
  }

  if (!canCapture) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Capture visit"
          description="Only territory coordinators and admins can capture field visits."
        />
        <Button asChild variant="secondary">
          <Link href="/visits">Back to visits</Link>
        </Button>
      </div>
    );
  }

  if (agents.error) {
    return (
      <ErrorState
        title="Could not load your agents"
        description={agents.error}
        onRetry={agents.reload}
      />
    );
  }

  const lastStep = CAPTURE_STEPS.length - 1;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Capture visit"
        description="Step through agent selection, GPS validation, readiness checklist, and photo evidence."
      />

      <div className="flex flex-wrap gap-2">
        {CAPTURE_STEPS.map((label, index) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
              index === step
                ? "border-primary-600 bg-primary-50 text-primary-800 dark:bg-primary-900/40 dark:text-primary-100"
                : index < step
                  ? "border-success/40 bg-success/10 text-foreground"
                  : "border-border text-foreground-secondary",
            )}
          >
            <span className="tabular-nums">{index + 1}</span>
            {label}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{CAPTURE_STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 ? (
            <AgentStep
              draft={draft}
              onChange={change}
              agents={agents.data?.data ?? []}
              selectedAgent={selectedAgent}
              startedAt={startedAt}
            />
          ) : null}
          {step === 1 ? (
            <GpsStep
              gps={gps}
              agent={selectedAgent}
              thresholdMeters={threshold}
              distance={distance}
              validation={gpsValidation}
            />
          ) : null}
          {step === 2 ? (
            <ChecklistStep
              checklist={checklist}
              onChange={(next) => change({ checklist: next })}
            />
          ) : null}
          {step === 3 ? <EvidenceStep draft={draft} onChange={change} /> : null}
          {step === 4 ? (
            <ReviewStep
              agentName={selectedAgent?.name ?? "—"}
              purpose={draft.purpose}
              distance={distance}
              validation={gpsValidation}
              photoCount={draft.photos.length}
              activities={draft.activities}
              outcome={draft.outcome}
              thresholdMeters={threshold}
            />
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={step === 0 || submitting}
          onClick={() => setStep((value) => Math.max(0, value - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        {step < lastStep ? (
          <Button
            type="button"
            disabled={!canProceed()}
            onClick={() => setStep((value) => Math.min(lastStep, value + 1))}
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            disabled={!canProceed() || submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? "Submitting…" : "Submit visit"}
          </Button>
        )}
      </div>
    </div>
  );
}
