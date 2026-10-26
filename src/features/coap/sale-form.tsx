"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { OptionSelect } from "@/components/shared/option-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createSale } from "@/lib/api";
import {
  DEFAULT_GEO,
  SALE_PRODUCT_LABELS,
  labelsToOptions,
} from "@/lib/coap/catalog";
import type { SaleProductCategory, ServiceLine } from "@/types";
import { CoordinatorField, useCoordinatorChoice } from "./coordinator-field";
import { FormShell } from "./form-shell";
import { GeoFields, type GeoValue } from "./geo-fields";
import { ServiceSelect } from "./service-select";
import { useCoapOptions } from "./use-coap-options";

const PRODUCT_OPTIONS = labelsToOptions(SALE_PRODUCT_LABELS);
const today = () => new Date().toISOString().slice(0, 10);

/** Product category that best matches a service line (used to prefill). */
const DEFAULT_PRODUCT_BY_SERVICE: Record<ServiceLine, SaleProductCategory> = {
  irembo: "other",
  bk: "other",
  internet: "internet_4g",
  device_financing: "smartphone",
  clean_cooking: "induction_cooker",
  insurance: "insurance_policy",
};

export interface SaleFormInitial {
  serviceLine: ServiceLine;
  customerName?: string;
  customerPhone?: string;
  geo?: GeoValue;
  leadId?: string;
  onboardingId?: string;
}

/** Create-sale form; `initial` seeds the fields (e.g. from an onboarding case). */
export function SaleForm({ initial }: { initial: SaleFormInitial }) {
  const router = useRouter();
  const options = useCoapOptions();
  const coordinator = useCoordinatorChoice(options.data?.coordinators);

  const [serviceLine, setServiceLine] = useState<ServiceLine>(
    initial.serviceLine,
  );
  const [productCategory, setProductCategory] = useState<SaleProductCategory>(
    DEFAULT_PRODUCT_BY_SERVICE[initial.serviceLine],
  );
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [amountRwf, setAmountRwf] = useState("");
  const [customerName, setCustomerName] = useState(initial.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(
    initial.customerPhone ?? "",
  );
  const [soldAt, setSoldAt] = useState(today);
  const [geo, setGeo] = useState<GeoValue>(initial.geo ?? DEFAULT_GEO);
  const [deposit, setDeposit] = useState("");
  const [installmentMonths, setInstallmentMonths] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const isFinancing = serviceLine === "device_financing";

  function changeService(next: ServiceLine) {
    setServiceLine(next);
    setProductCategory(DEFAULT_PRODUCT_BY_SERVICE[next]);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (coordinator.required && !coordinator.tcUserId) {
      toast.error("Select the coordinator who made this sale");
      return;
    }

    setSaving(true);
    const result = await createSale({
      serviceLine,
      productCategory,
      productName: productName.trim(),
      quantity: Math.max(1, Number(quantity) || 1),
      amountRwf: Math.max(0, Number(amountRwf) || 0),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      // Noon UTC keeps the calendar day stable across time zones.
      soldAt: new Date(`${soldAt}T12:00:00.000Z`).toISOString(),
      geo,
      leadId: initial.leadId,
      onboardingId: initial.onboardingId,
      depositRwf: isFinancing && deposit ? Number(deposit) : undefined,
      installmentMonths:
        isFinancing && installmentMonths ? Number(installmentMonths) : undefined,
      notes: notes.trim(),
      tcUserId: coordinator.tcUserId,
    });
    setSaving(false);

    if (!result.ok) {
      toast.error("Could not save sale", { description: result.error });
      return;
    }
    toast.success("Sale recorded");
    router.push(`/sales/${result.data.id}`);
  }

  return (
    <FormShell
      title="Record sale"
      description="Log a completed sale and the customer who bought it."
      cardTitle="Sale details"
      backHref="/sales"
      submitLabel="Save sale"
      saving={saving}
      onSubmit={onSubmit}
    >
      <FormField label="Service line">
        <ServiceSelect
          value={serviceLine}
          onChange={(value) => value !== "all" && changeService(value)}
        />
      </FormField>
      <FormField label="Product category">
        <OptionSelect
          value={productCategory}
          onChange={(value) => setProductCategory(value as SaleProductCategory)}
          options={PRODUCT_OPTIONS}
        />
      </FormField>
      <FormField label="Product name" htmlFor="product" className="md:col-span-2">
        <Input
          id="product"
          value={productName}
          onChange={(event) => setProductName(event.target.value)}
          required
        />
      </FormField>
      <FormField label="Quantity" htmlFor="qty">
        <Input
          id="qty"
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          required
        />
      </FormField>
      <FormField label="Amount (RWF)" htmlFor="amount">
        <Input
          id="amount"
          type="number"
          min={0}
          value={amountRwf}
          onChange={(event) => setAmountRwf(event.target.value)}
          required
        />
      </FormField>
      <FormField label="Customer name" htmlFor="cname">
        <Input
          id="cname"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          required
        />
      </FormField>
      <FormField label="Customer phone" htmlFor="cphone">
        <Input
          id="cphone"
          value={customerPhone}
          onChange={(event) => setCustomerPhone(event.target.value)}
          required
        />
      </FormField>
      <FormField label="Sold on" htmlFor="sold">
        <Input
          id="sold"
          type="date"
          value={soldAt}
          onChange={(event) => setSoldAt(event.target.value)}
          required
        />
      </FormField>
      {isFinancing ? (
        <>
          <FormField label="Deposit (RWF)" htmlFor="deposit">
            <Input
              id="deposit"
              type="number"
              min={0}
              value={deposit}
              onChange={(event) => setDeposit(event.target.value)}
            />
          </FormField>
          <FormField label="Installment months" htmlFor="months">
            <Input
              id="months"
              type="number"
              min={1}
              value={installmentMonths}
              onChange={(event) => setInstallmentMonths(event.target.value)}
            />
          </FormField>
        </>
      ) : null}
      <GeoFields value={geo} onChange={setGeo} options={options.data} />
      <CoordinatorField
        choice={coordinator}
        coordinators={options.data?.coordinators ?? []}
      />
      <FormField label="Notes" htmlFor="notes" className="md:col-span-2">
        <Textarea
          id="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
        />
      </FormField>
    </FormShell>
  );
}
