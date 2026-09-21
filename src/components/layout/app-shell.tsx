"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { MAIN_NAV } from "@/lib/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const SIDEBAR_STORAGE_KEY = "samu.sidebar.collapsed";

function titleFromPath(pathname: string) {
  const match = MAIN_NAV.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (match) return match.title;
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/agent")) return "Agent portal";
  return "SAMU";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function handleCollapsedChange(next: boolean) {
    setCollapsed(next);
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Skeleton className="h-40 w-full max-w-md" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full bg-background">
      <div className="relative hidden lg:block">
        <div className="sticky top-0 h-screen">
          <AppSidebar
            role={user.role}
            collapsed={collapsed}
            onCollapsedChange={handleCollapsedChange}
          />
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[min(100%,288px)] p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <AppSidebar
            role={user.role}
            collapsed={false}
            onCollapsedChange={() => undefined}
            className="w-full"
            onNavigate={() => setMobileOpen(false)}
            showCollapseControl={false}
          />
        </SheetContent>
      </Sheet>

      <div className={cn("flex min-h-full min-w-0 flex-1 flex-col")}>
        <AppTopbar
          title={titleFromPath(pathname)}
          userName={user.name}
          userEmail={user.email}
          roleLabel={user.roleLabel}
          role={user.role}
          avatarInitials={user.avatarInitials}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
