import {
  ALL_VALUE,
  FilterSelect,
  toFilterOptions,
} from "@/components/shared/filter-select";
import type { AgentFilterOptions } from "@/lib/api";

/** Filter state for the agent directory (`"all"` means no filter). */
export interface AgentListFilters {
  search: string;
  province: string;
  district: string;
  status: string;
  compliance: string;
  tcUserId: string;
  page: number;
}

export const INITIAL_AGENT_FILTERS: AgentListFilters = {
  search: "",
  province: ALL_VALUE,
  district: ALL_VALUE,
  status: ALL_VALUE,
  compliance: ALL_VALUE,
  tcUserId: ALL_VALUE,
  page: 1,
};

const COMPLIANCE_OPTIONS = [
  { value: "green", label: "Compliant" },
  { value: "yellow", label: "Due soon" },
  { value: "red", label: "Overdue" },
];

interface AgentFiltersProps {
  filters: AgentListFilters;
  options: AgentFilterOptions;
  /** TC users only see their own agents, so the coordinator filter is hidden. */
  hideCoordinator: boolean;
  onChange: (patch: Partial<AgentListFilters>) => void;
}

/** Select filters shown inside the agent directory filter bar. */
export function AgentFilters({
  filters,
  options,
  hideCoordinator,
  onChange,
}: AgentFiltersProps) {
  return (
    <>
      <FilterSelect
        value={filters.province}
        onChange={(province) => onChange({ province, district: ALL_VALUE })}
        placeholder="Province"
        allLabel="All provinces"
        options={toFilterOptions(options.provinces)}
      />
      <FilterSelect
        value={filters.district}
        onChange={(district) => onChange({ district })}
        placeholder="District"
        allLabel="All districts"
        options={toFilterOptions(options.districts)}
        widthClass="w-[150px]"
      />
      <FilterSelect
        value={filters.status}
        onChange={(status) => onChange({ status })}
        placeholder="Status"
        allLabel="All statuses"
        options={toFilterOptions(options.statuses)}
      />
      <FilterSelect
        value={filters.compliance}
        onChange={(compliance) => onChange({ compliance })}
        placeholder="Compliance"
        allLabel="All compliance"
        options={COMPLIANCE_OPTIONS}
        widthClass="w-[140px]"
      />
      {hideCoordinator ? null : (
        <FilterSelect
          value={filters.tcUserId}
          onChange={(tcUserId) => onChange({ tcUserId })}
          placeholder="Coordinator"
          allLabel="All coordinators"
          options={options.coordinators.map((coordinator) => ({
            value: coordinator.id,
            label: coordinator.name,
          }))}
          widthClass="w-[180px]"
        />
      )}
    </>
  );
}
