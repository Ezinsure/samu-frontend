"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  createLead,
  getCoapFilterOptions,
} from "@/lib/api";
import { ServiceSelect } from "@/features/coap/service-select";
import { LEAD_STATUS_LABELS } from "@/lib/coap/catalog";
import type { LeadEntityType, LeadStatus, ServiceLine } from "@/types";

export default function NewLeadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canWrite = canManageCoap(user) && user?.role !== "MD_VIEWER";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [entityType, setEntityType] = useState<LeadEntityType>("person");
  const [serviceLine, setServiceLine] = useState<ServiceLine>(
    (searchParams.get("service") as ServiceLine) || "irembo",
  );
  const [status, setStatus] = useState<LeadStatus>("new");
  const [province, setProvince] = useState("Kigali City");
  const [district, setDistrict] = useState("Gasabo");
  const [sector, setSector] = useState("Remera");
  const [interestSummary, setInterestSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [options, setOptions] = useState<{
    provinces: string[];
    districts: string[];
    sectors: string[];
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getCoapFilterOptions(user).then(setOptions);
  }, [user]);

  if (!canWrite) {
    return (
      <div className="space-y-4">
        <PageHeader title="Create lead" description="Read-only access." />
        <Button asChild variant="secondary">
          <Link href="/leads">Back</Link>
        </Button>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    setSaving(true);
    try {
      const lead = await createLead(
        {
          name: name.trim(),
          phone: phone.trim(),
          entityType,
          serviceLine,
          status,
          geo: { province, district, sector },
          interestSummary: interestSummary.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        user,
      );
      toast.success("Lead created");
      router.push(`/leads/${lead.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save lead");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New lead"
        description="Capture interest from a community member, household, or business."
      />
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Lead details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Entity type</Label>
              <Select
                value={entityType}
                onValueChange={(value) => setEntityType(value as LeadEntityType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">Person</SelectItem>
                  <SelectItem value="household">Household</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Service line</Label>
              <ServiceSelect
                value={serviceLine}
                onChange={(value) => {
                  if (value !== "all") setServiceLine(value);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as LeadStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="interest">Interest summary</Label>
              <Input
                id="interest"
                value={interestSummary}
                onChange={(e) => setInterestSummary(e.target.value)}
                placeholder="What do they need?"
              />
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
            <Link href="/leads">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save lead"}
          </Button>
        </div>
      </form>
    </div>
  );
}
