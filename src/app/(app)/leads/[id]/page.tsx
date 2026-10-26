"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DetailRow } from "@/components/shared/detail-row";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecordGate } from "@/features/coap/record-states";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCoap, getLeadById, leadStatusTone } from "@/lib/api";
import { LEAD_STATUS_LABELS, serviceLineLabel } from "@/lib/coap/catalog";
import { useUserData } from "@/lib/hooks/use-user-data";

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canWrite = canManageCoap(user);
  const state = useUserData(() => getLeadById(id), `lead:${id}`);

  return (
    <RecordGate
      state={state}
      notFoundTitle="Lead not found"
      backHref="/leads"
    >
      {(lead) => (
        <div className="space-y-6">
          <PageHeader
            title={lead.name}
            description={`${serviceLineLabel(lead.serviceLine)} · ${lead.entityType}`}
            actions={
              <>
                <Button asChild variant="secondary">
                  <Link href="/leads">All leads</Link>
                </Button>
                {canWrite ? (
                  <>
                    <Button asChild variant="secondary">
                      <Link href={`/activities/new?service=${lead.serviceLine}`}>
                        Log activity
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link
                        href={`/onboarding/new?leadId=${lead.id}&service=${lead.serviceLine}`}
                      >
                        Start onboarding
                      </Link>
                    </Button>
                  </>
                ) : null}
              </>
            }
          />

          <div className="flex flex-wrap gap-2">
            <StatusBadge
              label={LEAD_STATUS_LABELS[lead.status]}
              tone={leadStatusTone(lead.status)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <DetailRow label="Phone" value={lead.phone} />
                <DetailRow label="Coordinator" value={lead.tcName} />
                <DetailRow
                  label="Location"
                  value={`${lead.geo.province} · ${lead.geo.district} · ${lead.geo.sector}`}
                />
                <DetailRow
                  label="Updated"
                  value={new Date(lead.updatedAt).toLocaleString()}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Interest</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-foreground">
                  {lead.interestSummary || "No interest summary yet."}
                </p>
                {lead.notes ? (
                  <p className="text-foreground-secondary">{lead.notes}</p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </RecordGate>
  );
}
