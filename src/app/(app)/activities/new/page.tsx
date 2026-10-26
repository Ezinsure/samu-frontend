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
  createFieldActivity,
  getCoapFilterOptions,
} from "@/lib/api";
import { ServiceSelect } from "@/features/coap/service-select";
import { ACTIVITY_TYPE_LABELS } from "@/lib/coap/catalog";
import type { FieldActivityType, ServiceLine } from "@/types";

export default function NewActivityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canWrite = canManageCoap(user) && user?.role !== "MD_VIEWER";

  const [serviceLine, setServiceLine] = useState<ServiceLine>(
    (searchParams.get("service") as ServiceLine) || "irembo",
  );
  const [activityType, setActivityType] =
    useState<FieldActivityType>("education");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [province, setProvince] = useState("Kigali City");
  const [district, setDistrict] = useState("Gasabo");
  const [sector, setSector] = useState("Remera");
  const [venue, setVenue] = useState("");
  const [peopleReached, setPeopleReached] = useState("20");
  const [summary, setSummary] = useState("");
  const [outcome, setOutcome] = useState("");
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
        <PageHeader title="Log activity" description="Read-only access." />
        <Button asChild variant="secondary">
          <Link href="/activities">Back</Link>
        </Button>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!venue.trim() || !summary.trim()) {
      toast.error("Venue and summary are required");
      return;
    }
    setSaving(true);
    try {
      const activity = await createFieldActivity(
        {
          serviceLine,
          activityType,
          date,
          geo: { province, district, sector },
          venue: venue.trim(),
          peopleReached: Number(peopleReached) || 0,
          summary: summary.trim(),
          outcome: outcome.trim(),
        },
        user,
      );
      toast.success("Activity logged");
      router.push(`/activities/${activity.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save activity",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log field activity"
        description="Record education, demos, mobilization, support, or campaigns."
      />
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
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
              <Label>Type</Label>
              <Select
                value={activityType}
                onValueChange={(value) =>
                  setActivityType(value as FieldActivityType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="people">People reached</Label>
              <Input
                id="people"
                type="number"
                min={0}
                value={peopleReached}
                onChange={(e) => setPeopleReached(e.target.value)}
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
            <div className="space-y-1.5">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="outcome">Outcome</Label>
              <Textarea
                id="outcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button asChild type="button" variant="secondary">
            <Link href="/activities">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save activity"}
          </Button>
        </div>
      </form>
    </div>
  );
}
