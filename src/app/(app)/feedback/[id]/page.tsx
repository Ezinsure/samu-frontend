"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canManageCoap,
  feedbackSeverityTone,
  feedbackStatusTone,
  getFeedbackById,
  updateCommunityFeedback,
  type FeedbackListItem,
} from "@/lib/api";
import {
  FEEDBACK_KIND_LABELS,
  serviceLineLabel,
} from "@/lib/coap/catalog";
import type { FeedbackStatus } from "@/types";

export default function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canWrite = canManageCoap(user) && user?.role !== "MD_VIEWER";
  const [item, setItem] = useState<FeedbackListItem | null | undefined>(
    undefined,
  );
  const [status, setStatus] = useState<FeedbackStatus>("open");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void getFeedbackById(id, user).then((result) => {
      if (!active) return;
      setItem(result);
      if (result) {
        setStatus(result.status);
        setResolutionNotes(result.resolutionNotes ?? "");
      }
    });
    return () => {
      active = false;
    };
  }, [id, user]);

  if (item === undefined) return <Skeleton className="h-64 w-full" />;
  if (!item) {
    return (
      <div className="space-y-4">
        <PageHeader title="Feedback not found" />
        <Button asChild variant="secondary">
          <Link href="/feedback">Back</Link>
        </Button>
      </div>
    );
  }

  async function save() {
    if (!item) return;
    setSaving(true);
    try {
      const updated = await updateCommunityFeedback(
        item.id,
        {
          serviceLine: item.serviceLine,
          kind: item.kind,
          severity: item.severity,
          status,
          title: item.title,
          description: item.description,
          geo: item.geo,
          leadId: item.leadId,
          resolutionNotes: resolutionNotes.trim() || undefined,
        },
        user,
      );
      setItem({ ...updated, tcName: item.tcName });
      toast.success("Feedback updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update feedback",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.title}
        description={`${FEEDBACK_KIND_LABELS[item.kind]}${
          item.serviceLine ? ` · ${serviceLineLabel(item.serviceLine)}` : ""
        }`}
        actions={
          <Button asChild variant="secondary">
            <Link href="/feedback">All feedback</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <StatusBadge
          label={item.severity}
          tone={feedbackSeverityTone(item.severity)}
        />
        <StatusBadge
          label={item.status}
          tone={feedbackStatusTone(item.status)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-foreground">{item.description}</p>
            <p className="text-foreground-secondary">
              {item.geo.province} · {item.geo.district} · {item.geo.sector}
            </p>
            <p className="text-foreground-secondary">
              Logged by {item.tcName}
            </p>
          </CardContent>
        </Card>

        {canWrite ? (
          <Card>
            <CardHeader>
              <CardTitle>Update status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as FeedbackStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="resolution">Resolution notes</Label>
                <Textarea
                  id="resolution"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <Button type="button" onClick={() => void save()} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
