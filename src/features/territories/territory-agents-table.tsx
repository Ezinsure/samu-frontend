import Link from "next/link";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  agentStatusTone,
  complianceLabel,
  complianceTone,
  type TerritoryWorkspace,
} from "@/lib/api";

type WorkspaceAgent = TerritoryWorkspace["agents"][number];

/** Agents registered under the selected territory. */
export function TerritoryAgentsTable({ agents }: { agents: WorkspaceAgent[] }) {
  if (agents.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Users}
          title="No agents here"
          description="No agents are registered under this territory."
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-secondary">
            <th className="px-4 py-3 font-medium">Agent</th>
            <th className="px-4 py-3 font-medium">Location</th>
            <th className="px-4 py-3 font-medium">TC</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Compliance</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <Link
                  href={`/agents/${agent.id}`}
                  className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                >
                  {agent.name}
                </Link>
                <p className="text-xs text-foreground-secondary">{agent.code}</p>
              </td>
              <td className="px-4 py-3 text-foreground-secondary">
                {agent.geo.sector}
                {agent.geo.cell ? ` · ${agent.geo.cell}` : ""}
              </td>
              <td className="px-4 py-3">{agent.tcName}</td>
              <td className="px-4 py-3">
                <StatusBadge
                  label={agent.status}
                  tone={agentStatusTone(agent.status)}
                  showIcon={false}
                />
              </td>
              <td className="px-4 py-3">
                <StatusBadge
                  label={complianceLabel(agent.compliance)}
                  tone={complianceTone(agent.compliance)}
                  showIcon={false}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
