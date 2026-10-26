import { FormField } from "@/components/shared/form-field";
import { OptionSelect } from "@/components/shared/option-select";
import { Checkbox } from "@/components/ui/checkbox";
import { CHECKLIST_GROUPS } from "@/lib/visits/checklist";
import { INTERNET_TYPES } from "@/lib/visits/presentation";
import type { AgentServices } from "@/types";

interface ChecklistStepProps {
  checklist: AgentServices;
  onChange: (next: AgentServices) => void;
}

const INTERNET_OPTIONS = INTERNET_TYPES.map((value) => ({ value, label: value }));

/** Step 3: confirm the agent's readiness snapshot (starts from their current services). */
export function ChecklistStep({ checklist, onChange }: ChecklistStepProps) {
  return (
    <div className="space-y-4">
      {CHECKLIST_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
            {group.title}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.items.map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-border px-3 py-2.5"
              >
                <Checkbox
                  checked={checklist[item.key]}
                  onCheckedChange={(value) =>
                    onChange({ ...checklist, [item.key]: value === true })
                  }
                />
                <span className="text-sm">{item.label}</span>
              </label>
            ))}
            {group.hasInternetType && checklist.internetAvailable ? (
              <FormField label="Internet type (required)" htmlFor="internet-type">
                <OptionSelect
                  id="internet-type"
                  value={checklist.internetType ?? ""}
                  onChange={(internetType) => onChange({ ...checklist, internetType })}
                  placeholder="Select type"
                  options={INTERNET_OPTIONS}
                />
              </FormField>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}