"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkedActionsList } from "@/features/activities/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { getSensitizationDetail } from "@/lib/api";

export default function SensitizationDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [detail, setDetail] = useState<
    Awaited<ReturnType<typeof getSensitizationDetail>> | undefined
  >(undefined);

  useEffect(() => {
    let active = true;
    void getSensitizationDetail(params.id, user).then((result) => {
      if (active) setDetail(result);
    });
    return () => {
      active = false;
    };
  }, [params.id, user]);

  if (detail === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!detail) {
    return (
      <EmptyState
        title="Event not found"
        description="This sensitization event does not exist or you lack access."
        action={
          <Button asChild variant="secondary">
            <Link href="/sensitization">Back</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="secondary" size="sm">
        <Link href="/sensitization">
          <ArrowLeft className="h-4 w-4" />
          Sensitization
        </Link>
      </Button>
      <PageHeader
        title={detail.eventType}
        description={`${detail.date} · ${detail.venue} · ${detail.tcName}`}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Event summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-foreground-secondary">Location: </span>
              {detail.geo.province} · {detail.geo.district} · {detail.geo.sector}
            </p>
            <p>
              <span className="text-foreground-secondary">People reached: </span>
              {detail.peopleReached}
            </p>
            <div>
              <p className="text-foreground-secondary">Approach</p>
              <p className="mt-1">{detail.approach}</p>
            </div>
            <div>
              <p className="text-foreground-secondary">Outcome</p>
              <p className="mt-1">{detail.outcome}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Follow-up actions</CardTitle>
          </CardHeader>
          <CardContent>
            <LinkedActionsList actions={detail.actions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
