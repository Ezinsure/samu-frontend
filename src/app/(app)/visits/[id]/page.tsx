"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import {
  confirmationLabel,
  confirmationTone,
  getVisitDetail,
  validationLabel,
  validationTone,
  type VisitDetail,
} from "@/lib/api";

function ChecklistRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-0">
      <span>{label}</span>
      <StatusBadge
        label={ok ? "Yes" : "No"}
        tone={ok ? "success" : "danger"}
        showIcon={false}
      />
    </div>
  );
}

export default function VisitDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [detail, setDetail] = useState<VisitDetail | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let active = true;
    void getVisitDetail(params.id, user).then((result) => {
      if (!active) return;
      setDetail(result);
    });
    return () => {
      active = false;
    };
  }, [params.id, user]);

  if (detail === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (!detail) {
    return (
      <EmptyState
        title="Visit not found"
        description="This visit does not exist or you do not have access."
        action={
          <Button asChild variant="secondary">
            <Link href="/visits">Back to visits</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="secondary" size="sm">
          <Link href="/visits">
            <ArrowLeft className="h-4 w-4" />
            Visits
          </Link>
        </Button>
      </div>

      <PageHeader
        title={detail.agentName}
        description={`${detail.purpose} · ${format(new Date(detail.startedAt), "dd MMM yyyy HH:mm")} · ${detail.durationMinutes} min`}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              label={validationLabel(detail.validation)}
              tone={validationTone(detail.validation)}
            />
            <StatusBadge
              label={confirmationLabel(detail.confirmationStatus)}
              tone={confirmationTone(detail.confirmationStatus)}
            />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Visit summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-foreground-secondary">Agent</p>
                <Link
                  href={`/agents/${detail.agentId}`}
                  className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                >
                  {detail.agentName} ({detail.agentCode})
                </Link>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Coordinator</p>
                <p className="font-medium">{detail.tcName}</p>
              </div>
              {detail.serviceLines?.length ? (
                <div className="sm:col-span-2">
                  <p className="text-xs text-foreground-secondary">
                    COAP services covered
                  </p>
                  <p className="font-medium">
                    {detail.serviceLines.join(", ")}
                  </p>
                </div>
              ) : null}
              <div>
                <p className="text-xs text-foreground-secondary">Started</p>
                <p className="font-medium">
                  {format(new Date(detail.startedAt), "dd MMM yyyy HH:mm")}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Ended</p>
                <p className="font-medium">
                  {format(new Date(detail.endedAt), "dd MMM yyyy HH:mm")}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-foreground-secondary">Activities</p>
              <p className="mt-1">{detail.activities}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-secondary">Outcome</p>
              <p className="mt-1">{detail.outcome}</p>
            </div>
            {detail.challenges ? (
              <div>
                <p className="text-xs text-foreground-secondary">Challenges</p>
                <p className="mt-1">{detail.challenges}</p>
              </div>
            ) : null}
            {detail.supportNeeded ? (
              <div>
                <p className="text-xs text-foreground-secondary">Support needed</p>
                <p className="mt-1">{detail.supportNeeded}</p>
              </div>
            ) : null}
            {detail.deviceInfo ? (
              <div>
                <p className="text-xs text-foreground-secondary">Device</p>
                <p className="mt-1 break-all text-xs text-foreground-secondary">
                  {detail.deviceInfo}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary-600" />
                GPS validation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-foreground-secondary">Visit location</p>
                <p className="font-mono">
                  {detail.location.lat}, {detail.location.lng}
                </p>
                <p className="text-xs text-foreground-secondary">
                  Accuracy ±{detail.location.accuracyMeters ?? "—"}m
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">
                  Registered agent location
                </p>
                <p className="font-mono">
                  {detail.agent.registeredLocation.lat},{" "}
                  {detail.agent.registeredLocation.lng}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Distance</p>
                <p className="text-xl font-semibold tabular-nums">
                  {detail.distanceFromRegisteredMeters}m
                </p>
                <p className="text-xs text-foreground-secondary">
                  Threshold {detail.gpsThresholdMeters}m
                </p>
              </div>
              {detail.flaggedReason ? (
                <p className="rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
                  {detail.flaggedReason}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary-600" />
                SMS confirmation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <StatusBadge
                label={confirmationLabel(detail.confirmationStatus)}
                tone={confirmationTone(detail.confirmationStatus)}
              />
              <p className="text-xs text-foreground-secondary">
                Agent confirmation is queued after submit. Status updates appear
                here as the demo SMS flow progresses.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary-600" />
              Evidence ({detail.photoCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {detail.photos?.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {detail.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="overflow-hidden rounded-[var(--radius-md)] border border-border"
                  >
                    {photo.dataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.dataUrl}
                        alt={photo.name}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-background text-foreground-secondary">
                        <Camera className="h-8 w-8" />
                      </div>
                    )}
                    <p className="truncate px-3 py-2 text-xs">{photo.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground-secondary">
                {detail.photoCount > 0
                  ? `${detail.photoCount} photo(s) recorded (seed data has no preview files).`
                  : "No photos attached."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Readiness checklist</CardTitle>
          </CardHeader>
          <CardContent>
            {detail.checklist ? (
              <div>
                <ChecklistRow
                  label="Irembo tools"
                  ok={detail.checklist.iremboTools}
                />
                <ChecklistRow
                  label="Insurance tools"
                  ok={detail.checklist.insuranceTools}
                />
                <ChecklistRow
                  label="Telecom tools"
                  ok={detail.checklist.telecomTools}
                />
                <ChecklistRow label="BK tools" ok={detail.checklist.bkTools} />
                <ChecklistRow
                  label="Smartphone"
                  ok={detail.checklist.smartphone}
                />
                <ChecklistRow label="Printer" ok={detail.checklist.printer} />
                <ChecklistRow
                  label="Internet available"
                  ok={detail.checklist.internetAvailable}
                />
                <div className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm">
                  <span>Internet type</span>
                  <span className="font-medium">
                    {detail.checklist.internetType ?? "—"}
                  </span>
                </div>
                <ChecklistRow
                  label="Branding visible"
                  ok={detail.checklist.brandingVisible}
                />
                <ChecklistRow
                  label="Trained on services"
                  ok={detail.checklist.trainedOnServices}
                />
                <ChecklistRow
                  label="Actively selling"
                  ok={detail.checklist.activelySelling}
                />
              </div>
            ) : (
              <p className="text-sm text-foreground-secondary">
                No checklist snapshot stored for this seed visit.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Fraud flags
          </CardTitle>
        </CardHeader>
        <CardContent>
          {detail.fraudFlags.length === 0 ? (
            <p className="text-sm text-foreground-secondary">
              No fraud flags linked to this visit.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {detail.fraudFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{flag.type}</p>
                    <p className="text-xs text-foreground-secondary">
                      {flag.notes}
                    </p>
                    <p className="text-xs text-foreground-secondary">
                      Detected{" "}
                      {format(new Date(flag.detectedAt), "dd MMM yyyy HH:mm")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge
                      label={flag.severity}
                      tone={
                        flag.severity === "high"
                          ? "danger"
                          : flag.severity === "medium"
                            ? "warning"
                            : "info"
                      }
                      showIcon={false}
                    />
                    <StatusBadge
                      label={flag.status}
                      tone={flag.status === "open" ? "warning" : "neutral"}
                      showIcon={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
