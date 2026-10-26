"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DetailRow } from "@/components/shared/detail-row";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecordGate } from "@/features/coap/record-states";
import { getFieldActivityById } from "@/lib/api";
import { ACTIVITY_TYPE_LABELS, serviceLineLabel } from "@/lib/coap/catalog";
import { useUserData } from "@/lib/hooks/use-user-data";

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const state = useUserData(() => getFieldActivityById(id), `activity:${id}`);

  return (
    <RecordGate
      state={state}
      notFoundTitle="Activity not found"
      backHref="/activities"
    >
      {(item) => (
        <div className="space-y-6">
          <PageHeader
            title={ACTIVITY_TYPE_LABELS[item.activityType]}
            description={`${serviceLineLabel(item.serviceLine)} · ${item.date}`}
            actions={
              <Button asChild variant="secondary">
                <Link href="/activities">All activities</Link>
              </Button>
            }
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Where & reach</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <DetailRow label="Venue" value={item.venue} />
                <DetailRow
                  label="Location"
                  value={`${item.geo.province} · ${item.geo.district} · ${item.geo.sector}`}
                />
                <DetailRow
                  label="People reached"
                  value={String(item.peopleReached)}
                />
                <DetailRow label="Coordinator" value={item.tcName} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>What happened</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-foreground-secondary">Summary</p>
                  <p className="mt-1 text-foreground">{item.summary}</p>
                </div>
                <div>
                  <p className="text-foreground-secondary">Outcome</p>
                  <p className="mt-1 text-foreground">
                    {item.outcome || "No outcome recorded."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </RecordGate>
  );
}
