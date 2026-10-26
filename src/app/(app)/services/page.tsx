"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { getServicesWorkspace, type ServiceLineSummary } from "@/lib/api";
import { MobileQuickActions } from "@/features/coap/mobile-quick-actions";

export default function ServicesHubPage() {
  const { user } = useAuth();
  const [lines, setLines] = useState<ServiceLineSummary[] | null>(null);

  useEffect(() => {
    let active = true;
    void getServicesWorkspace(user).then((result) => {
      if (!active) return;
      setLines(result.lines);
    });
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <PageHeader
        title="Service lines"
        description="One-stop Community Opportunity work across IREMBO, banking, internet, devices, insurance, and clean cooking."
      />

      {!lines ? (
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
                  <div>
                    <dt className="text-foreground-secondary">Open leads</dt>
                    <dd className="font-semibold tabular-nums">{line.openLeads}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground-secondary">Activities</dt>
                    <dd className="font-semibold tabular-nums">{line.activities}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground-secondary">Onboarding</dt>
                    <dd className="font-semibold tabular-nums">
                      {line.onboardingOpen}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-foreground-secondary">Sales</dt>
                    <dd className="font-semibold tabular-nums">{line.sales}</dd>
                  </div>
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
