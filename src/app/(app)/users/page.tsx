"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { FilterBar } from "@/components/shared/filter-bar";
import { FilterSelect } from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { Button } from "@/components/ui/button";
import { CoapListTable } from "@/features/coap/coap-list-table";
import type { UserDialogState } from "@/features/users/types";
import { buildUserColumns } from "@/features/users/user-columns";
import { UserDialogs } from "@/features/users/user-dialogs";
import {
  USER_ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
  canManageUsers,
  getUsers,
  type UserStatus,
} from "@/lib/api/users";
import { useAuth } from "@/lib/auth/auth-context";
import { filterValue, useListFilters } from "@/lib/hooks/use-list-filters";
import { useUserData } from "@/lib/hooks/use-user-data";
import type { AppRole } from "@/types";

const PAGE_SIZE = 10;

export default function UsersPage() {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [dialog, setDialog] = useState<UserDialogState | null>(null);

  const { filters, applied, key, setFilters, setPage } = useListFilters({
    search: "",
    role: "all",
    status: "all",
  });

  const state = useUserData(
    () =>
      getUsers({
        page: applied.page,
        pageSize: PAGE_SIZE,
        search: applied.search,
        role: filterValue<AppRole>(applied.role),
        status: filterValue<UserStatus>(applied.status),
      }),
    `users:${key}`,
  );

  const columns = useMemo(
    () =>
      buildUserColumns(user?.userId, (action, target) =>
        setDialog({ action, user: target }),
      ),
    [user?.userId],
  );

  if (user && !canManageUsers(user)) return <PermissionDenied />;

  const closeDialogs = () => {
    setCreating(false);
    setDialog(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & access"
        description="Create accounts, assign roles, and deactivate access when someone leaves."
        actions={
          <Button type="button" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            New user
          </Button>
        }
      />

      <FilterBar
        searchPlaceholder="Search name, email or phone…"
        searchValue={filters.search}
        onSearchChange={(search) => setFilters({ search })}
        filters={
          <>
            <FilterSelect
              value={filters.role}
              onChange={(role) => setFilters({ role })}
              placeholder="Role"
              allLabel="All roles"
              options={USER_ROLE_OPTIONS}
              widthClass="w-[210px]"
            />
            <FilterSelect
              value={filters.status}
              onChange={(status) => setFilters({ status })}
              placeholder="Status"
              allLabel="All statuses"
              options={USER_STATUS_OPTIONS}
              widthClass="w-[180px]"
            />
          </>
        }
      />

      <CoapListTable
        state={state}
        columns={columns}
        page={filters.page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No users found"
        emptyDescription="Adjust the filters or create a new user."
      />

      <UserDialogs
        dialog={dialog}
        creating={creating}
        onClose={closeDialogs}
        onChanged={state.reload}
      />
    </div>
  );
}
