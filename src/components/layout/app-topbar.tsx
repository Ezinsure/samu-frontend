"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, UserRound } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { AppRole } from "@/types";
import { useAuth } from "@/lib/auth/auth-context";

interface AppTopbarProps {
  title?: string;
  userName: string;
  userEmail: string;
  roleLabel: string;
  role: AppRole;
  avatarInitials?: string;
  onMenuClick?: () => void;
}

export function AppTopbar({
  title = "Overview",
  userName,
  userEmail,
  roleLabel,
  avatarInitials,
  onMenuClick,
}: AppTopbarProps) {
  const { logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    toast.success("Signed out");
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        <p className="hidden truncate text-xs text-foreground-secondary sm:block">
          Solektra Agent Monitoring Utility
        </p>
      </div>

      <Badge variant="secondary" className="hidden md:inline-flex">
        {roleLabel}
      </Badge>

      <ThemeToggle />

      <Button type="button" variant="ghost" size="icon" aria-label="Notifications">
        <Bell className="h-5 w-5" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-11 gap-2 px-2"
            aria-label="User menu"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback>{avatarInitials ?? userName.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[140px] truncate text-left text-sm font-medium md:inline">
              {userName}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{userName}</span>
              <span className="text-xs font-normal text-foreground-secondary">
                {userEmail}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <UserRound className="h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-danger focus:text-danger"
            onSelect={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
