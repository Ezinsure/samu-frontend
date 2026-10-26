"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CalendarClock, RefreshCw, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth/auth-context";
import {
  SCORABLE_STATUSES,
  canReviewReport,
  ensureScorecardForReport,
  refreshReportKpis,
  reportStatusLabel,
  reportStatusTone,
  saveMonthlyReportDraft,
  submitMonthlyReport,
  type MonthlyReportWorkspace,
} from "@/lib/api";
import type { MonthlyReportNarrative } from "@/types";
import { ReportAgentMapping } from "./report-agent-mapping";
import { ReportHistory } from "./report-history";
import { ReportKpiTable } from "./report-kpi-table";
import { ReportLinkedActivities } from "./report-linked-activities";
import { ReportNarrativeTab } from "./report-narrative-tab";
import { RequestChangesDialog } from "./request-changes-dialog";

interface ReportDetailViewProps {
  workspace: MonthlyReportWorkspace;
  /** Refetch the workspace (the view remounts with fresh server state). */
  onChanged: () => void;
}

/** Monthly report workspace: KPIs, mapping, narrative, activities, history. */
export function ReportDetailView({ workspace, onChanged }: ReportDetailViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { report, targets, linkedActivities, canEdit, canRequestChanges } =
    workspace;

  // Seeded from the server; the parent remounts this view after every reload.
  const [narrative, setNarrative] = useState<MonthlyReportNarrative>({
    ...report.narrative,
  });
  const [busy, setBusy] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);

  /** Persist the narrative first so refreshing / submitting never drops edits. */
  async function saveNarrative() {
    const result = await saveMonthlyReportDraft(report.id, { narrative });
    if (!result.ok) toast.error("Could not save draft", { description: result.error });
    return result.ok;
  }

  async function handleSave() {
    setBusy(true);
    const saved = await saveNarrative();
    setBusy(false);
    if (!saved) return;
    toast.success("Draft saved");
    onChanged();
  }

  async function handleRefreshKpis() {
    setBusy(true);
    if (!(await saveNarrative())) return setBusy(false);
    const result = await refreshReportKpis(report.id);
    setBusy(false);
    if (!result.ok) {
      toast.error("Could not refresh KPIs", { description: result.error });
      return;
    }
    toast.success("KPIs refreshed from activity records");
    onChanged();
  }

  async function handleSubmit() {
    setBusy(true);
    if (!(await saveNarrative())) return setBusy(false);
    const result = await submitMonthlyReport(report.id);
    setBusy(false);
    if (!result.ok) {
      toast.error("Could not submit report", { description: result.error });
      return;
    }
    toast.success(
      report.status === "changes_requested" ? "Report resubmitted" : "Report submitted",
      { description: "Head Office can now review this obligation." },
    );
    onChanged();
  }

  async function handleOpenScorecard() {
    setBusy(true);
    const result = await ensureScorecardForReport(report.id);
    setBusy(false);
    if (!result.ok) {
      toast.error("Could not open scorecard", { description: result.error });
      return;
    }
    router.push(`/scorecards/${result.data.id}`);
  }

  const canOpenScorecard =
    canReviewReport(user) && SCORABLE_STATUSES.includes(report.status);
  const deadline = format(new Date(report.deadline), "dd MMM yyyy");
  const dueMessage = report.overdue
    ? `Overdue — deadline was ${deadline} (due by the 5th).`
    : `Deadline ${deadline} · ${report.daysToDeadline} day(s) remaining (reports due by the 5th).`;

  return (
    <div className="space-y-6">
      <Button asChild variant="secondary" size="sm" className="w-fit">
        <Link href="/monthly-reports">
          <ArrowLeft className="h-4 w-4" />
          Monthly reports
        </Link>
      </Button>

      <PageHeader
        title={`${report.period} territory report`}
        description={`${report.tcName ?? "Coordinator"} · ${report.territorySnapshot.join(", ")}`}
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
                  disabled={busy}
                  onClick={() => void handleRefreshKpis()}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh KPIs
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void handleSave()}
                >
                  <Save className="h-4 w-4" />
                  Save draft
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleSubmit()}
                >
                  <Send className="h-4 w-4" />
                  {report.status === "changes_requested" ? "Resubmit" : "Submit"}
                </Button>
              </>
            ) : null}
            {canOpenScorecard ? (
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => void handleOpenScorecard()}
              >
                Open scorecard
              </Button>
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
            <p className="font-medium">{dueMessage}</p>
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
          <ReportKpiTable actuals={report.kpiActuals} targets={targets} />
        </TabsContent>
        <TabsContent value="mapping">
          <ReportAgentMapping agents={report.agentMappingSnapshot} />
        </TabsContent>
        <TabsContent value="narrative">
          <ReportNarrativeTab
            narrative={narrative}
            editable={canEdit}
            onChange={(key, value) =>
              setNarrative((current) => ({ ...current, [key]: value }))
            }
          />
        </TabsContent>
        <TabsContent value="activities">
          <ReportLinkedActivities linked={linkedActivities} />
        </TabsContent>
        <TabsContent value="history">
          <ReportHistory events={workspace.historyEnriched} />
        </TabsContent>
      </Tabs>

      {changesOpen ? (
        <RequestChangesDialog
          reportId={report.id}
          onClose={() => setChangesOpen(false)}
          onSent={() => {
            setChangesOpen(false);
            onChanged();
          }}
        />
      ) : null}
    </div>
  );
}
