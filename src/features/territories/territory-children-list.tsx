import { EmptyState } from "@/components/shared/empty-state";
import type { TerritoryWorkspace } from "@/lib/api";
import { typeLabel } from "./territory-helpers";

/** Direct children of the selected territory; clicking drills down. */
export function TerritoryChildrenList({
  items,
  onSelect,
}: {
  items: TerritoryWorkspace["childSummary"];
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="No child territories"
          description="This node is a leaf in the geography tree."
        />
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {items.map((child) => (
        <button
          key={child.id}
          type="button"
          onClick={() => onSelect(child.id)}
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
  );
}
