import { UserCog } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TerritoryWorkspace } from "@/lib/api";
import { TerritoryAgentsTable } from "./territory-agents-table";
import { TerritoryChildrenList } from "./territory-children-list";
import { typeLabel } from "./territory-helpers";
import { TerritoryHistoryList } from "./territory-history-list";

interface TerritoryDetailProps {
  workspace: TerritoryWorkspace;
  /** Show the assign/reassign action (Admin + district only). */
  canAssign: boolean;
  onAssignClick: () => void;
  onSelectTerritory: (id: string) => void;
}

/** Header + tabs (agents / children / history) for one territory. */
export function TerritoryDetail({
  workspace,
  canAssign,
  onAssignClick,
  onSelectTerritory,
}: TerritoryDetailProps) {
  const { territory } = workspace;
  const isDistrict = territory.type === "district";
  const agentCount = workspace.agents.length;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">
                {territory.name}
              </h2>
              <StatusBadge label={typeLabel(territory.type)} tone="info" />
            </div>
            <p className="text-sm text-foreground-secondary">
              {workspace.parentName
                ? `Under ${workspace.parentName}`
                : "Top-level province"}
              {" · "}
              {agentCount} agent{agentCount === 1 ? "" : "s"}
            </p>
            {isDistrict ? (
              <p className="text-sm">
                <span className="text-foreground-secondary">Coordinator: </span>
                <span className="font-medium">
                  {workspace.tcName ?? "Unassigned"}
                </span>
              </p>
            ) : null}
          </div>
          {canAssign && isDistrict ? (
            <Button type="button" onClick={onAssignClick}>
              <UserCog className="h-4 w-4" />
              {workspace.tcName ? "Reassign TC" : "Assign TC"}
            </Button>
          ) : null}
        </CardHeader>
      </Card>

      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents">Agents ({agentCount})</TabsTrigger>
          <TabsTrigger value="children">
            Children ({workspace.childSummary.length})
          </TabsTrigger>
          {isDistrict ? (
            <TabsTrigger value="history">
              History ({workspace.history.length})
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="agents">
          <Card>
            <CardContent className="p-0">
              <TerritoryAgentsTable agents={workspace.agents} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="children">
          <Card>
            <CardContent className="p-0">
              <TerritoryChildrenList
                items={workspace.childSummary}
                onSelect={onSelectTerritory}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {isDistrict ? (
          <TabsContent value="history">
            <Card>
              <CardContent className="p-0">
                <TerritoryHistoryList history={workspace.history} />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>
    </>
  );
}
