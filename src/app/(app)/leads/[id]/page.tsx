"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canManageCoap,
  getLeadById,
  leadStatusTone,
  type LeadListItem,
} from "@/lib/api";
import { LEAD_STATUS_LABELS, serviceLineLabel } from "@/lib/coap/catalog";

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canWrite = canManageCoap(user) && user?.role !== "MD_VIEWER";
  const [lead, setLead] = useState<LeadListItem | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void getLeadById(id, user).then((result) => {
      if (!active) return;
      setLead(result);
    });
    return () => {
      active = false;
    };
  }, [id, user]);

  if (lead === undefined) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!lead) {
    return (
      <div className="space-y-4">
        <PageHeader title="Lead not found" />
        <Button asChild variant="secondary">
          <Link href="/leads">Back to leads</Link>
        </Button>
      </div>
    );
  }

  return (
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
                  <Link href={`/onboarding/new?leadId=${lead.id}&service=${lead.serviceLine}`}>
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
            <Row label="Phone" value={lead.phone} />
            <Row label="Coordinator" value={lead.tcName} />
            <Row
              label="Location"
              value={`${lead.geo.province} · ${lead.geo.district} · ${lead.geo.sector}`}
            />
            <Row
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
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-foreground-secondary">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
