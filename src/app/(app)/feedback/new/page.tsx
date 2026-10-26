"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canManageCoap,
  createCommunityFeedback,
  getCoapFilterOptions,
} from "@/lib/api";
import { ServiceSelect } from "@/features/coap/service-select";
import { FEEDBACK_KIND_LABELS } from "@/lib/coap/catalog";
import type {
  FeedbackKind,
  FeedbackSeverity,
  FeedbackStatus,
  ServiceLine,
} from "@/types";

export default function NewFeedbackPage() {
  const { user } = useAuth();
  const router = useRouter();
  const canWrite = canManageCoap(user) && user?.role !== "MD_VIEWER";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<FeedbackKind>("need");
  const [severity, setSeverity] = useState<FeedbackSeverity>("medium");
  const [status, setStatus] = useState<FeedbackStatus>("open");
  const [serviceLine, setServiceLine] = useState<ServiceLine | "all">("all");
  const [province, setProvince] = useState("Kigali City");
  const [district, setDistrict] = useState("Gasabo");
  const [sector, setSector] = useState("Remera");
  const [options, setOptions] = useState<{
    provinces: string[];
    districts: string[];
    sectors: string[];
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getCoapFilterOptions(user).then(setOptions);
  }, [user]);

  if (!canWrite) {
    return (
      <div className="space-y-4">
        <PageHeader title="Log feedback" description="Read-only access." />
        <Button asChild variant="secondary">
          <Link href="/feedback">Back</Link>
        </Button>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    setSaving(true);
    try {
      const row = await createCommunityFeedback(
        {
          title: title.trim(),
          description: description.trim(),
          kind,
          severity,
          status,
          serviceLine: serviceLine === "all" ? undefined : serviceLine,
          geo: { province, district, sector },
        },
        user,
      );
      toast.success("Feedback logged");
      router.push(`/feedback/${row.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save feedback",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log community feedback"
        description="Report a need, challenge, or opportunity from your territory."
      />
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Feedback</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kind</Label>
              <Select
                value={kind}
                onValueChange={(value) => setKind(value as FeedbackKind)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FEEDBACK_KIND_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Severity</Label>
              <Select
                value={severity}
                onValueChange={(value) =>
                  setSeverity(value as FeedbackSeverity)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Related service (optional)</Label>
              <ServiceSelect
                value={serviceLine}
                onChange={setServiceLine}
                allowAll
              />
            </div>
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
              <Label>District</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(options?.districts ?? [district]).map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sector</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(options?.sectors ?? [sector]).map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button asChild type="button" variant="secondary">
            <Link href="/feedback">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save feedback"}
          </Button>
        </div>
      </form>
    </div>
  );
}
