"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { VisitCaptureWizard } from "@/features/visits/visit-capture-wizard";

export default function NewVisitPage() {
  // `useSearchParams` (agentId prefill) needs a Suspense boundary.
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <VisitCaptureWizard />
    </Suspense>
  );
}
