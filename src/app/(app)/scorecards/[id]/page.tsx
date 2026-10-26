"use client";

import { useParams } from "next/navigation";
import { RecordGate } from "@/features/coap/record-states";
import { ScorecardDetailView } from "@/features/scorecards/scorecard-detail-view";
import { getScorecardWorkspace } from "@/lib/api";
import { useUserData } from "@/lib/hooks/use-user-data";

export default function ScorecardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const state = useUserData(() => getScorecardWorkspace(id), `scorecard:${id}`);

  return (
    <RecordGate
      state={state}
      notFoundTitle="Scorecard not found"
      backHref="/scorecards"
    >
      {(workspace) => (
        <ScorecardDetailView workspace={workspace} onChanged={state.reload} />
      )}
    </RecordGate>
  );
}
