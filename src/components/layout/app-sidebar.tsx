"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Lock, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getNavGroupsForRole,
  isNavHrefActive,
  isNavItemLocked,
  type AppRole,
  type NavGroup,
} from "@/lib/navigation";
import { UserAvatar } from "@/components/shared/user-avatar";
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
  userName?: string;
  userEmail?: string;
  avatarInitials?: string;
  avatarUrl?: string | null;
}

export function AppSidebar({
  role,
  collapsed,
  onCollapsedChange,
  className,
  onNavigate,
  showCollapseControl = true,
  userName,
  userEmail,
  avatarInitials,
  avatarUrl,
}: AppSidebarProps) {
  const pathname = usePathname();
  const groups = getNavGroupsForRole(role);
  /** Explicit overrides only; missing keys fall back to `defaultCollapsed`. */
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});

  function isGroupCollapsed(group: NavGroup) {
    if (!group.collapsible || collapsed) return false;
    if (group.id in collapsedGroups) return collapsedGroups[group.id];
    return Boolean(group.defaultCollapsed);
  }

  function toggleGroup(group: NavGroup) {
    setCollapsedGroups((prev) => {
      const currentlyCollapsed =
        group.id in prev
          ? prev[group.id]
          : Boolean(group.defaultCollapsed);
      return { ...prev, [group.id]: !currentlyCollapsed };
    });
  }

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
                Agent Network
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
          {groups.map((group) => {
            const groupCollapsed = isGroupCollapsed(group);

            return (
              <div key={group.id} className="space-y-0.5">
                {!collapsed ? (
                  group.collapsible ? (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group)}
                      className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] px-3 pb-1 pt-1 text-left text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground"
                      aria-expanded={!groupCollapsed}
                    >
                      <span>{group.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-transform",
                          groupCollapsed && "-rotate-90",
                        )}
                        aria-hidden
                      />
                    </button>
                  ) : (
                    <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
                      {group.label}
                    </p>
                  )
                ) : null}

                {groupCollapsed
                  ? null
                  : group.items.map((item) => {
                      const locked = isNavItemLocked(item, role);
                      const active =
                        !locked && isNavHrefActive(pathname, item.href);
                      const Icon = item.icon;
                      const classNameNav = cn(
                        "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
                        collapsed && "justify-center px-2",
                        locked
                          ? "cursor-not-allowed text-sidebar-muted/50"
                          : active
                            ? "cursor-pointer bg-sidebar-active-bg text-sidebar-active"
                            : "cursor-pointer text-sidebar-muted hover:bg-white/10 hover:text-sidebar-foreground",
                      );

                      const content = (
                        <>
                          <Icon className="h-5 w-5 shrink-0" aria-hidden />
                          {!collapsed ? (
                            <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
                              <span className="truncate">{item.title}</span>
                              {locked ? (
                                <Lock
                                  className="h-3 w-3 shrink-0 opacity-70"
                                  aria-hidden
                                />
                              ) : null}
                            </span>
                          ) : null}
                        </>
                      );

                      const node = locked ? (
                        <button
                          key={item.href}
                          type="button"
                          disabled
                          className={classNameNav}
                          aria-disabled="true"
                          title={item.lockedReason ?? "Coming soon"}
                        >
                          {content}
                        </button>
                      ) : (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onNavigate}
                          className={classNameNav}
                          aria-current={active ? "page" : undefined}
                        >
                          {content}
                        </Link>
                      );

                      if (!collapsed && !locked) return node;

                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{node}</TooltipTrigger>
                          <TooltipContent side="right">
                            {locked
                              ? (item.lockedReason ?? `${item.title} — locked`)
                              : item.title}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
              </div>
            );
          })}
        </nav>
      </TooltipProvider>

      {userName ? (
        <div className="border-t border-white/10 p-2">
          <Link
            href="/profile"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2 text-sm transition-colors hover:bg-white/10",
              collapsed && "justify-center px-1",
            )}
            title="Open profile"
          >
            <UserAvatar
              name={userName}
              avatarUrl={avatarUrl}
              avatarInitials={avatarInitials}
              className="h-8 w-8"
              fallbackClassName="bg-white/15 text-sidebar-foreground"
            />
            {!collapsed ? (
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-sidebar-foreground">
                  {userName}
                </span>
                {userEmail ? (
                  <span className="block truncate text-[11px] text-sidebar-muted">
                    {userEmail}
                  </span>
                ) : null}
              </span>
            ) : null}
          </Link>
        </div>
      ) : null}
    </aside>
  );
}
