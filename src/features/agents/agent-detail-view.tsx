import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  agentStatusTone,
  complianceLabel,
  complianceTone,
  type AgentDetail,
} from "@/lib/api";
import { AgentAssignmentsTab, AgentVisitsTab } from "./agent-history-tabs";
import { AgentOverviewTab } from "./agent-overview-tab";
import { AgentServicesTab } from "./agent-services-tab";

/** Full agent profile: status badges plus overview/services/history tabs. */
export function AgentDetailView({
  detail,
  canManage,
}: {
  detail: AgentDetail;
  canManage: boolean;
}) {
  const { agent } = detail;

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
        <StatusBadge label={agent.status} tone={agentStatusTone(agent.status)} />
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
          <AgentOverviewTab detail={detail} />
        </TabsContent>
        <TabsContent value="services" className="grid gap-3 sm:grid-cols-2">
          <AgentServicesTab services={agent.services} />
        </TabsContent>
        <TabsContent value="visits">
          <AgentVisitsTab visits={detail.visits} />
        </TabsContent>
        <TabsContent value="assignments">
          <AgentAssignmentsTab assignments={detail.assignments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
