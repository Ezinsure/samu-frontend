"use client";

import { useState } from "react";
import type { AgentInput } from "@/lib/api";
import { DEFAULT_AGENT_SERVICES } from "@/lib/api";
import type { Agent, AgentServices, AgentStatus } from "@/types";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

const INTERNET_TYPES = [
  "Solektra Telecom",
  "MTN",
  "Airtel",
  "Mango",
  "Other",
];

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

function servicesFromAgent(agent?: Agent | null): AgentServices {
  return agent?.services ? { ...agent.services } : { ...DEFAULT_AGENT_SERVICES };
}

export function AgentForm({
  initial,
  coordinators,
  provinces,
  districts,
  submitting,
  lockTcUserId,
  hideTcSelect = false,
  requireTc = true,
  onSubmit,
  onCancel,
}: AgentFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [status, setStatus] = useState<AgentStatus>(
    initial?.status ?? "Candidate",
  );
  const [province, setProvince] = useState(
    initial?.geo.province ?? provinces[0] ?? "",
  );
  const [district, setDistrict] = useState(initial?.geo.district ?? "");
  const [sector, setSector] = useState(initial?.geo.sector ?? "");
  const [cell, setCell] = useState(initial?.geo.cell ?? "");
  const [village, setVillage] = useState(initial?.geo.village ?? "");
  const [lat, setLat] = useState(
    String(initial?.registeredLocation.lat ?? -1.95),
  );
  const [lng, setLng] = useState(
    String(initial?.registeredLocation.lng ?? 30.06),
  );
  const [tcUserId, setTcUserId] = useState(
    lockTcUserId ?? initial?.tcUserId ?? coordinators[0]?.id ?? "",
  );
  const [nidVerified, setNidVerified] = useState(initial?.nidVerified ?? false);
  const [clientsRegistered, setClientsRegistered] = useState(
    String(initial?.clientsRegistered ?? 0),
  );
  const [services, setServices] = useState<AgentServices>(
    servicesFromAgent(initial),
  );

  const provinceOptions =
    provinces.length > 0 ? provinces : RWANDA_PROVINCE_LIST;
  const districtOptions = districtsForProvince(province).length
    ? districtsForProvince(province)
    : districts;
  const selectedDistrict = districtOptions.includes(district)
    ? district
    : districtOptions[0] || "";

  const resolvedTc = lockTcUserId || tcUserId;
  const canSubmit = !submitting && (!requireTc || Boolean(resolvedTc));

  function toggleService(key: keyof AgentServices, value: boolean | string) {
    setServices(
      (prev) =>
        ({
          ...prev,
          [key]: value,
        }) as AgentServices,
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit({
      name,
      phone,
      email: email || undefined,
      code: code || undefined,
      status,
      geo: {
        province,
        district: selectedDistrict,
        sector,
        cell,
        village: village || undefined,
      },
      registeredLocation: {
        lat: Number(lat),
        lng: Number(lng),
      },
      tcUserId: resolvedTc || null,
      services,
      clientsRegistered: Number(clientsRegistered) || 0,
      nidVerified,
      recruitedThisMonth: initial ? initial.recruitedThisMonth : true,
      reactivatedThisMonth: initial?.reactivatedThisMonth ?? false,
    });
  }

  const serviceChecks: Array<{ key: keyof AgentServices; label: string }> = [
    { key: "iremboTools", label: "IREMBO tools" },
    { key: "insuranceTools", label: "Insurance tools" },
    { key: "telecomTools", label: "Telecom / internet tools" },
    { key: "bkTools", label: "BK / financial inclusion tools" },
    { key: "smartphone", label: "Smartphone" },
    { key: "printer", label: "Printer" },
    { key: "internetAvailable", label: "Internet available" },
    { key: "starlinkReady", label: "Starlink-ready" },
    { key: "cleanCookingTools", label: "Clean cooking tools" },
    { key: "brandingVisible", label: "Branding visible" },
    { key: "trainedOnServices", label: "Trained on COAP services" },
    { key: "activelySelling", label: "Actively selling" },
  ];

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Card className="border-border shadow-[var(--samu-shadow-card)]">
        <CardHeader className="border-b border-border bg-primary-50/60">
          <CardTitle className="text-base text-primary-900">
            Identity & contact
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <FormField label="Full name" htmlFor="name" required className="sm:col-span-2">
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Phone" htmlFor="phone" required>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
          <FormField label="Agent code" htmlFor="code">
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Auto-generated if empty"
            />
          </FormField>
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
            <div className="space-y-1.5">
              <Label>Assignment</Label>
              <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground-secondary">
                Assigned to you automatically
              </p>
            </div>
          ) : null}
          <FormField label="Clients registered" htmlFor="clients">
            <Input
              id="clients"
              type="number"
              min={0}
              value={clientsRegistered}
              onChange={(e) => setClientsRegistered(e.target.value)}
            />
          </FormField>
          <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-sm">
            <Checkbox
              checked={nidVerified}
              onCheckedChange={(checked) => setNidVerified(checked === true)}
            />
            NID verified
          </label>
        </CardContent>
      </Card>

      <Card className="border-border shadow-[var(--samu-shadow-card)]">
        <CardHeader className="border-b border-border bg-primary-50/60">
          <CardTitle className="text-base text-primary-900">Location</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <FormField label="Province" required>
            <Select
              value={province}
              onValueChange={(next) => {
                setProvince(next);
                setDistrict(districtsForProvince(next)[0] ?? "");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {provinceOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="District" required>
            <Select value={selectedDistrict} onValueChange={setDistrict}>
              <SelectTrigger>
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                {districtOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Sector" htmlFor="sector" required>
            <Input
              id="sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Cell" htmlFor="cell" required>
            <Input
              id="cell"
              value={cell}
              onChange={(e) => setCell(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Village" htmlFor="village">
            <Input
              id="village"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="Free text"
            />
          </FormField>
          <FormField label="Registered latitude" htmlFor="lat" required>
            <Input
              id="lat"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Registered longitude" htmlFor="lng" required>
            <Input
              id="lng"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              required
            />
          </FormField>
        </CardContent>
      </Card>

      <Card className="border-border shadow-[var(--samu-shadow-card)]">
        <CardHeader className="border-b border-border bg-primary-50/60">
          <CardTitle className="text-base text-primary-900">
            Service readiness
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {serviceChecks.map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <Checkbox
                  checked={Boolean(services[item.key])}
                  onCheckedChange={(checked) =>
                    toggleService(item.key, checked === true)
                  }
                />
                {item.label}
              </label>
            ))}
          </div>
          {services.internetAvailable ? (
            <div className="max-w-sm space-y-2">
              <Label>Internet type</Label>
              <Select
                value={services.internetType ?? "Solektra Telecom"}
                onValueChange={(value) => toggleService("internetType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERNET_TYPES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
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
