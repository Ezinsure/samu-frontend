"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Users,
  UserCog,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth/auth-context";
import {
  assignTerritoryCoordinator,
  complianceLabel,
  complianceTone,
  getTerritoryTree,
  getTerritoryWorkspace,
  type TerritoryNode,
  type TerritoryWorkspace,
} from "@/lib/api";
import { cn } from "@/lib/utils";

function typeLabel(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function TreeNode({
  node,
  depth,
  selectedId,
  expanded,
  onToggle,
  onSelect,
}: {
  node: TerritoryNode;
  depth: number;
  selectedId?: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={cn(
          "flex w-full cursor-pointer items-center gap-1 rounded-[var(--radius-sm)] py-1.5 pr-2 text-left text-sm transition-colors hover:bg-background",
          isSelected && "bg-primary-50 text-primary-800 dark:bg-primary-900/30 dark:text-primary-100",
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {hasChildren ? (
          <span
            role="button"
            tabIndex={0}
            className="inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-foreground-secondary"
            onClick={(event) => {
              event.stopPropagation();
              onToggle(node.id);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                onToggle(node.id);
              }
            }}
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
        ) : (
          <span className="inline-block h-5 w-5 shrink-0" />
        )}
        <span className="min-w-0 flex-1 truncate font-medium">{node.name}</span>
        <span className="shrink-0 text-xs text-foreground-secondary">
          {node.agentCount}
        </span>
      </button>
      {hasChildren && isOpen
        ? node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  );
}

export function TerritoriesWorkspace() {
  const { user } = useAuth();
  const isMd = user?.role === "MD_VIEWER";

  const [tree, setTree] = useState<TerritoryNode[]>([]);
  const [coordinators, setCoordinators] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [canManage, setCanManage] = useState(false);
  const [loadingTree, setLoadingTree] = useState(true);
  const [selectedId, setSelectedId] = useState<string>();
  const [workspace, setWorkspace] = useState<TerritoryWorkspace | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [assignOpen, setAssignOpen] = useState(false);
  const [nextTcId, setNextTcId] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoadingTree(true);
    void getTerritoryTree(user).then((result) => {
      if (!active) return;
      setTree(result.tree);
      setCoordinators(result.coordinators);
      setCanManage(result.canManage && !isMd);
      setExpanded((prev) => {
        if (prev.size > 0) return prev;
        return new Set(result.tree.map((node) => node.id));
      });
      setSelectedId((current) => {
        if (current) return current;
        const firstDistrict = result.tree
          .flatMap((province) => province.children)
          .find((district) => district.type === "district");
        return firstDistrict?.id ?? result.tree[0]?.id;
      });
      setLoadingTree(false);
    });
    return () => {
      active = false;
    };
  }, [user, isMd, refreshKey]);

  useEffect(() => {
    if (!selectedId) {
      setWorkspace(null);
      return;
    }
    let active = true;
    setLoadingWorkspace(true);
    void getTerritoryWorkspace(selectedId, user).then((result) => {
      if (!active) return;
      setWorkspace(result);
      setLoadingWorkspace(false);
    });
    return () => {
      active = false;
    };
  }, [selectedId, user, refreshKey]);

  const districtStats = useMemo(() => {
    const districts = tree.flatMap((province) =>
      province.children.filter((child) => child.type === "district"),
    );
    const assigned = districts.filter((item) => item.tcUserId).length;
    return {
      provinces: tree.length,
      districts: districts.length,
      assigned,
      unassigned: districts.length - assigned,
    };
  }, [tree]);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAssign() {
    if (!workspace || !user || !nextTcId) return;
    setSaving(true);
    const result = await assignTerritoryCoordinator(
      workspace.territory.id,
      nextTcId,
      user.userId,
    );
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Territory coordinator updated", {
      description: `${workspace.territory.name} agents were reassigned to the new TC.`,
    });
    setAssignOpen(false);
    setNextTcId("");
    setRefreshKey((value) => value + 1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Territories"
        description="Province → district → sector → cell hierarchy and territory coordinator assignments."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Provinces", value: districtStats.provinces },
          { label: "Districts", value: districtStats.districts },
          { label: "Assigned to TC", value: districtStats.assigned },
          { label: "Unassigned", value: districtStats.unassigned },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-secondary">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {loadingTree ? "—" : stat.value}
                </p>
              </div>
              <MapPin className="h-5 w-5 text-primary-600" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader className="pb-3">
            <CardTitle>Geography</CardTitle>
            <p className="text-xs text-foreground-secondary">
              Agent counts shown on the right of each node.
            </p>
          </CardHeader>
          <CardContent className="max-h-[70vh] overflow-y-auto pb-4 pt-0">
            {loadingTree ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} className="h-7 w-full" />
                ))}
              </div>
            ) : tree.length === 0 ? (
              <EmptyState
                title="No territories"
                description="Geography seed data is missing."
              />
            ) : (
              tree.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  selectedId={selectedId}
                  expanded={expanded}
                  onToggle={toggleExpanded}
                  onSelect={setSelectedId}
                />
              ))
            )}
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-4">
          {loadingWorkspace ? (
            <Card>
              <CardContent className="space-y-3 p-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ) : !workspace ? (
            <EmptyState
              title="Select a territory"
              description="Choose a province, district, sector, or cell from the tree."
            />
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold tracking-tight">
                        {workspace.territory.name}
                      </h2>
                      <StatusBadge
                        label={typeLabel(workspace.territory.type)}
                        tone="info"
                      />
                    </div>
                    <p className="text-sm text-foreground-secondary">
                      {workspace.parentName
                        ? `Under ${workspace.parentName}`
                        : "Top-level province"}
                      {" · "}
                      {workspace.agents.length} agent
                      {workspace.agents.length === 1 ? "" : "s"}
                    </p>
                    {workspace.territory.type === "district" ? (
                      <p className="text-sm">
                        <span className="text-foreground-secondary">
                          Coordinator:{" "}
                        </span>
                        <span className="font-medium">
                          {workspace.tcName ?? "Unassigned"}
                        </span>
                      </p>
                    ) : null}
                  </div>
                  {canManage && workspace.territory.type === "district" ? (
                    <Button
                      type="button"
                      onClick={() => {
                        setNextTcId(workspace.territory.tcUserId ?? "");
                        setAssignOpen(true);
                      }}
                    >
                      <UserCog className="h-4 w-4" />
                      {workspace.tcName ? "Reassign TC" : "Assign TC"}
                    </Button>
                  ) : null}
                </CardHeader>
              </Card>

              <Tabs defaultValue="agents">
                <TabsList>
                  <TabsTrigger value="agents">
                    Agents ({workspace.agents.length})
                  </TabsTrigger>
                  <TabsTrigger value="children">
                    Children ({workspace.childSummary.length})
                  </TabsTrigger>
                  {workspace.territory.type === "district" ? (
                    <TabsTrigger value="history">
                      History ({workspace.history.length})
                    </TabsTrigger>
                  ) : null}
                </TabsList>

                <TabsContent value="agents">
                  <Card>
                    <CardContent className="p-0">
                      {workspace.agents.length === 0 ? (
                        <div className="p-6">
                          <EmptyState
                            icon={Users}
                            title="No agents here"
                            description="No agents are registered under this territory."
                          />
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-secondary">
                                <th className="px-4 py-3 font-medium">Agent</th>
                                <th className="px-4 py-3 font-medium">Location</th>
                                <th className="px-4 py-3 font-medium">TC</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Compliance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {workspace.agents.map((agent) => (
                                <tr
                                  key={agent.id}
                                  className="border-b border-border last:border-0"
                                >
                                  <td className="px-4 py-3">
                                    <Link
                                      href={`/agents/${agent.id}`}
                                      className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                                    >
                                      {agent.name}
                                    </Link>
                                    <p className="text-xs text-foreground-secondary">
                                      {agent.code}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3 text-foreground-secondary">
                                    {agent.geo.sector}
                                    {agent.geo.cell ? ` · ${agent.geo.cell}` : ""}
                                  </td>
                                  <td className="px-4 py-3">{agent.tcName}</td>
                                  <td className="px-4 py-3">
                                    <StatusBadge
                                      label={agent.status}
                                      tone={
                                        agent.status === "Active"
                                          ? "success"
                                          : agent.status === "Suspended"
                                            ? "danger"
                                            : "inactive"
                                      }
                                      showIcon={false}
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <StatusBadge
                                      label={complianceLabel(agent.compliance)}
                                      tone={complianceTone(agent.compliance)}
                                      showIcon={false}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="children">
                  <Card>
                    <CardContent className="p-0">
                      {workspace.childSummary.length === 0 ? (
                        <div className="p-6">
                          <EmptyState
                            title="No child territories"
                            description="This node is a leaf in the geography tree."
                          />
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {workspace.childSummary.map((child) => (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => {
                                setSelectedId(child.id);
                                setExpanded((prev) => new Set(prev).add(child.id));
                              }}
                              className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left hover:bg-background"
                            >
                              <div>
                                <p className="font-medium">{child.name}</p>
                                <p className="text-xs text-foreground-secondary">
                                  {typeLabel(child.type)}
                                  {child.tcName ? ` · ${child.tcName}` : ""}
                                </p>
                              </div>
                              <span className="text-sm tabular-nums text-foreground-secondary">
                                {child.agentCount} agents
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {workspace.territory.type === "district" ? (
                  <TabsContent value="history">
                    <Card>
                      <CardContent className="p-0">
                        {workspace.history.length === 0 ? (
                          <div className="p-6">
                            <EmptyState
                              title="No assignment history"
                              description="Assign a coordinator to start the history log."
                            />
                          </div>
                        ) : (
                          <div className="divide-y divide-border">
                            {workspace.history.map((entry) => (
                              <div
                                key={entry.id}
                                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <p className="font-medium">{entry.tcName}</p>
                                  <p className="text-xs text-foreground-secondary">
                                    Started{" "}
                                    {format(
                                      new Date(entry.startedAt),
                                      "dd MMM yyyy",
                                    )}
                                    {entry.endedAt
                                      ? ` · Ended ${format(new Date(entry.endedAt), "dd MMM yyyy")}`
                                      : ""}
                                  </p>
                                </div>
                                <StatusBadge
                                  label={entry.active ? "Active" : "Closed"}
                                  tone={entry.active ? "success" : "neutral"}
                                  showIcon={false}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                ) : null}
              </Tabs>
            </>
          )}
        </div>
      </div>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {workspace?.tcName ? "Reassign coordinator" : "Assign coordinator"}
            </DialogTitle>
            <DialogDescription>
              Assigning a new TC closes the previous territory assignment and
              updates all agents in {workspace?.territory.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="tc-select">Territory coordinator</Label>
            <Select value={nextTcId} onValueChange={setNextTcId}>
              <SelectTrigger id="tc-select">
                <SelectValue placeholder="Select coordinator" />
              </SelectTrigger>
              <SelectContent>
                {coordinators.map((coordinator) => (
                  <SelectItem key={coordinator.id} value={coordinator.id}>
                    {coordinator.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAssignOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!nextTcId || saving}
              onClick={() => void handleAssign()}
            >
              {saving ? "Saving…" : "Confirm assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
