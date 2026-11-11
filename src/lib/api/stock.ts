import { apiRequest } from "@/lib/http/client";
import { apiRequestList } from "@/lib/http/list";
import { runMutation, type MutationResult } from "@/lib/http/mutation";
import type { FilterOption } from "@/components/shared/filter-select";
import type { ListQuery, Paginated, SessionUser } from "@/types";
import type { StatusTone } from "@/components/shared/status-badge";

export type StockUnitStatus =
  | "in_warehouse"
  | "in_transit"
  | "with_holder"
  | "sold"
  | "returned_by_customer"
  | "damaged"
  | "written_off";

export type StockMovementType =
  | "intake"
  | "assign"
  | "accept"
  | "decline"
  | "sale"
  | "customer_return"
  | "return_to_office"
  | "confirm_return"
  | "adjust"
  | "write_off";

export interface StockItemType {
  id: string;
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
  sortOrder: number;
  unitCount: number;
  updatedAt: string;
}

export interface StockHolder {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface StockUnit {
  id: string;
  serial: string;
  status: StockUnitStatus;
  condition?: string;
  notes?: string;
  attributes?: Record<string, unknown>;
  type: { id: string; key: string; label: string };
  holder: StockHolder | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  type: StockMovementType;
  fromHolderId?: string;
  toHolderId?: string;
  reasonCode?: string;
  note?: string;
  refType?: string;
  refId?: string;
  actor: { id: string; name: string; email: string };
  createdAt: string;
}

export interface StockUnitDetail extends StockUnit {
  movements: StockMovement[];
}

export interface StockOverview {
  total: number;
  byStatus: Record<StockUnitStatus, number>;
  byType: Array<{
    type: { id: string; key: string; label: string };
    total: number;
    byStatus: Record<string, number>;
  }>;
}

export type IntakePreviewRowStatus =
  | "ready"
  | "invalid"
  | "duplicate_in_file"
  | "exists";

export interface IntakePreview {
  type: { id: string; key: string; label: string };
  total: number;
  ready: number;
  invalid: number;
  duplicates: number;
  exists: number;
  rows: Array<{
    serial: string;
    status: IntakePreviewRowStatus;
    reason?: string;
  }>;
}

export interface IntakeResult {
  created: number;
  skipped: number;
  preview: IntakePreview;
}

export interface StockUnitQuery extends ListQuery {
  typeKey?: string;
  status?: StockUnitStatus;
  holderUserId?: string;
}

export interface CreateStockTypeInput {
  key: string;
  label: string;
  description?: string;
  enabled?: boolean;
  sortOrder?: number;
}

export interface UpdateStockTypeInput {
  label?: string;
  description?: string | null;
  enabled?: boolean;
  sortOrder?: number;
}

export const STOCK_UNIT_STATUS_OPTIONS: FilterOption[] = [
  { value: "in_warehouse", label: "In warehouse" },
  { value: "in_transit", label: "In transit" },
  { value: "with_holder", label: "With holder" },
  { value: "sold", label: "Sold" },
  { value: "returned_by_customer", label: "Customer return" },
  { value: "damaged", label: "Damaged" },
  { value: "written_off", label: "Written off" },
];

export function canManageStock(viewer?: SessionUser | null) {
  return viewer?.role === "ADMIN";
}

export function stockStatusLabel(status: StockUnitStatus) {
  return (
    STOCK_UNIT_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
  );
}

export function stockStatusTone(status: StockUnitStatus): StatusTone {
  switch (status) {
    case "in_warehouse":
      return "info";
    case "in_transit":
      return "warning";
    case "with_holder":
      return "success";
    case "sold":
      return "success";
    case "returned_by_customer":
      return "warning";
    case "damaged":
      return "danger";
    case "written_off":
      return "inactive";
    default:
      return "neutral";
  }
}

export function stockMovementLabel(type: StockMovementType) {
  const labels: Record<StockMovementType, string> = {
    intake: "Intake",
    assign: "Assign",
    accept: "Accept",
    decline: "Decline",
    sale: "Sale",
    customer_return: "Customer return",
    return_to_office: "Return to office",
    confirm_return: "Confirm return",
    adjust: "Adjust",
    write_off: "Write off",
  };
  return labels[type] ?? type;
}

/** Split pasted serials (newline / comma / semicolon). */
export function parseSerialList(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getStockOverview(): Promise<StockOverview> {
  return apiRequest<StockOverview>("/stock/overview");
}

export function getStockTypes(opts?: {
  includeDisabled?: boolean;
}): Promise<StockItemType[]> {
  return apiRequest<StockItemType[]>("/stock/types", {
    query: {
      includeDisabled: opts?.includeDisabled ? "true" : undefined,
    },
  });
}

export function createStockType(
  input: CreateStockTypeInput,
): Promise<MutationResult<StockItemType>> {
  return runMutation(() =>
    apiRequest<StockItemType>("/stock/types", {
      method: "POST",
      body: input,
    }),
  );
}

export function updateStockType(
  key: string,
  input: UpdateStockTypeInput,
): Promise<MutationResult<StockItemType>> {
  return runMutation(() =>
    apiRequest<StockItemType>(`/stock/types/${encodeURIComponent(key)}`, {
      method: "PATCH",
      body: input,
    }),
  );
}

export function getStockUnits(
  query: StockUnitQuery = {},
): Promise<Paginated<StockUnit>> {
  return apiRequestList<StockUnit>("/stock/units", { query: { ...query } });
}

export function getStockUnit(id: string): Promise<StockUnitDetail> {
  return apiRequest<StockUnitDetail>(`/stock/units/${encodeURIComponent(id)}`);
}

export function previewStockIntake(input: {
  typeKey: string;
  serials: string[];
}): Promise<MutationResult<IntakePreview>> {
  return runMutation(() =>
    apiRequest<IntakePreview>("/stock/intake/preview", {
      method: "POST",
      body: input,
    }),
  );
}

export function intakeStockUnits(input: {
  typeKey: string;
  serials: string[];
  condition?: string;
  notes?: string;
}): Promise<MutationResult<IntakeResult>> {
  return runMutation(() =>
    apiRequest<IntakeResult>("/stock/intake", {
      method: "POST",
      body: input,
    }),
  );
}
