"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/http/client";
import { reviewNetworkMember } from "@/lib/api/agents";
import { useAuth } from "@/lib/auth/auth-context";

interface InviteLink {
  id: string;
  token: string;
  url: string;
  active: boolean;
}

interface PendingRow {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string | null;
  district: string;
  createdAt: string;
}

export default function InviteLinksPage() {
  const { user } = useAuth();
  const [link, setLink] = useState<InviteLink | null>(null);
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mine, reviews] = await Promise.all([
        apiRequest<InviteLink>("/invite-links/me"),
        apiRequest<PendingRow[]>("/invite-links/pending-reviews"),
      ]);
      setLink(mine);
      setPending(reviews);
    } catch (error) {
      toast.error("Could not load invite links", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link.url);
    toast.success("Link copied");
  }

  async function onReview(id: string, action: "accept" | "reject") {
    const result = await reviewNetworkMember(id, action);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(action === "accept" ? "Accepted" : "Rejected");
    void load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invite links"
        description="Share your unique registration link. New agent candidates are attributed to you for review."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your registration link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-foreground-muted">Loading…</p>
          ) : (
            <>
              <p className="break-all rounded-md bg-muted px-3 py-2 text-sm">
                {link?.url}
              </p>
              <Button type="button" onClick={() => void copyLink()}>
                Copy link
              </Button>
              <p className="text-xs text-foreground-muted">
                Signed in as {user?.name}. Candidates who register with this link
                appear below for review.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm text-foreground-muted">No pending candidates.</p>
          ) : (
            pending.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-foreground-muted">
                    {row.code} · {row.phone} · {row.district}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void onReview(row.id, "reject")}
                  >
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => void onReview(row.id, "accept")}>
                    Accept
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
