"use client";

import { useEffect, useMemo, useState } from "react";
import type { AgentInput } from "@/lib/api";
import { DEFAULT_AGENT_SERVICES } from "@/lib/api";
import type { Agent, AgentServices, AgentStatus } from "@/types";
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

const STATUSES: AgentStatus[] = [
  "Active",
  "Inactive",
  "Suspended",
  "Pending verification",
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
  onSubmit,
  onCancel,
}: AgentFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [status, setStatus] = useState<AgentStatus>(initial?.status ?? "Active");
  const [province, setProvince] = useState(initial?.geo.province ?? provinces[0] ?? "");
  const [district, setDistrict] = useState(initial?.geo.district ?? "");
  const [sector, setSector] = useState(initial?.geo.sector ?? "");
  const [cell, setCell] = useState(initial?.geo.cell ?? "");
  const [lat, setLat] = useState(String(initial?.registeredLocation.lat ?? -1.95));
  const [lng, setLng] = useState(String(initial?.registeredLocation.lng ?? 30.06));
  const [tcUserId, setTcUserId] = useState(
    initial?.tcUserId ?? coordinators[0]?.id ?? "",
  );
  const [nidVerified, setNidVerified] = useState(initial?.nidVerified ?? false);
  const [clientsRegistered, setClientsRegistered] = useState(
    String(initial?.clientsRegistered ?? 0),
  );
  const [services, setServices] = useState<AgentServices>(servicesFromAgent(initial));

  const districtOptions = useMemo(() => {
    if (!province) return districts;
    // Keep all known districts available; province is free-form for new agents too.
    return districts;
  }, [districts, province]);

  useEffect(() => {
    if (!district && districtOptions[0]) setDistrict(districtOptions[0]);
  }, [district, districtOptions]);

  function toggleService(key: keyof AgentServices, value: boolean | string) {
    setServices((prev) => ({
      ...prev,
      [key]: value,
    }) as AgentServices);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit({
      name,
      phone,
      email: email || undefined,
      code: code || undefined,
      status,
      geo: { province, district, sector, cell },
      registeredLocation: {
        lat: Number(lat),
        lng: Number(lng),
      },
      tcUserId,
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
      <Card>
        <CardHeader>
          <CardTitle>Identity & contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Agent code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Auto-generated if empty"
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as AgentStatus)}>
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
          </div>
          <div className="space-y-2">
            <Label>Assigned TC</Label>
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="clients">Clients registered</Label>
            <Input
              id="clients"
              type="number"
              min={0}
              value={clientsRegistered}
              onChange={(e) => setClientsRegistered(e.target.value)}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-sm">
            <Checkbox
              checked={nidVerified}
              onCheckedChange={(checked) => setNidVerified(checked === true)}
            />
            NID verified
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Province</Label>
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger>
                <SelectValue placeholder="Select province" />
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="sector">Sector</Label>
            <Input id="sector" value={sector} onChange={(e) => setSector(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cell">Cell</Label>
            <Input id="cell" value={cell} onChange={(e) => setCell(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lat">Registered latitude</Label>
            <Input id="lat" value={lat} onChange={(e) => setLat(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng">Registered longitude</Label>
            <Input id="lng" value={lng} onChange={(e) => setLng(e.target.value)} required />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service readiness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        <Button type="submit" disabled={submitting || !tcUserId}>
          {submitting ? "Saving…" : initial ? "Save changes" : "Create agent"}
        </Button>
      </div>
    </form>
  );
}
