"use client";

import { useParams } from "next/navigation";
import { FraudDetailView } from "@/features/fraud/fraud-detail-view";
import { RecordGate } from "@/features/coap/record-states";
import { getFraudDetail } from "@/lib/api";
import { useUserData } from "@/lib/hooks/use-user-data";

export default function FraudDetailPage() {
  const { id } = useParams<{ id: string }>();
  const state = useUserData(() => getFraudDetail(id), `fraud:${id}`);

  return (
    <RecordGate state={state} notFoundTitle="Flag not found" backHref="/fraud">
      {(detail) => <FraudDetailView detail={detail} onChanged={state.reload} />}
    </RecordGate>
  );
}
