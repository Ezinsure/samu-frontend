"use client";

import Link from "next/link";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileQuickActions } from "@/features/coap/mobile-quick-actions";
import { getServicesWorkspace } from "@/lib/api";
import { useUserData } from "@/lib/hooks/use-user-data";

export default function ServicesHubPage() {
  const state = useUserData(() => getServicesWorkspace(), "services-hub");
  const lines = state.data?.lines;

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <PageHeader
        title="Service lines"
        description="One-stop Community Opportunity work across IREMBO, banking, internet, devices, insurance, and clean cooking."
      />

      {state.error ? (
        <ErrorState
          title="Could not load services"
          description={state.error}
          onRetry={state.reload}
        />
      ) : state.loading || !lines ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-56" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lines.map((line) => (
            <Card key={line.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{line.shortLabel}</CardTitle>
                <CardDescription>{line.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <Metric label="Open leads" value={line.openLeads} />
                  <Metric label="Activities" value={line.activities} />
                  <Metric label="Onboarding" value={line.onboardingOpen} />
                  <Metric label="Sales" value={line.sales} />
                </dl>
                <Button asChild className="w-full">
                  <Link href={`/services/${line.id}`}>Open cockpit</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MobileQuickActions />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-foreground-secondary">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
