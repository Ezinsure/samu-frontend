"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/auth-context";
import {
  canManageCoap,
  createSale,
  getCoapFilterOptions,
  getOnboardingById,
} from "@/lib/api";
import { ServiceSelect } from "@/features/coap/service-select";
import type { SaleProductCategory, ServiceLine } from "@/types";

const PRODUCTS: Array<{ value: SaleProductCategory; label: string }> = [
  { value: "internet_4g", label: "Internet 4G" },
  { value: "internet_starlink", label: "Internet Starlink" },
  { value: "smartphone", label: "Smartphone" },
  { value: "induction_cooker", label: "Induction cooker" },
  { value: "insurance_policy", label: "Insurance policy" },
  { value: "other", label: "Other" },
];

export default function NewSalePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canWrite = canManageCoap(user) && user?.role !== "MD_VIEWER";
  const onboardingId = searchParams.get("onboardingId") ?? undefined;

  const [serviceLine, setServiceLine] = useState<ServiceLine>(
    (searchParams.get("service") as ServiceLine) || "internet",
  );
  const [productCategory, setProductCategory] =
    useState<SaleProductCategory>("internet_4g");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [amountRwf, setAmountRwf] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [depositRwf, setDepositRwf] = useState("");
  const [installmentMonths, setInstallmentMonths] = useState("");
  const [soldAt, setSoldAt] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");
  const [province, setProvince] = useState("Kigali City");
  const [district, setDistrict] = useState("Gasabo");
  const [sector, setSector] = useState("Remera");
  const [options, setOptions] = useState<{
    provinces: string[];
    districts: string[];
    sectors: string[];
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getCoapFilterOptions(user).then(setOptions);
  }, [user]);

  useEffect(() => {
    if (!onboardingId) return;
    void getOnboardingById(onboardingId, user).then((row) => {
      if (!row) return;
      setCustomerName(row.customerName);
      setCustomerPhone(row.customerPhone);
      setServiceLine(row.serviceLine);
      setProvince(row.geo.province);
      setDistrict(row.geo.district);
      setSector(row.geo.sector);
    });
  }, [onboardingId, user]);

  if (!canWrite) {
    return (
      <div className="space-y-4">
        <PageHeader title="Record sale" description="Read-only access." />
        <Button asChild variant="secondary">
          <Link href="/sales">Back</Link>
        </Button>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!productName.trim() || !customerName.trim() || !amountRwf) {
      toast.error("Product, customer, and amount are required");
      return;
    }
    setSaving(true);
    try {
      const sale = await createSale(
        {
          serviceLine,
          productCategory,
          productName: productName.trim(),
          quantity: Number(quantity) || 1,
          amountRwf: Number(amountRwf) || 0,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          geo: { province, district, sector },
          soldAt: new Date(`${soldAt}T12:00:00.000Z`).toISOString(),
          onboardingId,
          depositRwf: depositRwf ? Number(depositRwf) : undefined,
          installmentMonths: installmentMonths
            ? Number(installmentMonths)
            : undefined,
          notes: notes.trim() || undefined,
        },
        user,
      );
      toast.success("Sale recorded");
      router.push(`/sales/${sale.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save sale",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Record sale"
        description="Capture product sales, including device financing terms when needed."
      />
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Sale details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Service</Label>
              <ServiceSelect
                value={serviceLine}
                onChange={(value) => {
                  if (value !== "all") setServiceLine(value);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={productCategory}
                onValueChange={(value) =>
                  setProductCategory(value as SaleProductCategory)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="product">Product name</Label>
              <Input
                id="product"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (RWF)</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                value={amountRwf}
                onChange={(e) => setAmountRwf(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cname">Customer name</Label>
              <Input
                id="cname"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cphone">Customer phone</Label>
              <Input
                id="cphone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="soldAt">Sold on</Label>
              <Input
                id="soldAt"
                type="date"
                value={soldAt}
                onChange={(e) => setSoldAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>District</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(options?.districts ?? [district]).map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {serviceLine === "device_financing" ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="deposit">Deposit (RWF)</Label>
                  <Input
                    id="deposit"
                    type="number"
                    min={0}
                    value={depositRwf}
                    onChange={(e) => setDepositRwf(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="months">Installment months</Label>
                  <Input
                    id="months"
                    type="number"
                    min={1}
                    value={installmentMonths}
                    onChange={(e) => setInstallmentMonths(e.target.value)}
                  />
                </div>
              </>
            ) : null}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button asChild type="button" variant="secondary">
            <Link href="/sales">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save sale"}
          </Button>
        </div>
      </form>
    </div>
  );
}
