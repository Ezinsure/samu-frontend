"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { FollowUpFields } from "@/features/activities/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  TRAINING_FORMATS,
  TRAINING_TOPICS,
  canCreateActivities,
  createTraining,
  getActivityGeoOptions,
  getAgents,
} from "@/lib/api";
import type { Agent } from "@/types";

export default function NewTrainingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const canCreate = canCreateActivities(user);

  const [agents, setAgents] = useState<Agent[]>([]);
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
  const [topic, setTopic] = useState(TRAINING_TOPICS[0]);
  const [format, setFormat] = useState(TRAINING_FORMATS[0]);
  const [approach, setApproach] = useState("");
  const [outcome, setOutcome] = useState("");
  const [attendees, setAttendees] = useState<string[]>([]);
  const [followTitle, setFollowTitle] = useState("");
  const [followDesc, setFollowDesc] = useState("");
  const [followDue, setFollowDue] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getAgents({ page: 1, pageSize: 100, status: "Active" }).then(
      (result) => setAgents(result.data),
    );
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

  function toggleAttendee(id: string, checked: boolean) {
    setAttendees((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    const result = await createTraining(
      {
        date,
        province,
        district,
        sector,
        topic,
        format,
        approach,
        outcome,
        attendeeAgentIds: attendees,
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
    toast.success("Training session saved");
    router.push(`/training/${result.id}`);
  }

  if (!canCreate) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Record training"
          description="Only coordinators and admins can record sessions."
        />
        <Button asChild variant="secondary">
          <Link href="/training">Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Record training"
        description="Capture topic, format, attendees, and outcomes."
      />
      <Card>
        <CardContent className="pt-6">
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
                <Label>Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAINING_FORMATS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Topic</Label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRAINING_TOPICS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Province</Label>
                <Select value={province} onValueChange={setProvince}>
                  <SelectTrigger>
                    <SelectValue />
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
                    <SelectValue />
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
                    <SelectValue />
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
            <div className="space-y-2">
              <Label>Attendees ({attendees.length})</Label>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-[var(--radius-md)] border border-border p-3">
                {agents.map((agent) => (
                  <label
                    key={agent.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={attendees.includes(agent.id)}
                      onCheckedChange={(value) =>
                        toggleAttendee(agent.id, value === true)
                      }
                    />
                    <span>
                      {agent.name} · {agent.code}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="approach">Approach</Label>
              <Textarea
                id="approach"
                value={approach}
                onChange={(e) => setApproach(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outcome">Outcome</Label>
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
                <Link href="/training">Cancel</Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save session"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
