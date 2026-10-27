import { format, formatDistanceToNow } from "date-fns";
import {
  Ban,
  KeyRound,
  Mail,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import type { DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { roleLabelFor } from "@/lib/auth/session";
import {
  userStatusLabel,
  userStatusTone,
  type ManagedUser,
} from "@/lib/api/users";
import type { UserAction } from "./types";

function RowMenu({
  user,
  isSelf,
  onAction,
}: {
  user: ManagedUser;
  isSelf: boolean;
  onAction: (action: UserAction, user: ManagedUser) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${user.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onAction("edit", user)}>
          <Pencil className="h-4 w-4" /> Edit details
        </DropdownMenuItem>
        {user.status === "active" ? (
          <DropdownMenuItem onSelect={() => onAction("reset", user)}>
            <Mail className="h-4 w-4" /> Send reset link
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onSelect={() => onAction("password", user)}>
          <KeyRound className="h-4 w-4" /> Set password
        </DropdownMenuItem>
        {/* Admins cannot lock out or delete their own account. */}
        {!isSelf ? (
          <>
            <DropdownMenuSeparator />
            {user.status === "active" ? (
              <DropdownMenuItem onSelect={() => onAction("deactivate", user)}>
                <Ban className="h-4 w-4" /> Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => onAction("activate", user)}>
                <RotateCcw className="h-4 w-4" />
                {user.status === "pending" ? "Approve account" : "Reactivate"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-danger focus:text-danger"
              onSelect={() => onAction("delete", user)}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Columns for the admin users table. */
export function buildUserColumns(
  currentUserId: string | undefined,
  onAction: (action: UserAction, user: ManagedUser) => void,
): DataTableColumn<ManagedUser>[] {
  return [
    {
      id: "user",
      header: "User",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
            {row.avatarInitials ?? row.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">
              {row.name}
              {row.id === currentUserId ? (
                <span className="ml-2 text-xs text-foreground-secondary">(you)</span>
              ) : null}
            </p>
            <p className="truncate text-xs text-foreground-secondary">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      cell: (row) => (
        <StatusBadge label={roleLabelFor(row.role)} tone="info" showIcon={false} />
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge
          label={userStatusLabel(row.status)}
          tone={userStatusTone(row.status)}
          showIcon={false}
        />
      ),
    },
    {
      id: "agent",
      header: "Linked agent",
      cell: (row) => row.agentName ?? "—",
    },
    {
      id: "lastLogin",
      header: "Last sign-in",
      cell: (row) =>
        row.lastLoginAt ? (
          <span title={format(new Date(row.lastLoginAt), "dd MMM yyyy HH:mm")}>
            {formatDistanceToNow(new Date(row.lastLoginAt), { addSuffix: true })}
          </span>
        ) : (
          <span className="text-foreground-secondary">Never</span>
        ),
    },
    {
      id: "actions",
      header: "",
      align: "right",
      cell: (row) => (
        <RowMenu user={row} isSelf={row.id === currentUserId} onAction={onAction} />
      ),
    },
  ];
}
