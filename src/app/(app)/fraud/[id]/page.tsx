"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  MapPin,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canReviewFraud,
  confirmationLabel,
  confirmationTone,
  fraudStatusLabel,
  fraudStatusTone,
  getFraudDetail,
  reviewFraudFlag,
  severityTone,
  validationLabel,
  validationTone,
  type FraudDetail,
  type FraudReviewAction,
} from "@/lib/api";

export default function FraudDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const canReview = canReviewFraud(user);

  const [detail, setDetail] = useState<FraudDetail | null | undefined>(
    undefined,
  );
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState<FraudReviewAction | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    void getFraudDetail(params.id, user).then((result) => {
      if (!active) return;
      setDetail(result);
    });
    return () => {
      active = false;
    };
  }, [params.id, user, refreshKey]);

  const isOwnVisit =
    Boolean(user && detail && detail.tcUserId === user.userId);
  const canAct =
    canReview &&
    !isOwnVisit &&
    detail &&
    (detail.status === "open" || detail.status === "escalated");

  async function confirmAction() {
    if (!user || !action || !detail) return;
    setSaving(true);
    const result = await reviewFraudFlag(detail.id, action, notes, user);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      action === "accept"
        ? "Flag accepted — visit cleared"
        : action === "dismiss"
          ? "Flag dismissed"
          : "Flag escalated",
      {
        description: "Audit log updated with your review notes.",
      },
    );
    setAction(null);
    setNotes("");
    setRefreshKey((value) => value + 1);
    if (action === "accept" || action === "dismiss") {
      router.push("/fraud");
    }
  }

  if (detail === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (!detail) {
    return (
      <EmptyState
        title="Flag not found"
        description="This fraud flag does not exist or you do not have access."
        action={
          <Button asChild variant="secondary">
            <Link href="/fraud">Back to fraud queue</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="secondary" size="sm">
          <Link href="/fraud">
            <ArrowLeft className="h-4 w-4" />
            Fraud queue
          </Link>
        </Button>
      </div>

      <PageHeader
        title={detail.type}
        description={`Detected ${format(new Date(detail.detectedAt), "dd MMM yyyy HH:mm")} · Visit ${detail.visitId}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              label={detail.severity}
              tone={severityTone(detail.severity)}
            />
            <StatusBadge
              label={fraudStatusLabel(detail.status)}
              tone={fraudStatusTone(detail.status)}
            />
          </div>
        }
      />

      {isOwnVisit && canReview ? (
        <div className="rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          You submitted this visit. Policy blocks reviewing your own fraud flags.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Flag details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>{detail.notes ?? "No detection notes."}</p>
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
              <div>
                <p className="text-xs text-foreground-secondary">Visit purpose</p>
                <p className="font-medium">{detail.visitPurpose}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Visit time</p>
                <p className="font-medium">
                  {format(new Date(detail.visitStartedAt), "dd MMM yyyy HH:mm")}
                </p>
              </div>
              {detail.assignedReviewerName ? (
                <div>
                  <p className="text-xs text-foreground-secondary">
                    Assigned reviewer
                  </p>
                  <p className="font-medium">{detail.assignedReviewerName}</p>
                </div>
              ) : null}
              {detail.resolution ? (
                <div className="sm:col-span-2">
                  <p className="text-xs text-foreground-secondary">Resolution</p>
                  <p className="font-medium">{detail.resolution}</p>
                </div>
              ) : null}
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/visits/${detail.visitId}`}>Open full visit</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary-600" />
                GPS & validation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-foreground-secondary">Distance</p>
                <p className="text-xl font-semibold tabular-nums">
                  {detail.distanceFromRegisteredMeters}m
                </p>
              </div>
              <StatusBadge
                label={validationLabel(detail.visitValidation)}
                tone={validationTone(detail.visitValidation)}
              />
              <StatusBadge
                label={confirmationLabel(detail.visit.confirmationStatus)}
                tone={confirmationTone(detail.visit.confirmationStatus)}
              />
              <p className="font-mono text-xs text-foreground-secondary">
                {detail.visit.location.lat}, {detail.visit.location.lng}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary-600" />
                Evidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              {detail.visit.photos?.length ? (
                <div className="grid gap-2">
                  {detail.visit.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="overflow-hidden rounded-[var(--radius-md)] border border-border"
                    >
                      {photo.dataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo.dataUrl}
                          alt={photo.name}
                          className="h-32 w-full object-cover"
                        />
                      ) : null}
                      <p className="truncate px-2 py-1.5 text-xs">{photo.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-foreground-secondary">
                  {detail.photoCount} photo(s) on visit
                  {detail.photoCount > 0
                    ? " (seed records have no preview files)."
                    : "."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {canAct ? (
        <Card>
          <CardHeader>
            <CardTitle>Review actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => setAction("accept")}
            >
              <CheckCircle2 className="h-4 w-4" />
              Accept visit
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAction("escalate")}
            >
              <ShieldAlert className="h-4 w-4" />
              Escalate
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAction("dismiss")}
            >
              <XCircle className="h-4 w-4" />
              Dismiss
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Review history</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.reviewHistoryEnriched.length === 0 ? (
            <p className="text-sm text-foreground-secondary">
              No review actions yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {detail.reviewHistoryEnriched
                .slice()
                .reverse()
                .map((event) => (
                  <div key={event.id} className="py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        label={event.action}
                        tone={
                          event.action === "accept"
                            ? "success"
                            : event.action === "escalate"
                              ? "danger"
                              : event.action === "dismiss"
                                ? "neutral"
                                : "info"
                        }
                        showIcon={false}
                      />
                      <span className="font-medium">{event.byName}</span>
                      <span className="text-xs text-foreground-secondary">
                        {format(new Date(event.at), "dd MMM yyyy HH:mm")}
                      </span>
                    </div>
                    {event.notes ? (
                      <p className="mt-1 text-foreground-secondary">
                        {event.notes}
                      </p>
                    ) : null}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={action !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAction(null);
            setNotes("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "accept"
                ? "Accept visit"
                : action === "escalate"
                  ? "Escalate flag"
                  : "Dismiss flag"}
            </DialogTitle>
            <DialogDescription>
              {action === "accept"
                ? "Clears the flag as resolved and sets the visit validation to accepted."
                : action === "escalate"
                  ? "Marks the flag escalated with high severity for further review."
                  : "Closes the flag as a false positive and accepts the visit."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="review-notes">Review notes</Label>
            <Textarea
              id="review-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Explain the decision…"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setAction(null);
                setNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!notes.trim() || saving}
              onClick={() => void confirmAction()}
            >
              {saving ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
