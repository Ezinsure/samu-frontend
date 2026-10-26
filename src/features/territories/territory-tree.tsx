import { ChevronDown, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TerritoryNode } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TreeNodeProps {
  node: TerritoryNode;
  depth: number;
  selectedId?: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}

/** One recursive row of the geography tree. */
function TreeNode({
  node,
  depth,
  selectedId,
  expanded,
  onToggle,
  onSelect,
}: TreeNodeProps) {
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
          isSelected &&
            "bg-primary-50 text-primary-800 dark:bg-primary-900/30 dark:text-primary-100",
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {hasChildren ? (
          // Span (not a nested button) keeps the markup valid inside <button>.
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

interface TerritoryTreeProps {
  tree: TerritoryNode[];
  loading: boolean;
  selectedId?: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}

/** Sidebar card with the full geography hierarchy. */
export function TerritoryTree({ tree, loading, ...rest }: TerritoryTreeProps) {
  return (
    <Card className="h-fit lg:sticky lg:top-6">
      <CardHeader className="pb-3">
        <CardTitle>Geography</CardTitle>
        <p className="text-xs text-foreground-secondary">
          Agent counts shown on the right of each node.
        </p>
      </CardHeader>
      <CardContent className="max-h-[70vh] overflow-y-auto pb-4 pt-0">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-7 w-full" />
            ))}
          </div>
        ) : tree.length === 0 ? (
          <EmptyState
            title="No territories"
            description="No territories are available for your account."
          />
        ) : (
          tree.map((node) => (
            <TreeNode key={node.id} node={node} depth={0} {...rest} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
