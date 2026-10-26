"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { getFieldActivityById, type ActivityListItem } from "@/lib/api";
import {
  ACTIVITY_TYPE_LABELS,
  serviceLineLabel,
} from "@/lib/coap/catalog";

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [item, setItem] = useState<ActivityListItem | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let active = true;
    void getFieldActivityById(id, user).then((result) => {
      if (!active) return;
      setItem(result);
    });
    return () => {
      active = false;
    };
  }, [id, user]);

  if (item === undefined) return <Skeleton className="h-64 w-full" />;
  if (!item) {
    return (
      <div className="space-y-4">
        <PageHeader title="Activity not found" />
        <Button asChild variant="secondary">
          <Link href="/activities">Back</Link>
        </Button>
      </div>
    );
  }

  return (
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
            <Row label="Venue" value={item.venue} />
            <Row
              label="Location"
              value={`${item.geo.province} · ${item.geo.district} · ${item.geo.sector}`}
            />
            <Row label="People reached" value={String(item.peopleReached)} />
            <Row label="Coordinator" value={item.tcName} />
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
