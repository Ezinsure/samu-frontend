import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentDetail } from "@/lib/api";

/** Label/value pair used across the overview cards. */
function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-foreground-secondary">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

/** Contact, identity, geography, and assignment summary for one agent. */
export function AgentOverviewTab({ detail }: { detail: AgentDetail }) {
  const { agent, tcName } = detail;
  const flags =
    [
      agent.recruitedThisMonth ? "New this month" : null,
      agent.reactivatedThisMonth ? "Reactivated" : null,
    ]
      .filter(Boolean)
      .join(" · ") || "—";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Contact & identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Phone" value={agent.phone} />
          <Field label="Email" value={agent.email ?? "—"} />
          <Field
            label="NID"
            value={<span className="tabular-nums">{agent.nidMasked}</span>}
          />
          <Field
            label="Clients registered"
            value={
              <span className="tabular-nums">{agent.clientsRegistered}</span>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Geography & assignment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Province" value={agent.geo.province} />
          <Field label="District" value={agent.geo.district} />
          <Field
            label="Sector / Cell"
            value={`${agent.geo.sector} · ${agent.geo.cell}`}
          />
          <Field label="Assigned TC" value={tcName} />
          <Field
            className="sm:col-span-2"
            label="Registered GPS"
            value={
              <span className="tabular-nums">
                {agent.registeredLocation.lat.toFixed(5)},{" "}
                {agent.registeredLocation.lng.toFixed(5)}
              </span>
            }
          />
          <Field
            label="Last visit"
            value={
              agent.lastVisitAt
                ? new Date(agent.lastVisitAt).toLocaleString()
                : "Never"
            }
          />
          <Field label="Flags" value={flags} />
        </CardContent>
      </Card>
    </>
  );
}
