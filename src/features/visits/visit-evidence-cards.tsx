import { format } from "date-fns";
import { AlertTriangle, Camera } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VisitDetail } from "@/lib/api";
import { CHECKLIST_ITEMS } from "@/lib/visits/checklist";

function YesNoRow({ label, ok }: { label: string; ok: boolean }) {
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

/** Photo grid using the short-lived signed URLs from the API. */
export function VisitEvidenceCard({ detail }: { detail: VisitDetail }) {
  return (
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
              <a
                key={photo.id}
                href={photo.url}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-[var(--radius-md)] border border-border"
              >
                {photo.url ? (
                  // Signed storage URL: next/image would need a remote pattern per bucket host.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-background text-foreground-secondary">
                    <Camera className="h-8 w-8" />
                  </div>
                )}
                <p className="truncate px-3 py-2 text-xs">{photo.name}</p>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground-secondary">No photos attached.</p>
        )}
      </CardContent>
    </Card>
  );
}

/** Readiness checklist snapshot captured at visit time. */
export function VisitChecklistCard({ detail }: { detail: VisitDetail }) {
  const checklist = detail.checklist;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Readiness checklist</CardTitle>
      </CardHeader>
      <CardContent>
        {checklist ? (
          <div>
            {CHECKLIST_ITEMS.map((item) => (
              <YesNoRow key={item.key} label={item.label} ok={checklist[item.key]} />
            ))}
            <div className="flex items-center justify-between gap-3 py-2 text-sm">
              <span>Internet type</span>
              <span className="font-medium">{checklist.internetType ?? "—"}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground-secondary">
            No checklist snapshot stored for this visit.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

const SEVERITY_TONE = { high: "danger", medium: "warning", low: "info" } as const;

export function VisitFraudCard({ detail }: { detail: VisitDetail }) {
  return (
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
                  <p className="text-xs text-foreground-secondary">{flag.notes}</p>
                  <p className="text-xs text-foreground-secondary">
                    Detected {format(new Date(flag.detectedAt), "dd MMM yyyy HH:mm")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge
                    label={flag.severity}
                    tone={SEVERITY_TONE[flag.severity]}
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
  );
}
