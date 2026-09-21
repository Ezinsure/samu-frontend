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
import { getTrainingDetail } from "@/lib/api";

export default function TrainingDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [detail, setDetail] = useState<
    Awaited<ReturnType<typeof getTrainingDetail>> | undefined
  >(undefined);

  useEffect(() => {
    let active = true;
    void getTrainingDetail(params.id, user).then((result) => {
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
        title="Session not found"
        description="This training session does not exist or you lack access."
        action={
          <Button asChild variant="secondary">
            <Link href="/training">Back</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="secondary" size="sm">
        <Link href="/training">
          <ArrowLeft className="h-4 w-4" />
          Training
        </Link>
      </Button>
      <PageHeader
        title={detail.topic}
        description={`${detail.date} · ${detail.format} · ${detail.tcName}`}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Session summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-foreground-secondary">Location: </span>
              {detail.geo.province} · {detail.geo.district} · {detail.geo.sector}
            </p>
            <p>
              <span className="text-foreground-secondary">Agents trained: </span>
              {detail.agentsTrained}
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
            <CardTitle>Attendees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {detail.attendees.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="block text-primary-700 hover:underline dark:text-primary-300"
              >
                {agent.name} · {agent.code}
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
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
