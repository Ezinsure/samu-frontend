import { Suspense } from "react";
import LoginPage from "./login-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginRoute() {
  return (
    <Suspense
      fallback={<Skeleton className="h-[420px] w-full rounded-[var(--radius-lg)]" />}
    >
      <LoginPage />
    </Suspense>
  );
}
