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
import { getMeetingDetail } from "@/lib/api";

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [detail, setDetail] = useState<
    Awaited<ReturnType<typeof getMeetingDetail>> | undefined
  >(undefined);

  useEffect(() => {
    let active = true;
    void getMeetingDetail(params.id, user).then((result) => {
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
        title="Meeting not found"
        description="This meeting does not exist or you lack access."
        action={
          <Button asChild variant="secondary">
            <Link href="/meetings">Back</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="secondary" size="sm">
        <Link href="/meetings">
          <ArrowLeft className="h-4 w-4" />
          Meetings
        </Link>
      </Button>
      <PageHeader
        title={detail.meetingType}
        description={`${detail.date} · ${detail.location} · ${detail.tcName}`}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Meeting summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-foreground-secondary">Participants: </span>
              {detail.participantCount}
            </p>
            <div>
              <p className="text-foreground-secondary">Agenda</p>
              <p className="mt-1">{detail.agenda}</p>
            </div>
            <div>
              <p className="text-foreground-secondary">Decisions</p>
              <p className="mt-1">{detail.decisions}</p>
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
