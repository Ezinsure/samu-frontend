"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { RecordGate } from "@/features/coap/record-states";
import {
  VisitGpsCard,
  VisitSmsCard,
  VisitSummaryCard,
} from "@/features/visits/visit-detail-cards";
import {
  VisitChecklistCard,
  VisitEvidenceCard,
  VisitFraudCard,
} from "@/features/visits/visit-evidence-cards";
import { getVisitDetail } from "@/lib/api";
import { useUserData } from "@/lib/hooks/use-user-data";
import {
  confirmationLabel,
  confirmationTone,
  validationLabel,
  validationTone,
} from "@/lib/visits/presentation";

export default function VisitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const state = useUserData(() => getVisitDetail(id), `visit:${id}`);

  return (
    <RecordGate state={state} notFoundTitle="Visit not found" backHref="/visits">
      {(detail) => (
        <div className="space-y-6">
          <Button asChild variant="secondary" size="sm">
            <Link href="/visits">
              <ArrowLeft className="h-4 w-4" />
              Visits
            </Link>
          </Button>

          <PageHeader
            title={detail.agentName}
            description={`${detail.purpose} · ${format(new Date(detail.startedAt), "dd MMM yyyy HH:mm")} · ${detail.durationMinutes} min`}
            actions={
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  label={validationLabel(detail.validation)}
                  tone={validationTone(detail.validation)}
                />
                <StatusBadge
                  label={confirmationLabel(detail.confirmationStatus)}
                  tone={confirmationTone(detail.confirmationStatus)}
                />
              </div>
            }
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <VisitSummaryCard detail={detail} />
            <div className="space-y-4">
              <VisitGpsCard detail={detail} />
              <VisitSmsCard detail={detail} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <VisitEvidenceCard detail={detail} />
            <VisitChecklistCard detail={detail} />
          </div>

          <VisitFraudCard detail={detail} />
        </div>
      )}
    </RecordGate>
  );
}
