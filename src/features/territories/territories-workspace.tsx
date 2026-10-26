"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { getTerritoryTree, getTerritoryWorkspace } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks/use-async-data";
import { AssignCoordinatorDialog } from "./assign-coordinator-dialog";
import { getDefaultTerritoryId, getDistrictStats } from "./territory-helpers";
import { TerritoryDetail } from "./territory-detail";
import { TerritoryStats } from "./territory-stats";
import { TerritoryTree } from "./territory-tree";

function WorkspaceSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Territories page: geography tree on the left, selected territory on the
 * right. All data comes from the API; TC users receive a scoped tree.
 */
export function TerritoriesWorkspace() {
  const { user } = useAuth();
  const userId = user?.userId;

  // User choices; `undefined` means "fall back to the sensible default".
  const [pickedId, setPickedId] = useState<string>();
  const [expandedOverride, setExpandedOverride] = useState<Set<string>>();
  // Bumped each time the dialog opens so its form state starts fresh.
  const [dialogSession, setDialogSession] = useState(0);
  const [assignOpen, setAssignOpen] = useState(false);

  const treeState = useAsyncData(() => getTerritoryTree(), `tree:${userId}`, {
    enabled: Boolean(userId),
  });
  const tree = useMemo(() => treeState.data?.tree ?? [], [treeState.data]);

  const selectedId = pickedId ?? getDefaultTerritoryId(tree);
  const expanded = useMemo(
    () => expandedOverride ?? new Set(tree.map((node) => node.id)),
    [expandedOverride, tree],
  );
  const stats = useMemo(() => getDistrictStats(tree), [tree]);

  const workspaceState = useAsyncData(
    () => getTerritoryWorkspace(selectedId as string),
    `workspace:${userId}:${selectedId}`,
    { enabled: Boolean(selectedId) },
  );

  function toggleExpanded(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedOverride(next);
  }

  function selectTerritory(id: string) {
    setPickedId(id);
    // Make sure drilling down from the "Children" tab reveals the node.
    setExpandedOverride(new Set(expanded).add(id));
  }

  function openAssignDialog() {
    setDialogSession((value) => value + 1);
    setAssignOpen(true);
  }

  function handleAssigned() {
    // Both the tree (TC names, counts) and the workspace change.
    treeState.reload();
    workspaceState.reload();
  }

  const workspace = workspaceState.data;
  const canManage = treeState.data?.canManage ?? false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Territories"
        description="Province → district → sector → cell hierarchy and territory coordinator assignments."
      />

      {treeState.error ? (
        <ErrorState
          title="Could not load territories"
          description={treeState.error}
          onRetry={treeState.reload}
        />
      ) : (
        <>
          <TerritoryStats stats={stats} loading={treeState.loading} />

          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <TerritoryTree
              tree={tree}
              loading={treeState.loading}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={toggleExpanded}
              onSelect={selectTerritory}
            />

            <div className="min-w-0 space-y-4">
              {treeState.loading || workspaceState.loading ? (
                <WorkspaceSkeleton />
              ) : workspaceState.error ? (
                <ErrorState
                  title="Could not load this territory"
                  description={workspaceState.error}
                  onRetry={workspaceState.reload}
                />
              ) : !workspace ? (
                <EmptyState
                  title="Select a territory"
                  description="Choose a province, district, sector, or cell from the tree."
                />
              ) : (
                <TerritoryDetail
                  workspace={workspace}
                  canAssign={canManage}
                  onAssignClick={openAssignDialog}
                  onSelectTerritory={selectTerritory}
                />
              )}
            </div>
          </div>

          {workspace && canManage ? (
            <AssignCoordinatorDialog
              key={`${workspace.territory.id}-${dialogSession}`}
              open={assignOpen}
              onOpenChange={setAssignOpen}
              workspace={workspace}
              coordinators={treeState.data?.coordinators ?? []}
              onAssigned={handleAssigned}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
