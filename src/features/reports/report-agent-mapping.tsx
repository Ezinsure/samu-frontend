import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { complianceLabel, complianceTone } from "@/lib/api";
import type { MonthlyReportAgentSnapshot } from "@/types";

/** Agents mapped to the coordinator when the report was (or will be) submitted. */
export function ReportAgentMapping({
  agents,
}: {
  agents: MonthlyReportAgentSnapshot[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent mapping snapshot ({agents.length})</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {agents.length === 0 ? (
          <p className="p-4 text-sm text-foreground-secondary">
            No agents in snapshot yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-secondary">
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Compliance</th>
                <th className="px-4 py-3 font-medium">Flags</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr
                  key={agent.agentId}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/agents/${agent.agentId}`}
                      className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                    >
                      {agent.name}
                    </Link>
                    <p className="text-xs text-foreground-secondary">
                      {agent.code}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {agent.district} · {agent.sector}
                  </td>
                  <td className="px-4 py-3">{agent.status}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={complianceLabel(agent.compliance)}
                      tone={complianceTone(agent.compliance)}
                      showIcon={false}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground-secondary">
                    {[
                      agent.recruitedThisMonth ? "New" : null,
                      agent.reactivatedThisMonth ? "Reactivated" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
