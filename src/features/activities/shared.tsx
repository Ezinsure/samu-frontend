"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  actionPriorityTone,
  actionStatusTone,
  type ActionListItem,
} from "@/lib/api";

export function LinkedActionsList({
  actions,
}: {
  actions: Array<
    Pick<
      ActionListItem,
      "id" | "title" | "dueDate" | "ownerName" | "priority" | "status"
    >
  >;
}) {
  if (actions.length === 0) {
    return (
      <p className="text-sm text-foreground-secondary">
        No follow-up action items linked yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {actions.map((action) => (
        <div
          key={action.id}
          className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <Link
              href="/action-items"
              className="font-medium text-primary-700 hover:underline dark:text-primary-300"
            >
              {action.title}
            </Link>
            <p className="text-xs text-foreground-secondary">
              Due {action.dueDate} · {action.ownerName}
            </p>
          </div>
          <div className="flex gap-2">
            <StatusBadge
              label={action.priority}
              tone={actionPriorityTone(action.priority)}
              showIcon={false}
            />
            <StatusBadge
              label={action.status.replace("_", " ")}
              tone={actionStatusTone(action.status)}
              showIcon={false}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FollowUpFields({
  title,
  description,
  dueDate,
  onTitle,
  onDescription,
  onDueDate,
}: {
  title: string;
  description: string;
  dueDate: string;
  onTitle: (value: string) => void;
  onDescription: (value: string) => void;
  onDueDate: (value: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-[var(--radius-md)] border border-dashed border-border p-4">
      <p className="text-sm font-medium">Optional follow-up action</p>
      <p className="text-xs text-foreground-secondary">
        If filled, an action item is created and appears on the Action items
        board.
      </p>
      <div className="space-y-2">
        <Label htmlFor="follow-up-title">Action title</Label>
        <Input
          id="follow-up-title"
          value={title}
          onChange={(event) => onTitle(event.target.value)}
          placeholder="e.g. Share leads with agents"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="follow-up-desc">Description</Label>
        <Textarea
          id="follow-up-desc"
          value={description}
          onChange={(event) => onDescription(event.target.value)}
        />
      </div>
      <div className="space-y-2 sm:max-w-xs">
        <Label htmlFor="follow-up-due">Due date</Label>
        <Input
          id="follow-up-due"
          type="date"
          value={dueDate}
          onChange={(event) => onDueDate(event.target.value)}
        />
      </div>
    </div>
  );
}
