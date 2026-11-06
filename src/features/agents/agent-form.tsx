"use client";

import { useState } from "react";
import type { AgentInput } from "@/lib/api";
import { DEFAULT_AGENT_SERVICES } from "@/lib/api";
import type { Agent, AgentStatus } from "@/types";
import {
  CascadingGeoFields,
  type CascadingGeoValue,
} from "@/components/shared/cascading-geo-fields";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RWANDA_PROVINCE_LIST,
  districtsForProvince,
} from "@/lib/geo/rwanda";

const STATUSES: AgentStatus[] = [
  "Candidate",
  "InTraining",
  "ExamPending",
  "Certified",
  "Inactive",
];

const EDUCATION_OPTIONS = [
  "Amashuri atatu yisumbuye",
  "Narangije ayisumbuye",
  "Narangije kaminuza",
] as const;

const selectClass =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-600";

const SECTION_HEADER =
  "border-b border-border bg-muted/50 dark:bg-surface-elevated";
const SECTION_TITLE = "text-base text-foreground";

interface AgentFormProps {
  initial?: Agent | null;
  coordinators: Array<{ id: string; name: string }>;
  provinces: string[];
  districts: string[];
  submitting?: boolean;
  /** When set (TC create), agent is locked to this coordinator. */
  lockTcUserId?: string;
  /** Hide the TC picker (TC/COA self-recruit flows). */
  hideTcSelect?: boolean;
  /** Require a TC selection before submit (Admin create). */
  requireTc?: boolean;
  onSubmit: (input: AgentInput) => void;
  onCancel: () => void;
}

function parseIsiboFromVenue(venue?: string): { venue: string; isibo: string } {
  if (!venue) return { venue: "", isibo: "" };
  const match = /^(.*?)(?:\s·\sIsibo\s(.+))?$/.exec(venue);
  if (!match) return { venue, isibo: "" };
  return { venue: (match[1] ?? "").trim(), isibo: (match[2] ?? "").trim() };
}

export function AgentForm({
  initial,
  coordinators,
  submitting,
  lockTcUserId,
  hideTcSelect = false,
  requireTc = true,
  onSubmit,
  onCancel,
}: AgentFormProps) {
  const parsedVenue = parseIsiboFromVenue(initial?.venue);

  const [name, setName] = useState(initial?.name ?? "");
  const [nidNumber, setNidNumber] = useState("");
  const [age, setAge] = useState(
    initial?.age != null ? String(initial.age) : "",
  );
  const [gender, setGender] = useState(initial?.gender ?? "Gabo");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [education, setEducation] = useState(
    initial?.education &&
      EDUCATION_OPTIONS.includes(
        initial.education as (typeof EDUCATION_OPTIONS)[number],
      )
      ? initial.education
      : "Narangije ayisumbuye",
  );
  const [tin, setTin] = useState(initial?.tin ?? "");
  const [businessType, setBusinessType] = useState(
    initial?.businessType ?? "",
  );
  const [geo, setGeo] = useState<CascadingGeoValue>({
    province:
      initial?.geo.province ?? RWANDA_PROVINCE_LIST[0] ?? "Kigali City",
    district:
      initial?.geo.district ??
      districtsForProvince(RWANDA_PROVINCE_LIST[0] ?? "Kigali City")[0] ??
      "",
    sector: initial?.geo.sector ?? "",
    cell: initial?.geo.cell ?? "",
    village: initial?.geo.village ?? "",
  });
  const [isibo, setIsibo] = useState(parsedVenue.isibo);
  const [venue, setVenue] = useState(parsedVenue.venue);
  const [emergencyName, setEmergencyName] = useState(
    initial?.emergencyContactName ?? "",
  );
  const [emergencyPhone, setEmergencyPhone] = useState(
    initial?.emergencyContactPhone ?? "",
  );
  const [criminalRecordBillId, setCriminalRecordBillId] = useState(
    initial?.criminalRecordBillId ?? "",
  );
  const [hasPrinterScanner, setHasPrinterScanner] = useState(
    initial?.hasPrinterScanner ?? false,
  );
  const [hasComputer, setHasComputer] = useState(
    initial?.hasComputer ?? false,
  );
  const [officeType, setOfficeType] = useState<"kiosk" | "room" | "desk">(
    initial?.officeType ?? "kiosk",
  );
  const [building, setBuilding] = useState(initial?.building ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [status, setStatus] = useState<AgentStatus>(
    initial?.status ?? "Candidate",
  );
  const [tcUserId, setTcUserId] = useState(
    lockTcUserId ?? initial?.tcUserId ?? coordinators[0]?.id ?? "",
  );

  const resolvedTc = lockTcUserId || tcUserId;
  const canSubmit = !submitting && (!requireTc || Boolean(resolvedTc));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const venueValue = isibo.trim()
      ? `${venue.trim()} · Isibo ${isibo.trim()}`
      : venue.trim();

    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      code: code.trim() || undefined,
      status,
      nidNumber: nidNumber.trim() || undefined,
      age: Number(age) || undefined,
      gender,
      education,
      tin: tin.trim(),
      businessType: businessType.trim(),
      venue: venueValue,
      emergencyContactName: emergencyName.trim(),
      emergencyContactPhone: emergencyPhone.trim(),
      criminalRecordBillId: criminalRecordBillId.trim(),
      hasPrinterScanner,
      hasComputer,
      officeType,
      building: building.trim(),
      geo: {
        province: geo.province,
        district: geo.district,
        sector: geo.sector,
        cell: geo.cell,
        village: geo.village || undefined,
      },
      registeredLocation: {
        lat: initial?.registeredLocation.lat ?? -1.9441,
        lng: initial?.registeredLocation.lng ?? 30.0619,
      },
      tcUserId: resolvedTc || null,
      services: {
        ...DEFAULT_AGENT_SERVICES,
        ...(initial?.services ?? {}),
        printer: hasPrinterScanner,
        smartphone: hasComputer,
      },
      clientsRegistered: initial?.clientsRegistered ?? 0,
      nidVerified: initial?.nidVerified ?? false,
      recruitedThisMonth: initial ? initial.recruitedThisMonth : true,
      reactivatedThisMonth: initial?.reactivatedThisMonth ?? false,
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Card className="border-border shadow-[var(--samu-shadow-card)]">
        <CardHeader className={SECTION_HEADER}>
          <CardTitle className={SECTION_TITLE}>Assignment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          {!hideTcSelect ? (
            <FormField label="Assigned TC" required={requireTc}>
              <Select value={tcUserId} onValueChange={setTcUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select coordinator" />
                </SelectTrigger>
                <SelectContent>
                  {coordinators.map((tc) => (
                    <SelectItem key={tc.id} value={tc.id}>
                      {tc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : lockTcUserId ? (
            <FormField label="Territory coordinator">
              <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground-secondary">
                Assigned to your territory automatically
              </p>
            </FormField>
          ) : (
            <FormField label="Territory coordinator">
              <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground-secondary">
                Recorded under your recruitment. An administrator can assign a
                territory coordinator later if required.
              </p>
            </FormField>
          )}
          <FormField label="Status" required>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as AgentStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Agent code" htmlFor="code" className="sm:col-span-2">
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Auto-generated if empty"
            />
          </FormField>
        </CardContent>
      </Card>

      <Card className="border-border shadow-[var(--samu-shadow-card)]">
        <CardHeader className={SECTION_HEADER}>
          <CardTitle className={SECTION_TITLE}>Identity & contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <FormField
            label="Full name"
            htmlFor="name"
            required
            className="sm:col-span-2"
          >
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>
          <FormField label="National ID number" htmlFor="nid" required>
            <Input
              id="nid"
              value={nidNumber}
              onChange={(e) => setNidNumber(e.target.value)}
              required={!initial}
              placeholder={
                initial ? `On file: ${initial.nidMasked}` : undefined
              }
            />
          </FormField>
          <FormField label="Age" htmlFor="age" required>
            <Input
              id="age"
              type="number"
              min={16}
              max={100}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Gender" required>
            <select
              className={selectClass}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="Gabo">Gabo</option>
              <option value="Gore">Gore</option>
            </select>
          </FormField>
          <FormField label="Phone" htmlFor="phone" required>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Education" required>
            <select
              className={selectClass}
              value={education}
              onChange={(e) => setEducation(e.target.value)}
            >
              {EDUCATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="TIN Number" htmlFor="tin" required>
            <Input
              id="tin"
              value={tin}
              onChange={(e) => setTin(e.target.value)}
              required
            />
          </FormField>
          <FormField
            label="Business type"
            htmlFor="businessType"
            required
            className="sm:col-span-2"
          >
            <Input
              id="businessType"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="e.g. Online service, papeterie…"
              required
            />
          </FormField>
        </CardContent>
      </Card>

      <Card className="border-border shadow-[var(--samu-shadow-card)]">
        <CardHeader className={SECTION_HEADER}>
          <CardTitle className={SECTION_TITLE}>Location</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-4 sm:col-span-2">
            <CascadingGeoFields value={geo} onChange={setGeo} required showVillage />
          </div>
          <FormField label="Isibo" htmlFor="isibo" required>
            <Input
              id="isibo"
              value={isibo}
              onChange={(e) => setIsibo(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Venue" htmlFor="venue" required>
            <Input
              id="venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. sector office, center…"
              required
            />
          </FormField>
        </CardContent>
      </Card>

      <Card className="border-border shadow-[var(--samu-shadow-card)]">
        <CardHeader className={SECTION_HEADER}>
          <CardTitle className={SECTION_TITLE}>
            Emergency contact & compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <FormField
            label="Emergency contact name"
            htmlFor="emergencyName"
            required
          >
            <Input
              id="emergencyName"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              required
            />
          </FormField>
          <FormField
            label="Emergency contact phone"
            htmlFor="emergencyPhone"
            required
          >
            <Input
              id="emergencyPhone"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              required
            />
          </FormField>
          <FormField
            label="Criminal record certificate (Bill ID)"
            htmlFor="criminalBill"
            required
            className="sm:col-span-2"
          >
            <Input
              id="criminalBill"
              value={criminalRecordBillId}
              onChange={(e) => setCriminalRecordBillId(e.target.value)}
              required
            />
          </FormField>
        </CardContent>
      </Card>

      <Card className="border-border shadow-[var(--samu-shadow-card)]">
        <CardHeader className={SECTION_HEADER}>
          <CardTitle className={SECTION_TITLE}>Tools & workplace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <fieldset className="space-y-2 rounded-md border border-border p-3">
            <legend className="px-1 text-sm font-medium">
              Required tools
              <span className="ml-0.5 text-[var(--samu-danger)]" aria-hidden>
                *
              </span>
            </legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasPrinterScanner}
                onChange={(e) => setHasPrinterScanner(e.target.checked)}
              />
              Printer with a scanner
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasComputer}
                onChange={(e) => setHasComputer(e.target.checked)}
              />
              Computer
            </label>
          </fieldset>

          <FormField label="Office location" required>
            <div className="flex flex-wrap gap-3 text-sm">
              {(["kiosk", "room", "desk"] as const).map((opt) => (
                <label key={opt} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="officeType"
                    checked={officeType === opt}
                    onChange={() => setOfficeType(opt)}
                  />
                  {opt === "kiosk" ? "Kiosk" : opt === "room" ? "Room" : "Desk"}
                </label>
              ))}
            </div>
          </FormField>

          <FormField label="Building / location detail" htmlFor="building" required>
            <Input
              id="building"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              required
            />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? "Saving…" : initial ? "Save changes" : "Create agent"}
        </Button>
      </div>
    </form>
  );
}
