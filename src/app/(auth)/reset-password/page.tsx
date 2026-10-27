import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResetPasswordRoute() {
  // `useSearchParams` in the form needs a Suspense boundary.
  return (
    <Suspense
      fallback={<Skeleton className="h-[360px] w-full rounded-[var(--radius-lg)]" />}
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
