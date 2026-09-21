"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarClock,
  RefreshCw,
  Save,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/auth-context";
import {
  KPI_LABELS,
  NARRATIVE_PROMPTS,
  complianceLabel,
  complianceTone,
  getMonthlyReportWorkspace,
  refreshReportKpis,
  reportStatusLabel,
  reportStatusTone,
  requestReportChanges,
  saveMonthlyReportDraft,
  submitMonthlyReport,
  type MonthlyReportWorkspace,
} from "@/lib/api";
import type { MonthlyReportNarrative } from "@/types";

export default function MonthlyReportWorkspacePage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState<
    MonthlyReportWorkspace | null | undefined
  >(undefined);
  const [narrative, setNarrative] = useState<MonthlyReportNarrative | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    void getMonthlyReportWorkspace(params.id, user).then((result) => {
      if (!active) return;
      setWorkspace(result);
      if (result) setNarrative({ ...result.report.narrative });
    });
    return () => {
      active = false;
    };
  }, [params.id, user, refreshKey]);

  async function handleSave() {
    if (!user || !narrative || !workspace) return;
    setSaving(true);
    const result = await saveMonthlyReportDraft(
      workspace.report.id,
      { narrative },
      user,
    );
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Draft saved");
    setRefreshKey((value) => value + 1);
  }

  async function handleRefreshKpis() {
    if (!user || !workspace) return;
    setSaving(true);
    const result = await refreshReportKpis(workspace.report.id, user);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("KPIs refreshed from activity records");
    setRefreshKey((value) => value + 1);
  }

  async function handleSubmit() {
    if (!user || !workspace || !narrative) return;
    setSaving(true);
    const save = await saveMonthlyReportDraft(
      workspace.report.id,
      { narrative },
      user,
    );
    if (!save.ok) {
      setSaving(false);
      toast.error(save.error);
      return;
    }
    const result = await submitMonthlyReport(workspace.report.id, user);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      workspace.report.status === "changes_requested"
        ? "Report resubmitted"
        : "Report submitted",
      {
        description: "Head Office can now review this obligation.",
      },
    );
    setRefreshKey((value) => value + 1);
  }

  async function handleRequestChanges() {
    if (!user || !workspace) return;
    setSaving(true);
    const result = await requestReportChanges(
      workspace.report.id,
      reviewNotes,
      user,
    );
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Changes requested");
    setChangesOpen(false);
    setReviewNotes("");
    setRefreshKey((value) => value + 1);
  }

  if (workspace === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!workspace || !narrative) {
    return (
      <EmptyState
        title="Report not found"
        description="This monthly report does not exist or you lack access."
        action={
          <Button asChild variant="secondary">
            <Link href="/monthly-reports">Back to reports</Link>
          </Button>
        }
      />
    );
  }

  const { report, targets, linkedActivities, canEdit, canRequestChanges } =
    workspace;
  const dueDayMessage = report.overdue
    ? `Overdue — deadline was ${format(new Date(report.deadline), "dd MMM yyyy")} (due by the 5th).`
    : `Deadline ${format(new Date(report.deadline), "dd MMM yyyy")} · ${report.daysToDeadline} day(s) remaining (reports due by the 5th).`;

  return (
    <div className="space-y-6">
      <Button asChild variant="secondary" size="sm">
        <Link href="/monthly-reports">
          <ArrowLeft className="h-4 w-4" />
          Monthly reports
        </Link>
      </Button>

      <PageHeader
        title={`${report.period} territory report`}
        description={`${report.tcName} · ${report.territorySnapshot.join(", ")}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              label={reportStatusLabel(report.status)}
              tone={reportStatusTone(report.status)}
            />
            {canEdit ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={() => void handleRefreshKpis()}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh KPIs
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={() => void handleSave()}
                >
                  <Save className="h-4 w-4" />
                  Save draft
                </Button>
                <Button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSubmit()}
                >
                  <Send className="h-4 w-4" />
                  {report.status === "changes_requested"
                    ? "Resubmit"
                    : "Submit"}
                </Button>
              </>
            ) : null}
            {canRequestChanges ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setChangesOpen(true)}
              >
                Request changes
              </Button>
            ) : null}
          </div>
        }
      />

      <Card>
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
          <div>
            <p className="font-medium">{dueDayMessage}</p>
            {report.reviewNotes ? (
              <p className="mt-1 text-foreground-secondary">
                Reviewer notes: {report.reviewNotes}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="kpi">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="kpi">KPI summary</TabsTrigger>
          <TabsTrigger value="mapping">Agent mapping</TabsTrigger>
          <TabsTrigger value="narrative">Narrative G1–G7</TabsTrigger>
          <TabsTrigger value="activities">Linked activities</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="kpi">
          <Card>
            <CardHeader>
              <CardTitle>KPI actuals vs targets</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-secondary">
                    <th className="px-4 py-3 font-medium">KPI</th>
                    <th className="px-4 py-3 font-medium">Actual</th>
                    <th className="px-4 py-3 font-medium">Target</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(targets).map((key) => {
                    const actual = report.kpiActuals[key] ?? 0;
                    const target = targets[key] ?? 0;
                    const met = actual >= target;
                    return (
                      <tr key={key} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          {KPI_LABELS[key] ?? key}
                        </td>
                        <td className="px-4 py-3 tabular-nums font-medium">
                          {actual}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-foreground-secondary">
                          {target}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            label={met ? "Met" : "Below"}
                            tone={met ? "success" : "warning"}
                            showIcon={false}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle>
                Agent mapping snapshot ({report.agentMappingSnapshot.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              {report.agentMappingSnapshot.length === 0 ? (
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
                    {report.agentMappingSnapshot.map((agent) => (
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
        </TabsContent>

        <TabsContent value="narrative">
          <div className="space-y-4">
            {NARRATIVE_PROMPTS.map((prompt) => (
              <Card key={prompt.key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{prompt.label}</CardTitle>
                  <p className="text-xs text-foreground-secondary">
                    {prompt.hint}
                  </p>
                </CardHeader>
                <CardContent>
                  {canEdit ? (
                    <Textarea
                      value={narrative[prompt.key]}
                      onChange={(event) =>
                        setNarrative((prev) =>
                          prev
                            ? { ...prev, [prompt.key]: event.target.value }
                            : prev,
                        )
                      }
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">
                      {narrative[prompt.key] || "—"}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activities">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  Visits in period ({linkedActivities.visits})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/visits">Open visits</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  Sensitization ({linkedActivities.sensitizations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {linkedActivities.sensitizations.length === 0 ? (
                  <p className="text-foreground-secondary">None this period.</p>
                ) : (
                  linkedActivities.sensitizations.map((item) => (
                    <Link
                      key={item.id}
                      href={`/sensitization/${item.id}`}
                      className="block text-primary-700 hover:underline dark:text-primary-300"
                    >
                      {item.date} · {item.venue} · {item.peopleReached} reached
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  Training ({linkedActivities.trainings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {linkedActivities.trainings.length === 0 ? (
                  <p className="text-foreground-secondary">None this period.</p>
                ) : (
                  linkedActivities.trainings.map((item) => (
                    <Link
                      key={item.id}
                      href={`/training/${item.id}`}
                      className="block text-primary-700 hover:underline dark:text-primary-300"
                    >
                      {item.date} · {item.topic} · {item.agentsTrained} agents
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  Meetings ({linkedActivities.meetings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {linkedActivities.meetings.length === 0 ? (
                  <p className="text-foreground-secondary">None this period.</p>
                ) : (
                  linkedActivities.meetings.map((item) => (
                    <Link
                      key={item.id}
                      href={`/meetings/${item.id}`}
                      className="block text-primary-700 hover:underline dark:text-primary-300"
                    >
                      {item.date} · {item.meetingType} · {item.location}
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Open action items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {linkedActivities.actionItems.length === 0 ? (
                  <p className="text-foreground-secondary">No linked actions.</p>
                ) : (
                  linkedActivities.actionItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 last:border-0"
                    >
                      <span>{item.title}</span>
                      <span className="text-xs text-foreground-secondary">
                        {item.status} · due {item.dueDate}
                      </span>
                    </div>
                  ))
                )}
                <Button asChild variant="secondary" size="sm">
                  <Link href="/action-items">Open action board</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Submission history</CardTitle>
            </CardHeader>
            <CardContent>
              {workspace.historyEnriched.length === 0 ? (
                <p className="text-sm text-foreground-secondary">
                  No history yet.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {workspace.historyEnriched.map((event) => (
                    <div key={event.id} className="py-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge
                          label={event.action.replace("_", " ")}
                          tone="info"
                          showIcon={false}
                        />
                        <span className="font-medium">{event.byName}</span>
                        <span className="text-xs text-foreground-secondary">
                          {format(new Date(event.at), "dd MMM yyyy HH:mm")}
                        </span>
                        <StatusBadge
                          label={reportStatusLabel(event.status)}
                          tone={reportStatusTone(event.status)}
                          showIcon={false}
                        />
                      </div>
                      {event.notes ? (
                        <p className="mt-1 text-foreground-secondary">
                          {event.notes}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={changesOpen} onOpenChange={setChangesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request changes</DialogTitle>
            <DialogDescription>
              Send this report back to the coordinator with clear revision
              notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="review-notes">Notes for TC</Label>
            <Textarea
              id="review-notes"
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.target.value)}
              placeholder="What needs to change before resubmit?"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setChangesOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!reviewNotes.trim() || saving}
              onClick={() => void handleRequestChanges()}
            >
              {saving ? "Sending…" : "Send back"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
