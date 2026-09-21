"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/auth-context";
import {
  KPI_LABELS,
  calculateWeightedTotal,
  decisionTone,
  getScorecardWorkspace,
  saveScorecardDraft,
  submitScorecard,
  suggestDecision,
  type ScorecardWorkspace,
} from "@/lib/api";
import type { ScorecardCriterionScore, ScorecardDecision } from "@/types";

export default function ScorecardDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState<
    ScorecardWorkspace | null | undefined
  >(undefined);
  const [criteria, setCriteria] = useState<ScorecardCriterionScore[]>([]);
  const [overallComment, setOverallComment] = useState("");
  const [decision, setDecision] = useState<ScorecardDecision | "">("");
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    void getScorecardWorkspace(params.id, user).then((result) => {
      if (!active) return;
      setWorkspace(result);
      if (result) {
        setCriteria(result.scorecard.criteria.map((item) => ({ ...item })));
        setOverallComment(result.scorecard.overallComment);
        setDecision(result.scorecard.decision ?? "");
      }
    });
    return () => {
      active = false;
    };
  }, [params.id, user, refreshKey]);

  const liveTotal = useMemo(
    () => calculateWeightedTotal(criteria),
    [criteria],
  );
  const liveSuggestion = useMemo(
    () => suggestDecision(liveTotal),
    [liveTotal],
  );

  function updateCriterion(
    criterionId: string,
    patch: Partial<ScorecardCriterionScore>,
  ) {
    setCriteria((prev) =>
      prev.map((item) =>
        item.criterionId === criterionId ? { ...item, ...patch } : item,
      ),
    );
  }

  async function handleSave() {
    if (!user || !workspace) return;
    setSaving(true);
    const result = await saveScorecardDraft(
      workspace.scorecard.id,
      {
        criteria,
        overallComment,
        decision: decision || liveSuggestion,
      },
      user,
    );
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Draft saved", {
      description: `Weighted total ${result.weightedTotal.toFixed(2)} / 5`,
    });
    setRefreshKey((value) => value + 1);
  }

  async function handleSubmit() {
    if (!user || !workspace) return;
    setSaving(true);
    const saved = await saveScorecardDraft(
      workspace.scorecard.id,
      {
        criteria,
        overallComment,
        decision: decision || liveSuggestion,
      },
      user,
    );
    if (!saved.ok) {
      setSaving(false);
      toast.error(saved.error);
      return;
    }
    const result = await submitScorecard(workspace.scorecard.id, user);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Scorecard submitted", {
      description: "TC can now view the evaluation result.",
    });
    setRefreshKey((value) => value + 1);
  }

  if (workspace === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <EmptyState
        title="Scorecard not found"
        description="This evaluation does not exist, is still a draft (TC view), or you lack access."
        action={
          <Button asChild variant="secondary">
            <Link href="/scorecards">Back to scorecards</Link>
          </Button>
        }
      />
    );
  }

  const { scorecard, canEdit, decisionRanges, report, breakdown } = workspace;

  return (
    <div className="space-y-6">
      <Button asChild variant="secondary" size="sm">
        <Link href="/scorecards">
          <ArrowLeft className="h-4 w-4" />
          Scorecards
        </Link>
      </Button>

      <PageHeader
        title={`${scorecard.period} evaluation`}
        description={`${scorecard.tcName} · Template ${scorecard.templateVersion}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              label={scorecard.status === "draft" ? "Draft" : "Submitted"}
              tone={scorecard.status === "draft" ? "neutral" : "success"}
            />
            {canEdit ? (
              <>
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
                  Submit evaluation
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Weighted total</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-4xl font-bold tabular-nums tracking-tight">
              {(canEdit ? liveTotal : scorecard.weightedTotal).toFixed(2)}
              <span className="text-lg font-medium text-foreground-secondary">
                {" "}
                / 5
              </span>
            </p>
            <StatusBadge
              label={
                (canEdit ? decision || liveSuggestion : scorecard.decision) ??
                liveSuggestion
              }
              tone={decisionTone(
                (canEdit
                  ? decision || liveSuggestion
                  : scorecard.decision) as ScorecardDecision,
              )}
            />
            <div className="space-y-1 text-xs text-foreground-secondary">
              <p className="font-medium text-foreground">Decision ranges</p>
              {decisionRanges.map((range) => (
                <p key={range.decision}>
                  {range.description}: {range.decision}
                </p>
              ))}
            </div>
            {scorecard.evaluatorName ? (
              <p className="text-xs text-foreground-secondary">
                Evaluator: {scorecard.evaluatorName}
                {scorecard.submittedAt
                  ? ` · ${format(new Date(scorecard.submittedAt), "dd MMM yyyy")}`
                  : ""}
              </p>
            ) : null}
            {report ? (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/monthly-reports/${report.id}`}>
                  Open monthly report
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Report KPI snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            {!report ? (
              <p className="text-sm text-foreground-secondary">
                Linked report unavailable.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(report.kpiActuals).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm"
                  >
                    <span className="text-foreground-secondary">
                      {KPI_LABELS[key] ?? key}
                    </span>
                    <span className="font-medium tabular-nums">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criteria scores (1–5)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(canEdit ? criteria : breakdown).map((row) => {
            const criterionId =
              "criterionId" in row ? row.criterionId : row.id;
            const label =
              workspace.criteriaDefs.find((def) => def.id === criterionId)
                ?.label ?? criterionId;
            const weight =
              workspace.criteriaDefs.find((def) => def.id === criterionId)
                ?.weight ?? 0;
            const score =
              "score" in row ? row.score : (row as { score: number }).score;
            const comment =
              "comment" in row
                ? row.comment
                : (row as { comment: string }).comment;
            const weighted = Math.round(score * weight * 100) / 100;

            return (
              <div
                key={criterionId}
                className="grid gap-3 rounded-[var(--radius-md)] border border-border p-4 lg:grid-cols-[minmax(0,1.2fr)_100px_minmax(0,1.5fr)_90px]"
              >
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-foreground-secondary">
                    Weight {(weight * 100).toFixed(0)}%
                  </p>
                </div>
                {canEdit ? (
                  <div className="space-y-1">
                    <Label htmlFor={`score-${criterionId}`}>Score</Label>
                    <Input
                      id={`score-${criterionId}`}
                      type="number"
                      min={1}
                      max={5}
                      step={1}
                      value={score}
                      onChange={(event) =>
                        updateCriterion(criterionId, {
                          score: Math.min(
                            5,
                            Math.max(1, Number(event.target.value) || 1),
                          ),
                        })
                      }
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-foreground-secondary">Score</p>
                    <p className="text-lg font-semibold tabular-nums">{score}</p>
                  </div>
                )}
                {canEdit ? (
                  <div className="space-y-1">
                    <Label htmlFor={`comment-${criterionId}`}>Comment</Label>
                    <Textarea
                      id={`comment-${criterionId}`}
                      rows={2}
                      value={comment}
                      onChange={(event) =>
                        updateCriterion(criterionId, {
                          comment: event.target.value,
                        })
                      }
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-foreground-secondary">Comment</p>
                    <p className="text-sm">{comment || "—"}</p>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-xs text-foreground-secondary">Weighted</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {weighted.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overall comments</CardTitle>
          </CardHeader>
          <CardContent>
            {canEdit ? (
              <Textarea
                rows={5}
                value={overallComment}
                onChange={(event) => setOverallComment(event.target.value)}
                placeholder="Summary for the coordinator and leadership…"
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">
                {scorecard.overallComment || "—"}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {canEdit ? (
              <>
                <Select
                  value={decision || liveSuggestion}
                  onValueChange={(value) =>
                    setDecision(value as ScorecardDecision)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {decisionRanges.map((range) => (
                      <SelectItem key={range.decision} value={range.decision}>
                        {range.decision} ({range.description})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-foreground-secondary">
                  Suggested from live total: {liveSuggestion}
                </p>
              </>
            ) : (
              <StatusBadge
                label={scorecard.decision ?? "—"}
                tone={decisionTone(scorecard.decision)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
