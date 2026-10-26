"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavGroupsForRole, type AppRole } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AppSidebarProps {
  role: AppRole;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  className?: string;
  onNavigate?: () => void;
  showCollapseControl?: boolean;
}

export function AppSidebar({
  role,
  collapsed,
  onCollapsedChange,
  className,
  onNavigate,
  showCollapseControl = true,
}: AppSidebarProps) {
  const pathname = usePathname();
  const groups = getNavGroupsForRole(role);

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-[var(--sidebar-collapsed-width)]" : "w-[var(--sidebar-width)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-white/10 px-3",
          collapsed ? "justify-center" : "gap-2",
        )}
      >
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={cn(
            "flex min-w-0 cursor-pointer items-center gap-2.5",
            collapsed && "justify-center",
          )}
          aria-label="SAMU home"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-600 text-sm font-bold text-foreground-on-primary">
            S
          </span>
          {!collapsed ? (
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold tracking-tight">
                SAMU
              </span>
              <span className="block truncate text-[10px] text-sidebar-muted">
                Community Opportunity
              </span>
            </span>
          ) : null}
        </Link>
        {showCollapseControl && !collapsed ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="ml-auto hidden text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-foreground lg:inline-flex"
            onClick={() => onCollapsedChange(true)}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {showCollapseControl && collapsed ? (
        <div className="flex justify-center border-b border-white/10 py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="hidden text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-foreground lg:inline-flex"
            onClick={() => onCollapsedChange(false)}
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <TooltipProvider delayDuration={0}>
        <nav className="flex-1 space-y-4 overflow-y-auto p-2">
          {groups.map((group) => (
            <div key={group.id} className="space-y-0.5">
              {!collapsed ? (
                <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
                  {group.label}
                </p>
              ) : null}
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
                      collapsed && "justify-center px-2",
                      active
                        ? "bg-sidebar-active-bg text-sidebar-active"
                        : "text-sidebar-muted hover:bg-white/10 hover:text-sidebar-foreground",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    {!collapsed ? (
                      <span className="truncate">{item.title}</span>
                    ) : null}
                  </Link>
                );

                if (!collapsed) return link;

                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </nav>
      </TooltipProvider>
    </aside>
  );
}
