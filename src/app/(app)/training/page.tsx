"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { apiRequest } from "@/lib/http/client";

interface GapsPayload {
  session: { id: string; title: string | null; sessionDate: string } | null;
  attended: Array<{ id: string; name: string; code: string; email?: string | null }>;
  missing: Array<{ id: string; name: string; code: string; email?: string | null }>;
}

export default function TrainingPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [title, setTitle] = useState("");
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [emailsText, setEmailsText] = useState("");
  const [gaps, setGaps] = useState<GapsPayload | null>(null);

  const loadGaps = useCallback(async () => {
    const data = await apiRequest<GapsPayload>("/training/attendance/gaps");
    setGaps(data);
  }, []);

  useEffect(() => {
    void loadGaps().catch(() => undefined);
  }, [loadGaps]);

  async function onUpload(event: React.FormEvent) {
    event.preventDefault();
    const emails = emailsText
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    try {
      const result = await apiRequest<{
        matchedAgents: number;
        unmatchedEmails: string[];
      }>("/training/attendance/upload", {
        method: "POST",
        body: { title: title || undefined, sessionDate, emails },
      });
      toast.success(
        `Uploaded — matched ${result.matchedAgents}, unmatched ${result.unmatchedEmails.length}`,
      );
      await loadGaps();
    } catch (error) {
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training attendance"
        description="Upload emails from the Google attendance form. Territory Coordinators see who attended and who is missing."
      />

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload attendance emails</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={onUpload}>
              <div className="space-y-1.5">
                <Label>Session title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Session date</Label>
                <Input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Emails (one per line)</Label>
                <Textarea
                  rows={6}
                  value={emailsText}
                  onChange={(e) => setEmailsText(e.target.value)}
                  required
                />
              </div>
              <Button type="submit">Upload</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Coverage
            {gaps?.session
              ? ` — ${gaps.session.sessionDate}${gaps.session.title ? ` · ${gaps.session.title}` : ""}`
              : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-success">
              Attended ({gaps?.attended.length ?? 0})
            </p>
            <ul className="space-y-1 text-sm">
              {(gaps?.attended ?? []).map((a) => (
                <li key={a.id}>
                  {a.name} · {a.code}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-danger">
              Missing ({gaps?.missing.length ?? 0})
            </p>
            <ul className="space-y-1 text-sm">
              {(gaps?.missing ?? []).map((a) => (
                <li key={a.id}>
                  {a.name} · {a.code}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
