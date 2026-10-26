import type { ListQuery, SaleProductCategory, SaleRecord, ServiceLine } from "@/types";
import { createResourceClient } from "./resource";

export interface SaleQuery extends ListQuery {
  serviceLine?: ServiceLine;
  tcUserId?: string;
}

export type SaleListItem = SaleRecord & { tcName: string };

export interface SaleInput {
  serviceLine: ServiceLine;
  productCategory: SaleProductCategory;
  productName: string;
  quantity: number;
  amountRwf: number;
  customerName: string;
  customerPhone: string;
  geo: SaleRecord["geo"];
  /** ISO date or datetime. */
  soldAt: string;
  leadId?: string;
  onboardingId?: string;
  depositRwf?: number;
  installmentMonths?: number;
  notes?: string;
  /** Required for Admin / Ops; the API forces the TC's own id for coordinators. */
  tcUserId?: string;
}

const sales = createResourceClient<SaleListItem, SaleInput, SaleQuery>(
  "/sales",
  "sale",
);

export const getSales = sales.list;
export const getSaleById = sales.getById;
export const createSale = sales.create;
export const updateSale = sales.update;
