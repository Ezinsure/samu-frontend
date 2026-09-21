"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { canAccessPath } from "@/lib/api";
import { homePathForRole } from "@/lib/auth/session";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?next=${next}`);
    }
  }, [isLoading, user, router, pathname]);

  useEffect(() => {
    if (!isLoading && user?.role === "AGENT" && pathname === "/dashboard") {
      router.replace("/agent");
    }
  }, [isLoading, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!canAccessPath(user.role, pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-lg">
          <PermissionDenied
            action={
              <Button asChild>
                <Link href={homePathForRole(user.role)}>Go to home</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
