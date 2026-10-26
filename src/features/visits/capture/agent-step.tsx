import { FormField } from "@/components/shared/form-field";
import { OptionSelect } from "@/components/shared/option-select";
import { Checkbox } from "@/components/ui/checkbox";
import type { AgentRow } from "@/lib/api";
import { SERVICE_LINES } from "@/lib/coap/catalog";
import { VISIT_PURPOSES } from "@/lib/visits/presentation";
import type { VisitPurpose } from "@/types";
import type { DraftChange, VisitDraft } from "./types";

interface AgentStepProps {
  draft: VisitDraft;
  onChange: DraftChange;
  agents: AgentRow[];
  selectedAgent: AgentRow | null;
  startedAt: string;
}

const PURPOSE_OPTIONS = VISIT_PURPOSES.map((value) => ({ value, label: value }));

/** Step 1: which agent, why, and which COAP services were covered. */
export function AgentStep({
  draft,
  onChange,
  agents,
  selectedAgent,
  startedAt,
}: AgentStepProps) {
  return (
    <>
      <FormField label="Agent" htmlFor="agent">
        <OptionSelect
          id="agent"
          value={draft.agentId}
          // A new agent means a new checklist baseline.
          onChange={(agentId) => onChange({ agentId, checklist: null })}
          placeholder="Select agent to visit"
          options={agents.map((agent) => ({
            value: agent.id,
            label: `${agent.name} · ${agent.code} · ${agent.geo.district}`,
          }))}
        />
      </FormField>

      <FormField label="Visit purpose" htmlFor="purpose">
        <OptionSelect
          id="purpose"
          value={draft.purpose}
          onChange={(purpose) => onChange({ purpose: purpose as VisitPurpose })}
          options={PURPOSE_OPTIONS}
        />
      </FormField>

      <div className="space-y-2">
        <p className="text-sm font-medium">COAP services covered (optional)</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SERVICE_LINES.map((line) => (
            <label
              key={line.id}
              className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-border px-3 py-2.5"
            >
              <Checkbox
                checked={draft.serviceLines.includes(line.id)}
                onCheckedChange={(checked) =>
                  onChange({
                    serviceLines:
                      checked === true
                        ? [...draft.serviceLines, line.id]
                        : draft.serviceLines.filter((id) => id !== line.id),
                  })
                }
              />
              <span className="text-sm">{line.shortLabel}</span>
            </label>
          ))}
        </div>
      </div>

      {selectedAgent ? (
        <div className="rounded-[var(--radius-md)] border border-border bg-background p-3 text-sm">
          <p className="font-medium">{selectedAgent.name}</p>
          <p className="text-foreground-secondary">
            {selectedAgent.geo.province} · {selectedAgent.geo.district} ·{" "}
            {selectedAgent.geo.sector}
          </p>
          <p className="mt-1 text-xs text-foreground-secondary">
            Registered GPS: {selectedAgent.registeredLocation.lat},{" "}
            {selectedAgent.registeredLocation.lng}
          </p>
        </div>
      ) : null}

      <p className="text-xs text-foreground-secondary">
        Visit start captured at {new Date(startedAt).toLocaleString()}{" "}
        (system-generated).
      </p>
    </>
  );
}
