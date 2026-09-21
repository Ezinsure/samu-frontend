"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { FollowUpFields } from "@/features/activities/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  MEETING_TYPES,
  canCreateActivities,
  createMeeting,
} from "@/lib/api";
import type { Meeting } from "@/types";

export default function NewMeetingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const canCreate = canCreateActivities(user);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState("");
  const [meetingType, setMeetingType] = useState<Meeting["meetingType"]>(
    "Agent Meeting",
  );
  const [participantCount, setParticipantCount] = useState("8");
  const [agenda, setAgenda] = useState("");
  const [decisions, setDecisions] = useState("");
  const [followTitle, setFollowTitle] = useState("");
  const [followDesc, setFollowDesc] = useState("");
  const [followDue, setFollowDue] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    const result = await createMeeting(
      {
        date,
        location,
        meetingType,
        participantCount: Number(participantCount) || 1,
        agenda,
        decisions,
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
    toast.success("Meeting saved");
    router.push(`/meetings/${result.id}`);
  }

  if (!canCreate) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="New meeting"
          description="Only coordinators and admins can record meetings."
        />
        <Button asChild variant="secondary">
          <Link href="/meetings">Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="New meeting"
        description="Capture agenda, decisions, and optional follow-ups."
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
                <Label>Meeting type</Label>
                <Select
                  value={meetingType}
                  onValueChange={(value) =>
                    setMeetingType(value as Meeting["meetingType"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEETING_TYPES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="count">Participants</Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  value={participantCount}
                  onChange={(e) => setParticipantCount(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agenda">Agenda</Label>
              <Textarea
                id="agenda"
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="decisions">Decisions</Label>
              <Textarea
                id="decisions"
                value={decisions}
                onChange={(e) => setDecisions(e.target.value)}
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
                <Link href="/meetings">Cancel</Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save meeting"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
