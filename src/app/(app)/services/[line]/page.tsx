"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileQuickActions } from "@/features/coap/mobile-quick-actions";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCoap, getServiceLineWorkspace } from "@/lib/api";
import { SERVICE_LINES } from "@/lib/coap/catalog";
import { useUserData } from "@/lib/hooks/use-user-data";
import type { ServiceLine } from "@/types";

interface RecentItem {
  id: string;
  label: string;
}

export default function ServiceLinePage() {
  const params = useParams<{ line: string }>();
  const lineId = params.line as ServiceLine;
  const { user } = useAuth();
  const canWrite = canManageCoap(user);
  const meta = SERVICE_LINES.find((item) => item.id === lineId);

  // A single call returns the counters and the latest records of every type.
  const state = useUserData(
    () =>
      meta ? getServiceLineWorkspace(lineId) : Promise.resolve(null),
    `service-line:${lineId}`,
  );

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

  const workspace = state.data;

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

      {state.error ? (
        <ErrorState
          title="Could not load this service"
          description={state.error}
          onRetry={state.reload}
        />
      ) : state.loading || !workspace ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Open leads" value={workspace.line.openLeads} />
            <Stat label="Activities" value={workspace.line.activities} />
            <Stat label="Open onboarding" value={workspace.line.onboardingOpen} />
            <Stat
              label="Sales value"
              value={`${workspace.line.salesAmountRwf.toLocaleString()} RWF`}
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
              viewAllHref={`/leads?service=${lineId}`}
              itemHref="/leads"
              items={workspace.recent.leads.map((item) => ({
                id: item.id,
                label: `${item.name} · ${item.status}`,
              }))}
              empty="No leads yet for this service."
            />
            <RecentList
              title="Recent activities"
              viewAllHref={`/activities?service=${lineId}`}
              itemHref="/activities"
              items={workspace.recent.activities.map((item) => ({
                id: item.id,
                label: `${item.activityType} · ${item.venue}`,
              }))}
              empty="No activities logged yet."
            />
            <RecentList
              title="Onboarding"
              viewAllHref={`/onboarding?service=${lineId}`}
              itemHref="/onboarding"
              items={workspace.recent.onboarding.map((item) => ({
                id: item.id,
                label: `${item.customerName} · ${item.status}`,
              }))}
              empty="No onboarding cases yet."
            />
            <RecentList
              title="Sales"
              viewAllHref={`/sales?service=${lineId}`}
              itemHref="/sales"
              items={workspace.recent.sales.map((item) => ({
                id: item.id,
                label: `${item.productName} · ${item.amountRwf.toLocaleString()} RWF`,
              }))}
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
  viewAllHref,
  itemHref,
  items,
  empty,
}: {
  title: string;
  viewAllHref: string;
  /** Base path; each row links to `${itemHref}/${id}`. */
  itemHref: string;
  items: RecentItem[];
  empty: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href={viewAllHref}>View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-foreground-secondary">{empty}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`${itemHref}/${item.id}`}
                  className="block rounded-[var(--radius-md)] border border-border bg-background px-3 py-2 hover:bg-surface"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
