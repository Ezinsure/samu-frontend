"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canManageCoap,
  getFieldActivities,
  getLeads,
  getOnboardingCases,
  getSales,
  getServicesWorkspace,
  type ServiceLineSummary,
} from "@/lib/api";
import { SERVICE_LINES } from "@/lib/coap/catalog";
import type { ServiceLine } from "@/types";
import { MobileQuickActions } from "@/features/coap/mobile-quick-actions";

export default function ServiceLinePage() {
  const params = useParams<{ line: string }>();
  const lineId = params.line as ServiceLine;
  const { user } = useAuth();
  const canWrite = canManageCoap(user);
  const meta = useMemo(
    () => SERVICE_LINES.find((item) => item.id === lineId),
    [lineId],
  );

  const [summary, setSummary] = useState<ServiceLineSummary | null>(null);
  const [recent, setRecent] = useState<{
    leads: string[];
    activities: string[];
    onboarding: string[];
    sales: string[];
  } | null>(null);

  useEffect(() => {
    if (!meta) return;
    let active = true;
    void Promise.all([
      getServicesWorkspace(user),
      getLeads({ pageSize: 5, serviceLine: lineId }, user),
      getFieldActivities({ pageSize: 5, serviceLine: lineId }, user),
      getOnboardingCases({ pageSize: 5, serviceLine: lineId }, user),
      getSales({ pageSize: 5, serviceLine: lineId }, user),
    ]).then(([workspace, leads, activities, onboarding, sales]) => {
      if (!active) return;
      setSummary(workspace.lines.find((item) => item.id === lineId) ?? null);
      setRecent({
        leads: leads.data.map((item) => `${item.name} · ${item.status}`),
        activities: activities.data.map(
          (item) => `${item.activityType} · ${item.venue}`,
        ),
        onboarding: onboarding.data.map(
          (item) => `${item.customerName} · ${item.status}`,
        ),
        sales: sales.data.map(
          (item) => `${item.productName} · ${item.amountRwf.toLocaleString()} RWF`,
        ),
      });
    });
    return () => {
      active = false;
    };
  }, [user, lineId, meta]);

  if (!meta) {
    return (
      <div className="space-y-4">
        <PageHeader title="Service not found" />
        <Button asChild variant="secondary">
          <Link href="/services">Back to services</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <PageHeader
        title={meta.label}
        description={meta.description}
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/services">All services</Link>
            </Button>
            {canWrite ? (
              <>
                <Button asChild variant="secondary">
                  <Link href={`/leads/new?service=${lineId}`}>New lead</Link>
                </Button>
                <Button asChild>
                  <Link href={`/activities/new?service=${lineId}`}>
                    Log activity
                  </Link>
                </Button>
              </>
            ) : null}
          </>
        }
      />

      {!summary || !recent ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Open leads" value={summary.openLeads} />
            <Stat label="Activities" value={summary.activities} />
            <Stat label="Open onboarding" value={summary.onboardingOpen} />
            <Stat
              label="Sales value"
              value={`${summary.salesAmountRwf.toLocaleString()} RWF`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Programme checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-sm text-foreground-secondary">
                {meta.tasks.map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <RecentList
              title="Recent leads"
              href={`/leads?service=${lineId}`}
              items={recent.leads}
              empty="No leads yet for this service."
            />
            <RecentList
              title="Recent activities"
              href={`/activities?service=${lineId}`}
              items={recent.activities}
              empty="No activities logged yet."
            />
            <RecentList
              title="Onboarding"
              href={`/onboarding?service=${lineId}`}
              items={recent.onboarding}
              empty="No onboarding cases yet."
            />
            <RecentList
              title="Sales"
              href={`/sales?service=${lineId}`}
              items={recent.sales}
              empty="No sales recorded yet."
            />
          </div>
        </>
      )}

      <MobileQuickActions />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-foreground-secondary">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function RecentList({
  title,
  href,
  items,
  empty,
}: {
  title: string;
  href: string;
  items: string[];
  empty: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href={href}>View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-foreground-secondary">{empty}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.map((item) => (
              <li
                key={item}
                className="rounded-[var(--radius-md)] border border-border bg-background px-3 py-2"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
