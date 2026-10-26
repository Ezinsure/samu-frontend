"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canReviewFraud,
  fraudStatusLabel,
  fraudStatusTone,
  severityTone,
  type FraudDetail,
  type FraudReviewAction,
} from "@/lib/api";
import {
  FraudEvidenceCard,
  FraudFlagCard,
  FraudGpsCard,
} from "./fraud-detail-cards";
import { FraudReviewDialog } from "./fraud-review-dialog";
import { FraudReviewHistory } from "./fraud-review-history";

interface FraudDetailViewProps {
  detail: FraudDetail;
  /** Refetch the flag after an escalation (it stays open). */
  onChanged: () => void;
}

/** Flag overview, evidence, review actions and history. */
export function FraudDetailView({ detail, onChanged }: FraudDetailViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [action, setAction] = useState<FraudReviewAction | null>(null);

  const canReview = canReviewFraud(user);
  // Policy (also enforced by the API): nobody reviews flags on their own visit.
  const isOwnVisit = Boolean(user && detail.tcUserId === user.userId);
  const isOpen = detail.status === "open" || detail.status === "escalated";
  const canAct = canReview && !isOwnVisit && isOpen;

  function handleReviewed(done: FraudReviewAction) {
    setAction(null);
    // Accepted / dismissed flags leave the queue; escalated ones stay open.
    if (done === "escalate") onChanged();
    else router.push("/fraud");
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="secondary" size="sm" className="w-fit">
        <Link href="/fraud">
          <ArrowLeft className="h-4 w-4" />
          Fraud queue
        </Link>
      </Button>

      <PageHeader
        title={detail.type}
        description={`Detected ${format(new Date(detail.detectedAt), "dd MMM yyyy HH:mm")} · Visit ${detail.visitId}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              label={detail.severity}
              tone={severityTone(detail.severity)}
            />
            <StatusBadge
              label={fraudStatusLabel(detail.status)}
              tone={fraudStatusTone(detail.status)}
            />
          </div>
        }
      />

      {isOwnVisit && canReview ? (
        <div className="rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          You submitted this visit. Policy blocks reviewing your own fraud flags.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <FraudFlagCard detail={detail} />
        <div className="space-y-4">
          <FraudGpsCard detail={detail} />
          <FraudEvidenceCard visitId={detail.visitId} />
        </div>
      </div>

      {canAct ? (
        <Card>
          <CardHeader>
            <CardTitle>Review actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => setAction("accept")}>
              <CheckCircle2 className="h-4 w-4" />
              Accept visit
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAction("escalate")}
            >
              <ShieldAlert className="h-4 w-4" />
              Escalate
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAction("dismiss")}
            >
              <XCircle className="h-4 w-4" />
              Dismiss
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <FraudReviewHistory detail={detail} />

      {action ? (
        <FraudReviewDialog
          flagId={detail.id}
          action={action}
          onClose={() => setAction(null)}
          onReviewed={handleReviewed}
        />
      ) : null}
    </div>
  );
}
