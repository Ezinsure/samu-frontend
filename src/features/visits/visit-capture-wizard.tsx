"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  MapPin,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/auth-context";
import {
  DEFAULT_AGENT_SERVICES,
  INTERNET_TYPES,
  VISIT_PURPOSES,
  canCaptureVisits,
  createVisit,
  distanceMeters,
  evaluateGpsValidation,
  getAgents,
  getGpsThreshold,
  simulateFarAgentLocation,
  simulateNearAgentLocation,
  validationLabel,
  validationTone,
} from "@/lib/api";
import type {
  Agent,
  AgentServices,
  Coordinates,
  ServiceLine,
  VisitPurpose,
} from "@/types";
import { SERVICE_LINES } from "@/lib/coap/catalog";
import { cn } from "@/lib/utils";

const STEPS = [
  "Agent",
  "GPS",
  "Checklist",
  "Evidence",
  "Review",
] as const;

type GpsStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "denied"
  | "unavailable"
  | "simulated";

function ChecklistField({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-border px-3 py-2.5">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}

export function VisitCaptureWizard() {
  const { user } = useAuth();
  const router = useRouter();
  const canCapture = canCaptureVisits(user);

  const [step, setStep] = useState(0);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [threshold, setThreshold] = useState(10);
  const [agentId, setAgentId] = useState("");
  const [purpose, setPurpose] = useState<VisitPurpose>("Ezinsure Support");
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [startedAt] = useState(() => new Date().toISOString());
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [gpsError, setGpsError] = useState<string>();
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [checklist, setChecklist] = useState<AgentServices>({
    ...DEFAULT_AGENT_SERVICES,
  });
  const [activities, setActivities] = useState("");
  const [outcome, setOutcome] = useState("");
  const [challenges, setChallenges] = useState("");
  const [supportNeeded, setSupportNeeded] = useState("");
  const [photos, setPhotos] = useState<
    Array<{ id: string; name: string; dataUrl?: string }>
  >([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    void getAgents({ page: 1, pageSize: 100, status: "Active" }).then(
      (result) => setAgents(result.data),
    );
    void getGpsThreshold().then(setThreshold);
  }, [user]);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === agentId) ?? null,
    [agents, agentId],
  );

  useEffect(() => {
    if (selectedAgent) {
      setChecklist({ ...selectedAgent.services });
    }
  }, [selectedAgent]);

  const distance = useMemo(() => {
    if (!selectedAgent || !location) return null;
    return distanceMeters(location, selectedAgent.registeredLocation);
  }, [selectedAgent, location]);

  const gpsEval = useMemo(() => {
    if (distance == null) return null;
    return evaluateGpsValidation(distance, threshold);
  }, [distance, threshold]);

  function applyLocation(next: Coordinates, status: GpsStatus) {
    setLocation(next);
    setGpsStatus(status);
    setGpsError(undefined);
  }

  function captureBrowserGps() {
    if (!navigator.geolocation) {
      setGpsStatus("unavailable");
      setGpsError("Geolocation is not available in this browser.");
      return;
    }
    setGpsStatus("requesting");
    setGpsError(undefined);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyLocation(
          {
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
            accuracyMeters: Math.round(position.coords.accuracy),
          },
          "ready",
        );
      },
      (error) => {
        setGpsStatus("denied");
        setGpsError(
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied. Use a demo simulation below."
            : "Unable to read GPS. Use a demo simulation below.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  function handlePhotoChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : undefined;
      setPhotos([
        {
          id: `photo-${Date.now()}`,
          name: file.name,
          dataUrl,
        },
      ]);
    };
    reader.readAsDataURL(file);
  }

  function canProceed() {
    if (step === 0) return Boolean(agentId && purpose);
    if (step === 1) return Boolean(location && distance != null);
    if (step === 2) {
      if (checklist.internetAvailable && !checklist.internetType?.trim()) {
        return false;
      }
      return true;
    }
    if (step === 3) {
      return Boolean(activities.trim() && outcome.trim() && photos.length > 0);
    }
    return true;
  }

  async function handleSubmit() {
    if (!user || !selectedAgent || !location || distance == null) return;
    setSubmitting(true);
    const result = await createVisit(
      {
        agentId: selectedAgent.id,
        purpose,
        startedAt,
        endedAt: new Date().toISOString(),
        location,
        distanceFromRegisteredMeters: distance,
        activities,
        outcome,
        challenges,
        supportNeeded,
        checklist,
        photos,
        deviceInfo:
          typeof navigator !== "undefined"
            ? navigator.userAgent.slice(0, 120)
            : undefined,
        serviceLines,
      },
      user,
    );
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Visit submitted", {
      description:
        result.visit.validation === "flagged"
          ? "GPS flagged for review. Agent confirmation SMS queued."
          : "GPS accepted. Agent confirmation SMS queued.",
    });
    router.push(`/visits/${result.visit.id}`);
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Capture visit"
        description="Step through agent selection, GPS validation, readiness checklist, and photo evidence."
      />

      <div className="flex flex-wrap gap-2">
        {STEPS.map((label, index) => (
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
          <CardTitle>{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="agent">Agent</Label>
                <Select value={agentId} onValueChange={setAgentId}>
                  <SelectTrigger id="agent">
                    <SelectValue placeholder="Select agent to visit" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} · {agent.code} · {agent.geo.district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Visit purpose</Label>
                <Select
                  value={purpose}
                  onValueChange={(value) => setPurpose(value as VisitPurpose)}
                >
                  <SelectTrigger id="purpose">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIT_PURPOSES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>COAP services covered (optional)</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SERVICE_LINES.map((line) => {
                    const checked = serviceLines.includes(line.id);
                    return (
                      <label
                        key={line.id}
                        className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-border px-3 py-2.5"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => {
                            setServiceLines((prev) =>
                              value === true
                                ? [...prev, line.id]
                                : prev.filter((id) => id !== line.id),
                            );
                          }}
                        />
                        <span className="text-sm">{line.shortLabel}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              {selectedAgent ? (
                <div className="rounded-[var(--radius-md)] border border-border bg-background p-3 text-sm">
                  <p className="font-medium">{selectedAgent.name}</p>
                  <p className="text-foreground-secondary">
                    {selectedAgent.geo.province} · {selectedAgent.geo.district} ·{" "}
                    {selectedAgent.geo.sector}
                  </p>
                  <p className="mt-1 text-xs text-foreground-secondary">
                    Registered GPS: {selectedAgent.registeredLocation.lat},{" "}
                    {selectedAgent.registeredLocation.lng}
                  </p>
                </div>
              ) : null}
              <p className="text-xs text-foreground-secondary">
                Visit start captured at {new Date(startedAt).toLocaleString()}{" "}
                (system-generated).
              </p>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={captureBrowserGps}>
                  <Navigation className="h-4 w-4" />
                  Use device GPS
                </Button>
                {selectedAgent ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        applyLocation(
                          simulateNearAgentLocation(
                            selectedAgent.registeredLocation,
                          ),
                          "simulated",
                        )
                      }
                    >
                      <Crosshair className="h-4 w-4" />
                      Simulate near agent
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        applyLocation(
                          simulateFarAgentLocation(
                            selectedAgent.registeredLocation,
                          ),
                          "simulated",
                        )
                      }
                    >
                      <MapPin className="h-4 w-4" />
                      Simulate mismatch
                    </Button>
                  </>
                ) : null}
              </div>

              {gpsStatus === "requesting" ? (
                <p className="text-sm text-foreground-secondary">
                  Requesting location permission…
                </p>
              ) : null}
              {gpsError ? (
                <p className="text-sm text-danger">{gpsError}</p>
              ) : null}

              {location && distance != null && gpsEval ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[var(--radius-md)] border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-foreground-secondary">
                      Current location
                    </p>
                    <p className="mt-1 font-mono text-sm">
                      {location.lat}, {location.lng}
                    </p>
                    <p className="mt-1 text-xs text-foreground-secondary">
                      Accuracy ±{location.accuracyMeters ?? "—"}m · Source:{" "}
                      {gpsStatus === "simulated" ? "Demo simulation" : "Device GPS"}
                    </p>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-foreground-secondary">
                      Distance vs registered
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">
                      {Math.round(distance)}m
                    </p>
                    <div className="mt-2">
                      <StatusBadge
                        label={validationLabel(gpsEval.validation)}
                        tone={validationTone(gpsEval.validation)}
                      />
                    </div>
                    <p className="mt-2 text-xs text-foreground-secondary">
                      Threshold: {threshold}m (Admin setting)
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-foreground-secondary">
                  Capture GPS to compare against the agent&apos;s registered
                  location.
                </p>
              )}
            </>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
                  Agent readiness
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ChecklistField
                    label="Irembo tools"
                    checked={checklist.iremboTools}
                    onCheckedChange={(value) =>
                      setChecklist((prev) => ({ ...prev, iremboTools: value }))
                    }
                  />
                  <ChecklistField
                    label="Insurance tools"
                    checked={checklist.insuranceTools}
                    onCheckedChange={(value) =>
                      setChecklist((prev) => ({
                        ...prev,
                        insuranceTools: value,
                      }))
                    }
                  />
                  <ChecklistField
                    label="Telecom tools"
                    checked={checklist.telecomTools}
                    onCheckedChange={(value) =>
                      setChecklist((prev) => ({ ...prev, telecomTools: value }))
                    }
                  />
                  <ChecklistField
                    label="BK tools"
                    checked={checklist.bkTools}
                    onCheckedChange={(value) =>
                      setChecklist((prev) => ({ ...prev, bkTools: value }))
                    }
                  />
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
                  Equipment & connectivity
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ChecklistField
                    label="Smartphone"
                    checked={checklist.smartphone}
                    onCheckedChange={(value) =>
                      setChecklist((prev) => ({ ...prev, smartphone: value }))
                    }
                  />
                  <ChecklistField
                    label="Printer"
                    checked={checklist.printer}
                    onCheckedChange={(value) =>
                      setChecklist((prev) => ({ ...prev, printer: value }))
                    }
                  />
                  <ChecklistField
                    label="Internet available"
                    checked={checklist.internetAvailable}
                    onCheckedChange={(value) =>
                      setChecklist((prev) => ({
                        ...prev,
                        internetAvailable: value,
                      }))
                    }
                  />
                  <div className="space-y-2">
                    <Label htmlFor="internet-type">Internet type</Label>
                    <Select
                      value={checklist.internetType ?? ""}
                      onValueChange={(value) =>
                        setChecklist((prev) => ({
                          ...prev,
                          internetType: value,
                        }))
                      }
                      disabled={!checklist.internetAvailable}
                    >
                      <SelectTrigger id="internet-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERNET_TYPES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
                  Visibility & commercial
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ChecklistField
                    label="Branding visible"
                    checked={checklist.brandingVisible}
                    onCheckedChange={(value) =>
                      setChecklist((prev) => ({
                        ...prev,
                        brandingVisible: value,
                      }))
                    }
                  />
                  <ChecklistField
                    label="Trained on services"
                    checked={checklist.trainedOnServices}
                    onCheckedChange={(value) =>
                      setChecklist((prev) => ({
                        ...prev,
                        trainedOnServices: value,
                      }))
                    }
                  />
                  <ChecklistField
                    label="Actively selling"
                    checked={checklist.activelySelling}
                    onCheckedChange={(value) =>
                      setChecklist((prev) => ({
                        ...prev,
                        activelySelling: value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="activities">Activities performed</Label>
                <Textarea
                  id="activities"
                  value={activities}
                  onChange={(event) => setActivities(event.target.value)}
                  placeholder="What did you do during the visit?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outcome">Outcome</Label>
                <Textarea
                  id="outcome"
                  value={outcome}
                  onChange={(event) => setOutcome(event.target.value)}
                  placeholder="What changed or was agreed?"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="challenges">Challenges</Label>
                  <Textarea
                    id="challenges"
                    value={challenges}
                    onChange={(event) => setChallenges(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support">Support needed</Label>
                  <Textarea
                    id="support"
                    value={supportNeeded}
                    onChange={(event) => setSupportNeeded(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo">Photo evidence (required)</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) => handlePhotoChange(event.target.files)}
                />
                {photos[0] ? (
                  <div className="overflow-hidden rounded-[var(--radius-md)] border border-border">
                    {photos[0].dataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photos[0].dataUrl}
                        alt="Visit evidence preview"
                        className="max-h-56 w-full object-cover"
                      />
                    ) : null}
                    <div className="flex items-center gap-2 px-3 py-2 text-sm">
                      <Camera className="h-4 w-4 text-primary-600" />
                      <span className="truncate">{photos[0].name}</span>
                      <CheckCircle2 className="ml-auto h-4 w-4 text-success" />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-foreground-secondary">
                    Attach at least one photo from camera or gallery (demo
                    stores a local preview).
                  </p>
                )}
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <div className="space-y-3 text-sm">
              <ReviewRow label="Agent" value={selectedAgent?.name ?? "—"} />
              <ReviewRow label="Purpose" value={purpose} />
              <ReviewRow
                label="GPS distance"
                value={
                  distance != null ? `${Math.round(distance)}m` : "—"
                }
              />
              <ReviewRow
                label="Validation"
                value={
                  gpsEval ? validationLabel(gpsEval.validation) : "—"
                }
              />
              <ReviewRow
                label="Photos"
                value={`${photos.length} attached`}
              />
              <ReviewRow label="Activities" value={activities} />
              <ReviewRow label="Outcome" value={outcome} />
              <p className="rounded-[var(--radius-md)] border border-border bg-background p-3 text-xs text-foreground-secondary">
                Submitting will store the visit, update the agent&apos;s last
                visit and checklist snapshot, queue an SMS confirmation, and
                open a fraud flag if GPS exceeds the {threshold}m threshold.
              </p>
            </div>
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
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            disabled={!canProceed()}
            onClick={() => {
              if (!canProceed()) {
                toast.error("Complete the required fields for this step.");
                return;
              }
              setStep((value) => Math.min(STEPS.length - 1, value + 1));
            }}
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

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border pb-2 last:border-0 sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-foreground-secondary">{label}</span>
      <span className="font-medium sm:text-right">{value}</span>
    </div>
  );
}
