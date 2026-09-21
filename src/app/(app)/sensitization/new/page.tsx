"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { FollowUpFields } from "@/features/activities/shared";
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
  SENSITIZATION_EVENT_TYPES,
  canCreateActivities,
  createSensitization,
  getActivityGeoOptions,
} from "@/lib/api";

export default function NewSensitizationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const canCreate = canCreateActivities(user);

  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<
    Array<{ name: string; province: string }>
  >([]);
  const [sectors, setSectors] = useState<
    Array<{ name: string; district: string }>
  >([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [sector, setSector] = useState("");
  const [venue, setVenue] = useState("");
  const [eventType, setEventType] = useState(SENSITIZATION_EVENT_TYPES[0]);
  const [peopleReached, setPeopleReached] = useState("50");
  const [approach, setApproach] = useState("");
  const [outcome, setOutcome] = useState("");
  const [followTitle, setFollowTitle] = useState("");
  const [followDesc, setFollowDesc] = useState("");
  const [followDue, setFollowDue] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getActivityGeoOptions(user).then((result) => {
      setProvinces(result.provinces);
      setDistricts(result.districts);
      setSectors(result.sectors);
      if (result.provinces[0]) setProvince(result.provinces[0]);
    });
  }, [user]);

  const districtOptions = useMemo(
    () => districts.filter((item) => item.province === province),
    [districts, province],
  );
  const sectorOptions = useMemo(
    () => sectors.filter((item) => item.district === district),
    [sectors, district],
  );

  useEffect(() => {
    if (districtOptions[0] && !districtOptions.some((d) => d.name === district)) {
      setDistrict(districtOptions[0].name);
    }
  }, [districtOptions, district]);

  useEffect(() => {
    if (sectorOptions[0] && !sectorOptions.some((s) => s.name === sector)) {
      setSector(sectorOptions[0]?.name ?? "");
    }
  }, [sectorOptions, sector]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    const result = await createSensitization(
      {
        date,
        province,
        district,
        sector,
        venue,
        eventType,
        peopleReached: Number(peopleReached) || 0,
        approach,
        outcome,
        followUpTitle: followTitle,
        followUpDescription: followDesc,
        followUpDueDate: followDue,
      },
      user,
    );
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Sensitization event saved");
    router.push(`/sensitization/${result.id}`);
  }

  if (!canCreate) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="New sensitization"
          description="Only coordinators and admins can create events."
        />
        <Button asChild variant="secondary">
          <Link href="/sensitization">Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="New sensitization"
        description="Record a community awareness event and optional follow-up."
      />
      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Event type</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SENSITIZATION_EVENT_TYPES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Province</Label>
                <Select value={province} onValueChange={setProvince}>
                  <SelectTrigger>
                    <SelectValue placeholder="Province" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>District</Label>
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger>
                    <SelectValue placeholder="District" />
                  </SelectTrigger>
                  <SelectContent>
                    {districtOptions.map((item) => (
                      <SelectItem key={item.name} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sector</Label>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectorOptions.map((item) => (
                      <SelectItem key={item.name} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reached">People reached</Label>
                <Input
                  id="reached"
                  type="number"
                  min={0}
                  value={peopleReached}
                  onChange={(e) => setPeopleReached(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="approach">Approach / method</Label>
              <Textarea
                id="approach"
                value={approach}
                onChange={(e) => setApproach(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outcome">Key outcomes</Label>
              <Textarea
                id="outcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                required
              />
            </div>
            <FollowUpFields
              title={followTitle}
              description={followDesc}
              dueDate={followDue}
              onTitle={setFollowTitle}
              onDescription={setFollowDesc}
              onDueDate={setFollowDue}
            />
            <div className="flex justify-end gap-2">
              <Button asChild type="button" variant="secondary">
                <Link href="/sensitization">Cancel</Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save event"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
