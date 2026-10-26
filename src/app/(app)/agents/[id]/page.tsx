"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canManageAgents,
  complianceLabel,
  complianceTone,
  getAgentDetail,
  type AgentDetail,
} from "@/lib/api";

function ServiceRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border px-3 py-2">
      <span className="text-sm text-foreground">{label}</span>
      <StatusBadge label={ok ? "Ready" : "Missing"} tone={ok ? "success" : "danger"} />
    </div>
  );
}

export default function AgentDetailPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const canManage = canManageAgents(user);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getAgentDetail(params.id, user).then((result) => {
      if (!active) return;
      setDetail(result);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [params.id, user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!detail) {
    return (
      <EmptyState
        title="Agent not found"
        description="This agent does not exist or is outside your assigned territory."
        action={
          <Button asChild>
            <Link href="/agents">Back to agents</Link>
          </Button>
        }
      />
    );
  }

  const { agent, visits, assignments, tcName } = detail;
  const services = agent.services;

  return (
    <div className="space-y-6">
      <PageHeader
        title={agent.name}
        description={`${agent.code} · ${agent.geo.district}, ${agent.geo.sector}`}
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/agents">Back</Link>
            </Button>
            {canManage ? (
              <Button asChild>
                <Link href={`/agents/${agent.id}/edit`}>Edit agent</Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <StatusBadge
          label={agent.status}
          tone={
            agent.status === "Active"
              ? "success"
              : agent.status === "Inactive"
                ? "inactive"
                : agent.status === "Suspended"
                  ? "danger"
                  : "warning"
          }
        />
        <StatusBadge
          label={complianceLabel(agent.compliance)}
          tone={complianceTone(agent.compliance)}
        />
        <StatusBadge
          label={agent.nidVerified ? "NID verified" : "NID pending"}
          tone={agent.nidVerified ? "success" : "warning"}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="visits">Visit history</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact & identity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-foreground-secondary">Phone</p>
                <p className="text-sm font-medium">{agent.phone}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Email</p>
                <p className="text-sm font-medium">{agent.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">NID</p>
                <p className="text-sm font-medium tabular-nums">{agent.nidMasked}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Clients registered</p>
                <p className="text-sm font-medium tabular-nums">
                  {agent.clientsRegistered}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Geography & assignment</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-foreground-secondary">Province</p>
                <p className="text-sm font-medium">{agent.geo.province}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">District</p>
                <p className="text-sm font-medium">{agent.geo.district}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Sector / Cell</p>
                <p className="text-sm font-medium">
                  {agent.geo.sector} · {agent.geo.cell}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Assigned TC</p>
                <p className="text-sm font-medium">{tcName}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-foreground-secondary">Registered GPS</p>
                <p className="text-sm font-medium tabular-nums">
                  {agent.registeredLocation.lat.toFixed(5)},{" "}
                  {agent.registeredLocation.lng.toFixed(5)}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Last visit</p>
                <p className="text-sm font-medium">
                  {agent.lastVisitAt
                    ? new Date(agent.lastVisitAt).toLocaleString()
                    : "Never"}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Flags</p>
                <p className="text-sm font-medium">
                  {[
                    agent.recruitedThisMonth ? "New this month" : null,
                    agent.reactivatedThisMonth ? "Reactivated" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="grid gap-3 sm:grid-cols-2">
          <ServiceRow label="IREMBO tools" ok={services.iremboTools} />
          <ServiceRow label="Insurance tools" ok={services.insuranceTools} />
          <ServiceRow label="Telecom / internet tools" ok={services.telecomTools} />
          <ServiceRow label="BK / financial inclusion" ok={services.bkTools} />
          <ServiceRow label="Smartphone" ok={services.smartphone} />
          <ServiceRow label="Printer" ok={services.printer} />
          <ServiceRow label="Internet available" ok={services.internetAvailable} />
          <ServiceRow label="Starlink-ready" ok={!!services.starlinkReady} />
          <ServiceRow label="Clean cooking tools" ok={!!services.cleanCookingTools} />
          <ServiceRow label="Branding visible" ok={services.brandingVisible} />
          <ServiceRow label="Trained on COAP services" ok={services.trainedOnServices} />
          <ServiceRow label="Actively selling" ok={services.activelySelling} />
          <Card className="sm:col-span-2">
            <CardContent className="pt-5 text-sm">
              Internet type:{" "}
              <span className="font-medium">
                {services.internetAvailable
                  ? services.internetType ?? "Unknown"
                  : "Not available"}
              </span>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visits">
          <DataTable
            data={visits}
            getRowId={(row) => row.id}
            emptyTitle="No visits yet"
            emptyDescription="Field visits for this agent will appear here."
            columns={[
              {
                id: "date",
                header: "Date",
                cell: (row) => (
                  <Link
                    href={`/visits/${row.id}`}
                    className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                  >
                    {new Date(row.startedAt).toLocaleString()}
                  </Link>
                ),
              },
              {
                id: "purpose",
                header: "Purpose",
                cell: (row) => row.purpose,
              },
              {
                id: "validation",
                header: "Validation",
                cell: (row) => (
                  <StatusBadge
                    label={row.validation}
                    tone={
                      row.validation === "accepted"
                        ? "success"
                        : row.validation === "flagged"
                          ? "warning"
                          : "danger"
                    }
                  />
                ),
              },
              {
                id: "sms",
                header: "SMS",
                cell: (row) => row.confirmationStatus,
              },
              {
                id: "distance",
                header: "Distance",
                align: "right",
                cell: (row) => `${row.distanceFromRegisteredMeters}m`,
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="assignments">
          <DataTable
            data={assignments}
            getRowId={(row) => row.id}
            emptyTitle="No assignment history"
            emptyDescription="Assignment changes will be listed here."
            columns={[
              {
                id: "tc",
                header: "Coordinator",
                cell: (row) => row.tcName,
              },
              {
                id: "started",
                header: "Started",
                cell: (row) => new Date(row.startedAt).toLocaleDateString(),
              },
              {
                id: "ended",
                header: "Ended",
                cell: (row) =>
                  row.endedAt
                    ? new Date(row.endedAt).toLocaleDateString()
                    : "—",
              },
              {
                id: "active",
                header: "Status",
                cell: (row) => (
                  <StatusBadge
                    label={row.active ? "Active" : "Closed"}
                    tone={row.active ? "success" : "neutral"}
                  />
                ),
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
