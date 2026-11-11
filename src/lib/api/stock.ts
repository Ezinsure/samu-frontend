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
  pendingIncoming?: number;
}

export type StockTransferStatus =
  | "draft"
  | "pending"
  | "accepted"
  | "partially_accepted"
  | "declined"
  | "cancelled";

export type StockTransferItemDecision =
  | "pending"
  | "accepted"
  | "missing"
  | "wrong"
  | "declined";

export interface StockAssignableHolder {
  id: string;
  name: string;
  email: string;
  role: string;
  workingDistrict?: string;
  workingProvince?: string;
}

export interface StockHolderBreakdownRow {
  holder: {
    id: string;
    name: string;
    email: string;
    role: string;
    workingDistrict?: string;
  };
  total: number;
  byStatus: Record<string, number>;
  pendingAssignments: number;
}

export interface StockTransferItem {
  id: string;
  unitId: string;
  serial: string;
  typeKey: string;
  typeLabel: string;
  condition?: string;
  decision: StockTransferItemDecision;
  decisionNote?: string;
  unit: {
    id: string;
    serial: string;
    status: StockUnitStatus;
    condition?: string;
    type: { id: string; key: string; label: string };
  };
}

export interface StockTransfer {
  id: string;
  kind: "assignment" | "return";
  status: StockTransferStatus;
  revision: number;
  confirmedRevision?: number;
  holderConfirmedRevision?: number;
  officeConfirmedRevision?: number;
  holderConfirmed?: boolean;
  officeConfirmed?: boolean;
  reasonCode?: string;
  note?: string;
  fromUser: StockHolder | null;
  toUser: StockHolder;
  createdBy: { id: string; name: string; email: string };
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  items: StockTransferItem[];
  events: Array<{
    id: string;
    type: string;
    note?: string;
    revision?: number;
    payload?: Record<string, unknown>;
    actor: { id: string; name: string; email: string };
    createdAt: string;
  }>;
  itemCount: number;
}

export type ReturnReasonCode =
  | "no_sales"
  | "faulty"
  | "end_of_contract"
  | "excess_stock"
  | "other";

export const RETURN_REASON_OPTIONS: FilterOption[] = [
  { value: "no_sales", label: "No sales" },
  { value: "faulty", label: "Faulty" },
  { value: "end_of_contract", label: "End of contract" },
  { value: "excess_stock", label: "Excess stock" },
  { value: "other", label: "Other" },
];

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

export function canUseMyStock(viewer?: SessionUser | null) {
  return (
    viewer?.role === "ADMIN" ||
    viewer?.role === "TERRITORY_COORDINATOR" ||
    viewer?.role === "COMMUNITY_OPPORTUNITY_ASSOCIATE"
  );
}

export function transferStatusLabel(status: StockTransferStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "pending":
      return "Pending confirmation";
    case "accepted":
      return "Accepted";
    case "partially_accepted":
      return "Partially accepted";
    case "declined":
      return "Declined";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function transferStatusTone(status: StockTransferStatus): StatusTone {
  switch (status) {
    case "draft":
      return "neutral";
    case "pending":
      return "warning";
    case "accepted":
      return "success";
    case "partially_accepted":
      return "info";
    case "declined":
      return "danger";
    case "cancelled":
      return "inactive";
    default:
      return "neutral";
  }
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

export function getMyStockOverview(): Promise<StockOverview> {
  return apiRequest<StockOverview>("/stock/mine/overview");
}

export function getAssignableHolders(): Promise<StockAssignableHolder[]> {
  return apiRequest<StockAssignableHolder[]>("/stock/holders");
}

export function getHolderBreakdown(): Promise<StockHolderBreakdownRow[]> {
  return apiRequest<StockHolderBreakdownRow[]>("/stock/holders/breakdown");
}

export function createStockAssignment(input: {
  toUserId: string;
  unitIds?: string[];
  typeKey?: string;
  quantity?: number;
  note?: string;
  reasonCode?: string;
}): Promise<MutationResult<StockTransfer>> {
  return runMutation(() =>
    apiRequest<StockTransfer>("/stock/transfers/assignments", {
      method: "POST",
      body: input,
    }),
  );
}

export function getStockTransfers(query: {
  page?: number;
  pageSize?: number;
  status?: StockTransferStatus;
  kind?: "assignment" | "return";
  toUserId?: string;
  mine?: boolean;
} = {}): Promise<Paginated<StockTransfer>> {
  return apiRequestList<StockTransfer>("/stock/transfers", {
    query: {
      ...query,
      mine: query.mine ? "true" : undefined,
    },
  });
}

export function getStockTransfer(id: string): Promise<StockTransfer> {
  return apiRequest<StockTransfer>(
    `/stock/transfers/${encodeURIComponent(id)}`,
  );
}

export function acceptStockTransfer(
  id: string,
): Promise<MutationResult<StockTransfer>> {
  return runMutation(() =>
    apiRequest<StockTransfer>(
      `/stock/transfers/${encodeURIComponent(id)}/accept`,
      { method: "POST", body: {} },
    ),
  );
}

export function declineStockTransfer(
  id: string,
  input?: { note?: string },
): Promise<MutationResult<StockTransfer>> {
  return runMutation(() =>
    apiRequest<StockTransfer>(
      `/stock/transfers/${encodeURIComponent(id)}/decline`,
      { method: "POST", body: input ?? {} },
    ),
  );
}

export function respondStockTransfer(
  id: string,
  input: {
    decisions: Array<{
      itemId: string;
      decision: Exclude<StockTransferItemDecision, "pending">;
      note?: string;
    }>;
    note?: string;
  },
): Promise<MutationResult<StockTransfer>> {
  return runMutation(() =>
    apiRequest<StockTransfer>(
      `/stock/transfers/${encodeURIComponent(id)}/respond`,
      { method: "POST", body: input },
    ),
  );
}

export type AvailableStockUnit = {
  id: string;
  serial: string;
  status: StockUnitStatus;
  condition?: string;
  type: { id: string; key: string; label: string };
  holder: StockHolder | null;
};

export function getAvailableStockUnits(query: {
  page?: number;
  pageSize?: number;
  typeKey?: string;
  search?: string;
  holderUserId?: string;
} = {}): Promise<Paginated<AvailableStockUnit>> {
  return apiRequestList<AvailableStockUnit>("/stock/available", {
    query: { ...query },
  });
}

export type CustomerReturnReason =
  | "stopped_paying"
  | "faulty"
  | "cancelled"
  | "other";

export function customerReturnStockUnit(
  id: string,
  input: {
    reasonCode: CustomerReturnReason;
    condition?: string;
    note?: string;
  },
): Promise<
  MutationResult<{
    id: string;
    serial: string;
    status: "returned_by_customer";
    type: { id: string; key: string; label: string };
  }>
> {
  return runMutation(() =>
    apiRequest(`/stock/units/${encodeURIComponent(id)}/customer-return`, {
      method: "POST",
      body: input,
    }),
  );
}

export function createStockReturn(input: {
  unitIds: string[];
  reasonCode: ReturnReasonCode;
  note?: string;
  submit?: boolean;
  items?: Array<{ unitId: string; condition?: string; note?: string }>;
}): Promise<MutationResult<StockTransfer>> {
  return runMutation(() =>
    apiRequest<StockTransfer>("/stock/transfers/returns", {
      method: "POST",
      body: input,
    }),
  );
}

export function updateStockReturn(
  id: string,
  input: {
    reasonCode?: ReturnReasonCode;
    note?: string | null;
    unitIds?: string[];
    items?: Array<{
      unitId: string;
      condition?: string | null;
      decision?: StockTransferItemDecision;
      decisionNote?: string | null;
    }>;
  },
): Promise<MutationResult<StockTransfer>> {
  return runMutation(() =>
    apiRequest<StockTransfer>(
      `/stock/transfers/${encodeURIComponent(id)}/return`,
      { method: "PATCH", body: input },
    ),
  );
}

export function submitStockReturn(
  id: string,
): Promise<MutationResult<StockTransfer>> {
  return runMutation(() =>
    apiRequest<StockTransfer>(
      `/stock/transfers/${encodeURIComponent(id)}/submit`,
      { method: "POST", body: {} },
    ),
  );
}

export function confirmStockReturn(
  id: string,
  input?: { note?: string },
): Promise<MutationResult<StockTransfer>> {
  return runMutation(() =>
    apiRequest<StockTransfer>(
      `/stock/transfers/${encodeURIComponent(id)}/confirm`,
      { method: "POST", body: input ?? {} },
    ),
  );
}

export function commentStockReturn(
  id: string,
  input: { note: string },
): Promise<MutationResult<StockTransfer>> {
  return runMutation(() =>
    apiRequest<StockTransfer>(
      `/stock/transfers/${encodeURIComponent(id)}/comment`,
      { method: "POST", body: input },
    ),
  );
}

export function cancelStockReturn(
  id: string,
  input?: { note?: string },
): Promise<MutationResult<StockTransfer>> {
  return runMutation(() =>
    apiRequest<StockTransfer>(
      `/stock/transfers/${encodeURIComponent(id)}/cancel`,
      { method: "POST", body: input ?? {} },
    ),
  );
}
