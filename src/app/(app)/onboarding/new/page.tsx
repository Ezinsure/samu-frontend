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
  createOnboardingCase,
  getCoapFilterOptions,
  getLeadById,
} from "@/lib/api";
import { ServiceSelect } from "@/features/coap/service-select";
import { ONBOARDING_STATUS_LABELS } from "@/lib/coap/catalog";
import type { OnboardingKind, OnboardingStatus, ServiceLine } from "@/types";

const KINDS: OnboardingKind[] = [
  "customer",
  "irembo_agent",
  "insurance_agent",
  "bk_account",
  "internet_activation",
  "device_registration",
  "cooker_purchase",
];

export default function NewOnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canWrite = canManageCoap(user) && user?.role !== "MD_VIEWER";
  const leadId = searchParams.get("leadId") ?? undefined;

  const [serviceLine, setServiceLine] = useState<ServiceLine>(
    (searchParams.get("service") as ServiceLine) || "irembo",
  );
  const [kind, setKind] = useState<OnboardingKind>("customer");
  const [status, setStatus] = useState<OnboardingStatus>("not_started");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [stageLabel, setStageLabel] = useState("Intake");
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
    if (!leadId) return;
    void getLeadById(leadId, user).then((lead) => {
      if (!lead) return;
      setCustomerName(lead.name);
      setCustomerPhone(lead.phone);
      setServiceLine(lead.serviceLine);
      setProvince(lead.geo.province);
      setDistrict(lead.geo.district);
      setSector(lead.geo.sector);
      if (lead.serviceLine === "irembo") setKind("irembo_agent");
      if (lead.serviceLine === "bk") setKind("bk_account");
      if (lead.serviceLine === "internet") setKind("internet_activation");
      if (lead.serviceLine === "device_financing") setKind("device_registration");
      if (lead.serviceLine === "clean_cooking") setKind("cooker_purchase");
      if (lead.serviceLine === "insurance") setKind("customer");
    });
  }, [leadId, user]);

  if (!canWrite) {
    return (
      <div className="space-y-4">
        <PageHeader title="New onboarding" description="Read-only access." />
        <Button asChild variant="secondary">
          <Link href="/onboarding">Back</Link>
        </Button>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Customer name and phone are required");
      return;
    }
    setSaving(true);
    try {
      const row = await createOnboardingCase(
        {
          serviceLine,
          kind,
          status,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          geo: { province, district, sector },
          stageLabel: stageLabel.trim() || "Intake",
          notes: notes.trim() || undefined,
          leadId,
        },
        user,
      );
      toast.success("Onboarding case created");
      router.push(`/onboarding/${row.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save case",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Start onboarding"
        description="Track registration and activation steps for a customer or agent."
      />
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Case details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cname">Customer / applicant name</Label>
              <Input
                id="cname"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cphone">Phone</Label>
              <Input
                id="cphone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>
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
              <Label>Kind</Label>
              <Select
                value={kind}
                onValueChange={(value) => setKind(value as OnboardingKind)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as OnboardingStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ONBOARDING_STATUS_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stage">Stage label</Label>
              <Input
                id="stage"
                value={stageLabel}
                onChange={(e) => setStageLabel(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Province</Label>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(options?.provinces ?? [province]).map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="space-y-1.5">
              <Label>Sector</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(options?.sectors ?? [sector]).map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button asChild type="button" variant="secondary">
            <Link href="/onboarding">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Create case"}
          </Button>
        </div>
      </form>
    </div>
  );
}
