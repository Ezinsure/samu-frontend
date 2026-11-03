"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CascadingGeoFields } from "@/components/shared/cascading-geo-fields";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RWANDA_PROVINCE_LIST, districtsForProvince } from "@/lib/geo/rwanda";
import { apiRequest } from "@/lib/http/client";

const KINDS = [
  { value: "bk_accounts", label: "BK accounts" },
  { value: "irembo_recruits", label: "Irembo recruits" },
  { value: "insurance_clients", label: "Insurance clients" },
  { value: "internet_subscriptions", label: "Internet subscriptions" },
  { value: "smartphone_sales", label: "Smartphone sales" },
  { value: "induction_cooker_sales", label: "Induction cooker sales" },
  { value: "ict_training", label: "ICT training" },
] as const;

interface WorkRow {
  id: string;
  date: string;
  summary: string;
  peopleReached: number;
  district: string;
}

export default function FieldWorkPage() {
  const [rows, setRows] = useState<WorkRow[]>([]);
  const [kind, setKind] = useState<(typeof KINDS)[number]["value"]>("bk_accounts");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [peopleReached, setPeopleReached] = useState("1");
  const [venue, setVenue] = useState("");
  const [summary, setSummary] = useState("");
  const [outcome, setOutcome] = useState("");
  const [geo, setGeo] = useState({
    province: RWANDA_PROVINCE_LIST[0] ?? "Kigali City",
    district: districtsForProvince(RWANDA_PROVINCE_LIST[0] ?? "Kigali City")[0] ?? "",
    sector: "",
    cell: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const data = await apiRequest<WorkRow[]>("/field-work");
    setRows(data);
  }, []);

  useEffect(() => {
    void load().catch(() => toast.error("Could not load field work"));
  }, [load]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest("/field-work", {
        method: "POST",
        body: {
          kind,
          date,
          peopleReached: Number(peopleReached) || 0,
          province: geo.province,
          district: geo.district,
          sector: geo.sector || geo.district,
          venue,
          summary,
          outcome,
        },
      });
      toast.success("Activity logged");
      setSummary("");
      setOutcome("");
      await load();
    } catch (error) {
      toast.error("Could not save", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field work log"
        description="Record COA community activities — BK accounts, recruits, insurance, devices, and training."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log activity</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Activity type</Label>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={kind}
                onChange={(e) =>
                  setKind(e.target.value as (typeof KINDS)[number]["value"])
                }
              >
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>People reached</Label>
              <Input
                type="number"
                min={0}
                value={peopleReached}
                onChange={(e) => setPeopleReached(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
              <CascadingGeoFields
                value={{ ...geo, village: "" }}
                onChange={(next) =>
                  setGeo({
                    province: next.province,
                    district: next.district,
                    sector: next.sector,
                    cell: next.cell,
                  })
                }
                showVillage={false}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Venue</Label>
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} required />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Summary</Label>
              <Input value={summary} onChange={(e) => setSummary(e.target.value)} required />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Outcome</Label>
              <Input value={outcome} onChange={(e) => setOutcome(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save activity"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-foreground-muted">No activities yet.</p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="rounded-md border border-border p-3 text-sm">
                <p className="font-medium">
                  {row.date} · {row.district} · {row.peopleReached} people
                </p>
                <p className="text-foreground-muted">{row.summary}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
