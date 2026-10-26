"use client";

import { useParams } from "next/navigation";
import { RecordGate } from "@/features/coap/record-states";
import { ReportDetailView } from "@/features/reports/report-detail-view";
import { getMonthlyReportWorkspace } from "@/lib/api";
import { useUserData } from "@/lib/hooks/use-user-data";

export default function MonthlyReportWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const state = useUserData(() => getMonthlyReportWorkspace(id), `report:${id}`);

  return (
    <RecordGate
      state={state}
      notFoundTitle="Report not found"
      backHref="/monthly-reports"
    >
      {(workspace) => (
        <ReportDetailView workspace={workspace} onChanged={state.reload} />
      )}
    </RecordGate>
  );
}
