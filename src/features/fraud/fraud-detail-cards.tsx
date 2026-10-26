"use client";

import Link from "next/link";
import { format } from "date-fns";
import { AlertTriangle, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VisitEvidenceCard } from "@/features/visits/visit-evidence-cards";
import { getVisitDetail, type FraudDetail } from "@/lib/api";
import { useUserData } from "@/lib/hooks/use-user-data";
import {
  confirmationLabel,
  confirmationTone,
  validationLabel,
  validationTone,
} from "@/lib/visits/presentation";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-foreground-secondary">{label}</p>
      <div className="font-medium">{children}</div>
    </div>
  );
}

export function FraudFlagCard({ detail }: { detail: FraudDetail }) {
  return (
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
          <Field label="Agent">
            <Link
              href={`/agents/${detail.agentId}`}
              className="text-primary-700 hover:underline dark:text-primary-300"
            >
              {detail.agentName} ({detail.agentCode})
            </Link>
          </Field>
          <Field label="Coordinator">{detail.tcName}</Field>
          <Field label="Visit purpose">{detail.visitPurpose}</Field>
          <Field label="Visit time">
            {format(new Date(detail.visitStartedAt), "dd MMM yyyy HH:mm")}
          </Field>
          {detail.assignedReviewerName ? (
            <Field label="Assigned reviewer">{detail.assignedReviewerName}</Field>
          ) : null}
          {detail.resolution ? (
            <div className="sm:col-span-2">
              <Field label="Resolution">{detail.resolution}</Field>
            </div>
          ) : null}
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href={`/visits/${detail.visitId}`}>Open full visit</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function FraudGpsCard({ detail }: { detail: FraudDetail }) {
  return (
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
  );
}

/** The flag payload has no photos, so the evidence comes from the visit endpoint. */
export function FraudEvidenceCard({ visitId }: { visitId: string }) {
  const visit = useUserData(() => getVisitDetail(visitId), `fraud-visit:${visitId}`);

  if (visit.loading) return <Skeleton className="h-40 w-full" />;
  if (!visit.data) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-foreground-secondary">
          Evidence is unavailable for this visit.
        </CardContent>
      </Card>
    );
  }
  return <VisitEvidenceCard detail={visit.data} />;
}
