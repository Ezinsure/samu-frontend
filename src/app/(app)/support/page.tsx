"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgents } from "@/lib/api/agents";
import { apiRequest } from "@/lib/http/client";

interface SupportRow {
  id: string;
  agentName: string;
  agentCode: string;
  supportedAt: string;
  channel: string;
  summary: string;
  outcome?: string;
}

export default function SupportPage() {
  const [rows, setRows] = useState<SupportRow[]>([]);
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);
  const [agentId, setAgentId] = useState("");
  const [channel, setChannel] = useState("phone");
  const [summary, setSummary] = useState("");
  const [outcome, setOutcome] = useState("");

  const load = useCallback(async () => {
    const [logs, agentPage] = await Promise.all([
      apiRequest<SupportRow[]>("/support"),
      getAgents({ pageSize: 100 }),
    ]);
    setRows(logs);
    setAgents(agentPage.data.map((a) => ({ id: a.id, name: `${a.name} (${a.code})` })));
    if (!agentId && agentPage.data[0]) setAgentId(agentPage.data[0].id);
  }, [agentId]);

  useEffect(() => {
    void load().catch(() => toast.error("Could not load support log"));
  }, [load]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await apiRequest("/support", {
        method: "POST",
        body: { agentId, channel, summary, outcome: outcome || undefined },
      });
      toast.success("Support logged");
      setSummary("");
      setOutcome("");
      await load();
    } catch (error) {
      toast.error("Could not save", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support log"
        description="Record support you gave to an agent candidate or Irembo agent."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log support</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Network member</Label>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                required
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                <option value="phone">Phone</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="in_person">In person</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Summary</Label>
              <Input value={summary} onChange={(e) => setSummary(e.target.value)} required />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Outcome</Label>
              <Input value={outcome} onChange={(e) => setOutcome(e.target.value)} />
            </div>
            <div>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="rounded-md border border-border p-3 text-sm">
              <p className="font-medium">
                {row.agentName} · {row.channel} ·{" "}
                {new Date(row.supportedAt).toLocaleString()}
              </p>
              <p>{row.summary}</p>
              {row.outcome ? (
                <p className="text-foreground-muted">Outcome: {row.outcome}</p>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
