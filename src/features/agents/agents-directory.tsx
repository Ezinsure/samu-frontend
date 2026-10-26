"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { ALL_VALUE } from "@/components/shared/filter-select";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageAgents, getAgentFilterOptions, getAgents } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
  AgentFilters,
  INITIAL_AGENT_FILTERS,
  type AgentListFilters,
} from "./agent-filters";
import { AgentsTable } from "./agents-table";

const PAGE_SIZE = 10;

/** Converts the UI sentinel `"all"` into "no filter" for the API. */
const orUndefined = (value: string) => (value === ALL_VALUE ? undefined : value);

/** Agent directory: server-side search, filters, and pagination. */
export function AgentsDirectory() {
  const { user } = useAuth();
  const canManage = canManageAgents(user);
  const isTc = user?.role === "TERRITORY_COORDINATOR";

  const [filters, setFilters] = useState(INITIAL_AGENT_FILTERS);
  const search = useDebouncedValue(filters.search);

  /** Any filter change returns to page 1; page changes keep the filters. */
  function updateFilters(patch: Partial<AgentListFilters>) {
    setFilters((current) => ({
      ...current,
      page: 1,
      ...patch,
    }));
  }

  const optionsState = useAsyncData(
    () => getAgentFilterOptions(),
    `agent-filters:${user?.userId}`,
    { enabled: Boolean(user) },
  );

  const requestKey = JSON.stringify({ ...filters, search, u: user?.userId });
  const agentsState = useAsyncData(
    () =>
      getAgents({
        page: filters.page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        province: orUndefined(filters.province),
        district: orUndefined(filters.district),
        status: orUndefined(filters.status),
        compliance: orUndefined(filters.compliance),
        tcUserId: orUndefined(filters.tcUserId),
        sortBy: "name",
      }),
    `agents:${requestKey}`,
    { enabled: Boolean(user) },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent network"
        description={
          isTc
            ? "Local agents who deliver COAP services in your territory."
            : "Agent network readiness across IREMBO, banking, internet, devices, insurance, and clean cooking."
        }
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                toast.info("Export is not available yet", {
                  description: "Agent directory export is planned for a later phase.",
                })
              }
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            {canManage ? (
              <Button asChild>
                <Link href="/agents/new">
                  <Plus className="h-4 w-4" />
                  New agent
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <FilterBar
        searchValue={filters.search}
        onSearchChange={(value) => updateFilters({ search: value })}
        searchPlaceholder="Search name, code, phone…"
        filters={
          optionsState.data ? (
            <AgentFilters
              filters={filters}
              options={optionsState.data}
              hideCoordinator={Boolean(isTc)}
              onChange={updateFilters}
            />
          ) : (
            <Skeleton className="h-11 w-40" />
          )
        }
      />

      {agentsState.error ? (
        <ErrorState
          title="Could not load agents"
          description={agentsState.error}
          onRetry={agentsState.reload}
        />
      ) : agentsState.loading || !agentsState.data ? (
        <Skeleton className="h-80 w-full" />
      ) : (
        <AgentsTable
          rows={agentsState.data.data}
          page={filters.page}
          pageSize={PAGE_SIZE}
          total={agentsState.data.total}
          onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
          showCoordinator={!isTc}
          canEdit={canManage}
        />
      )}
    </div>
  );
}
