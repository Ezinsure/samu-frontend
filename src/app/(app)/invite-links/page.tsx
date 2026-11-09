"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/http/client";
import { apiRequestList } from "@/lib/http/list";
import { reviewNetworkMember } from "@/lib/api/agents";
import { useAuth } from "@/lib/auth/auth-context";

const PAGE_SIZE = 10;

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
  age?: number | null;
  gender?: string | null;
  education?: string | null;
  tin?: string | null;
  businessType?: string | null;
  venue?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  criminalRecordBillId?: string | null;
  hasPrinterScanner?: boolean;
  hasComputer?: boolean;
  officeType?: string | null;
  building?: string | null;
  province?: string | null;
  district: string;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
  status?: string | null;
  createdAt: string;
  recruitedByName?: string | null;
  tcName?: string | null;
}

export default function InviteLinksPage() {
  const { user } = useAuth();
  const [link, setLink] = useState<InviteLink | null>(null);
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<PendingRow | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(async (nextPage = page) => {
    setLoading(true);
    try {
      const [mine, reviews] = await Promise.all([
        apiRequest<InviteLink>("/invite-links/me"),
        apiRequestList<PendingRow>("/invite-links/pending-reviews", {
          query: { page: nextPage, pageSize: PAGE_SIZE },
        }),
      ]);
      setLink(mine);
      setPending(reviews.data);
      setPage(reviews.page);
      setTotal(reviews.total);
      setTotalPages(reviews.totalPages);
    } catch (error) {
      toast.error("Could not load invite links", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load(1);
    // Initial load only — page changes call load explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link.url);
    toast.success("Link copied");
  }

  async function onReview(id: string, action: "accept" | "reject") {
    setReviewing(true);
    const result = await reviewNetworkMember(id, action);
    setReviewing(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(action === "accept" ? "Accepted" : "Rejected");
    setViewing(null);
    void load(page);
  }

  function goToPage(next: number) {
    setPage(next);
    void load(next);
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
          {loading && !link ? (
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
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Pending review</CardTitle>
          <p className="text-xs text-foreground-muted">
            {total} candidate{total === 1 ? "" : "s"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && pending.length === 0 ? (
            <p className="text-sm text-foreground-muted">Loading…</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              No pending candidates.
            </p>
          ) : (
            <>
              {pending.map((row) => (
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
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setViewing(row)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void onReview(row.id, "reject")}
                      disabled={reviewing}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void onReview(row.id, "accept")}
                      disabled={reviewing}
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              ))}

              {totalPages > 1 ? (
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <p className="text-xs text-foreground-secondary">
                    Page {page} of {totalPages} · {total} rows
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={page <= 1 || loading}
                      onClick={() => goToPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={page >= totalPages || loading}
                      onClick={() => goToPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          {viewing ? (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.name}</DialogTitle>
                <DialogDescription>
                  Agent candidate · {viewing.code}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <Detail label="Phone" value={viewing.phone} />
                <Detail label="Email" value={viewing.email} />
                <Detail label="Age" value={viewing.age} />
                <Detail label="Gender" value={viewing.gender} />
                <Detail label="Education" value={viewing.education} />
                <Detail label="TIN" value={viewing.tin} />
                <Detail label="Business type" value={viewing.businessType} />
                <Detail label="Venue" value={viewing.venue} />
                <Detail label="Province" value={viewing.province} />
                <Detail label="District" value={viewing.district} />
                <Detail label="Sector" value={viewing.sector} />
                <Detail label="Cell" value={viewing.cell} />
                <Detail label="Village" value={viewing.village} />
                <Detail label="Office" value={viewing.officeType} />
                <Detail label="Building" value={viewing.building} />
                <Detail
                  label="Printer + scanner"
                  value={viewing.hasPrinterScanner ? "Yes" : "No"}
                />
                <Detail
                  label="Computer"
                  value={viewing.hasComputer ? "Yes" : "No"}
                />
                <Detail
                  label="Emergency contact"
                  value={viewing.emergencyContactName}
                />
                <Detail
                  label="Emergency phone"
                  value={viewing.emergencyContactPhone}
                />
                <Detail
                  label="Criminal record Bill ID"
                  value={viewing.criminalRecordBillId}
                />
                <Detail
                  label="Submitted"
                  value={new Date(viewing.createdAt).toLocaleString()}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={reviewing}
                  onClick={() => void onReview(viewing.id, "reject")}
                >
                  Reject
                </Button>
                <Button
                  type="button"
                  disabled={reviewing}
                  onClick={() => void onReview(viewing.id, "accept")}
                >
                  Accept
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-foreground-muted">{label}</p>
      <p className="text-foreground">{value || "—"}</p>
    </div>
  );
}
