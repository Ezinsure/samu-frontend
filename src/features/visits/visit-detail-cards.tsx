import Link from "next/link";
import { format } from "date-fns";
import { MapPin, MessageSquare } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VisitDetail } from "@/lib/api";
import { serviceLineLabel } from "@/lib/coap/catalog";
import { confirmationLabel, confirmationTone } from "@/lib/visits/presentation";

const formatDateTime = (iso: string) => format(new Date(iso), "dd MMM yyyy HH:mm");

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-foreground-secondary">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/** Who / when / what of the visit. */
export function VisitSummaryCard({ detail }: { detail: VisitDetail }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Visit summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Agent">
            <Link
              href={`/agents/${detail.agentId}`}
              className="font-medium text-primary-700 hover:underline dark:text-primary-300"
            >
              {detail.agentName} ({detail.agentCode})
            </Link>
          </Field>
          <Field label="Coordinator">
            <p className="font-medium">{detail.tcName}</p>
          </Field>
          {detail.serviceLines?.length ? (
            <div className="sm:col-span-2">
              <Field label="COAP services covered">
                <p className="font-medium">
                  {detail.serviceLines.map(serviceLineLabel).join(", ")}
                </p>
              </Field>
            </div>
          ) : null}
          <Field label="Started">
            <p className="font-medium">{formatDateTime(detail.startedAt)}</p>
          </Field>
          <Field label="Ended">
            <p className="font-medium">{formatDateTime(detail.endedAt)}</p>
          </Field>
        </div>
        <Field label="Activities">
          <p>{detail.activities}</p>
        </Field>
        <Field label="Outcome">
          <p>{detail.outcome}</p>
        </Field>
        {detail.challenges ? (
          <Field label="Challenges">
            <p>{detail.challenges}</p>
          </Field>
        ) : null}
        {detail.supportNeeded ? (
          <Field label="Support needed">
            <p>{detail.supportNeeded}</p>
          </Field>
        ) : null}
        {detail.deviceInfo ? (
          <Field label="Device">
            <p className="break-all text-xs text-foreground-secondary">
              {detail.deviceInfo}
            </p>
          </Field>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Server-computed distance vs the agent's registered location. */
export function VisitGpsCard({ detail }: { detail: VisitDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary-600" />
          GPS validation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Field label="Visit location">
          <p className="font-mono">
            {detail.location.lat}, {detail.location.lng}
          </p>
          <p className="text-xs text-foreground-secondary">
            Accuracy ±{detail.location.accuracyMeters ?? "—"}m
          </p>
        </Field>
        <Field label="Registered agent location">
          <p className="font-mono">
            {detail.agent.registeredLocation.lat},{" "}
            {detail.agent.registeredLocation.lng}
          </p>
        </Field>
        <Field label="Distance">
          <p className="text-xl font-semibold tabular-nums">
            {detail.distanceFromRegisteredMeters}m
          </p>
          <p className="text-xs text-foreground-secondary">
            Threshold {detail.gpsThresholdMeters}m
          </p>
        </Field>
        {detail.flaggedReason ? (
          <p className="rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
            {detail.flaggedReason}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function VisitSmsCard({ detail }: { detail: VisitDetail }) {
  return (
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
          Agent confirmation is queued when the visit is submitted. Status
          updates here once the agent responds or the window expires.
        </p>
      </CardContent>
    </Card>
  );
}
