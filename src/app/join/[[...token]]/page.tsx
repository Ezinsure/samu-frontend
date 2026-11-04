"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  CascadingGeoFields,
  type CascadingGeoValue,
} from "@/components/shared/cascading-geo-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RWANDA_PROVINCE_LIST, districtsForProvince } from "@/lib/geo/rwanda";
import { apiRequest } from "@/lib/http/client";

const WHATSAPP_NOTE =
  "Iyo umaze kohereza ibisabwa, winjira kuri group ya WhatsApp uhabwe amakuru y'itangwa rya Konti. Gutanga Konti bikorwa buri gihembwe. Konti y'irembo ihabwa uwujuje ibyasabwe, witabiriye amahugurwa, wakoze isuzumabumenyi akabona amanota 80%.";

export default function JoinNetworkPage() {
  const params = useParams<{ token?: string[] }>();
  const inviteToken = params.token?.[0];

  const [geo, setGeo] = useState<CascadingGeoValue>({
    province: RWANDA_PROVINCE_LIST[0] ?? "Kigali City",
    district: districtsForProvince(RWANDA_PROVINCE_LIST[0] ?? "Kigali City")[0] ?? "",
    sector: "",
    cell: "",
    village: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    amazina: "",
    nimeroIrangamuntu: "",
    imyaka: "",
    igitsina: "Gabo",
    telefone: "",
    email: "",
    amashuri: "Narangije ayisumbuye",
    tin: "",
    ubwokoBizinesi: "",
    isibo: "",
    venue: "",
    emergencyName: "",
    emergencyPhone: "",
    criminalRecordBillId: "",
    hasPrinterScanner: false,
    hasComputer: false,
    officeType: "kiosk",
    building: "",
  });

  const patch = useMemo(
    () => (partial: Partial<typeof form>) => setForm((f) => ({ ...f, ...partial })),
    [],
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest("/public/network-register", {
        method: "POST",
        body: {
          inviteToken,
          amazina: form.amazina,
          nimeroIrangamuntu: form.nimeroIrangamuntu,
          imyaka: Number(form.imyaka),
          igitsina: form.igitsina,
          telefone: form.telefone,
          email: form.email,
          amashuri: form.amashuri,
          tin: form.tin,
          ubwokoBizinesi: form.ubwokoBizinesi,
          akarere: geo.district,
          umurenge: geo.sector,
          akagari: geo.cell,
          umudugudu: geo.village || geo.cell,
          isibo: form.isibo,
          venue: form.venue,
          emergencyName: form.emergencyName,
          emergencyPhone: form.emergencyPhone,
          criminalRecordBillId: form.criminalRecordBillId,
          hasPrinterScanner: form.hasPrinterScanner,
          hasComputer: form.hasComputer,
          officeType: form.officeType,
          building: form.building,
          province: geo.province,
        },
      });
      setDone(true);
      toast.success("Kwiyandikisha byagenze neza");
    } catch (error) {
      toast.error("Ntibishoboye kohereza", {
        description: error instanceof Error ? error.message : "Gerageza nanone",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Byoherejwe neza</CardTitle>
            <CardDescription>
              Wiyandikishije nk&apos;umukandida w&apos;umukozi (Agent candidate).
              Team ya Solektra izasuzuma ubusabe bwawe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground-muted">
            <p>{WHATSAPP_NOTE}</p>
            <p>
              WhatsApp group:{" "}
              <a
                className="text-primary-600 underline"
                href="https://chat.whatsapp.com/GcllsuWzEXS4Lk1XlbHbxf"
                target="_blank"
                rel="noreferrer"
              >
                Fungura group
              </a>
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>IBYANGOMBWA BISABWA KUGIRANGO UBE AGENT W&apos;IREMBO</CardTitle>
          <CardDescription>
            Uzuza form iyi. Ntabwo ukenera konti ya SAMU.
            {inviteToken ? " Link ya recruiter yemejwe." : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Field label="Amazina *">
              <Input
                required
                value={form.amazina}
                onChange={(e) => patch({ amazina: e.target.value })}
              />
            </Field>
            <Field label="Nimero y'irangamuntu *">
              <Input
                required
                value={form.nimeroIrangamuntu}
                onChange={(e) => patch({ nimeroIrangamuntu: e.target.value })}
              />
            </Field>
            <Field label="Imyaka yawe *">
              <Input
                required
                type="number"
                min={16}
                max={100}
                value={form.imyaka}
                onChange={(e) => patch({ imyaka: e.target.value })}
              />
            </Field>
            <Field label="Igitsina cyawe *">
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={form.igitsina}
                onChange={(e) => patch({ igitsina: e.target.value })}
              >
                <option value="Gabo">Gabo</option>
                <option value="Gore">Gore</option>
              </select>
            </Field>
            <Field label="Nomero ya telefone *">
              <Input
                required
                value={form.telefone}
                onChange={(e) => patch({ telefone: e.target.value })}
              />
            </Field>
            <Field label="Email *">
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => patch({ email: e.target.value })}
              />
            </Field>
            <Field label="Amashuri wize *">
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={form.amashuri}
                onChange={(e) => patch({ amashuri: e.target.value })}
              >
                <option value="Amashuri atatu yisumbuye">
                  Amashuri atatu yisumbuye
                </option>
                <option value="Narangije ayisumbuye">Narangije ayisumbuye</option>
                <option value="Narangije kaminuza">Narangije kaminuza</option>
              </select>
            </Field>
            <Field label="TIN Number *">
              <Input
                required
                value={form.tin}
                onChange={(e) => patch({ tin: e.target.value })}
              />
            </Field>
            <Field label="Ubwoko bwa bizinesi ukora *">
              <Input
                required
                value={form.ubwokoBizinesi}
                onChange={(e) => patch({ ubwokoBizinesi: e.target.value })}
                placeholder="Urugero: Online service, papeterie…"
              />
            </Field>

            <CascadingGeoFields
              value={geo}
              onChange={setGeo}
              kinyarwanda
              showVillage
            />

            <Field label="Isibo *">
              <Input
                required
                value={form.isibo}
                onChange={(e) => patch({ isibo: e.target.value })}
              />
            </Field>
            <Field label="Venue (urugero: sector office, center…) *">
              <Input
                required
                value={form.venue}
                onChange={(e) => patch({ venue: e.target.value })}
              />
            </Field>
            <Field label="Amazina y'umuntu twabaza amakuru yawe *">
              <Input
                required
                value={form.emergencyName}
                onChange={(e) => patch({ emergencyName: e.target.value })}
              />
            </Field>
            <Field label="Nomero ya telefone y'umuntu twabaza amakuru yawe *">
              <Input
                required
                value={form.emergencyPhone}
                onChange={(e) => patch({ emergencyPhone: e.target.value })}
              />
            </Field>
            <Field label="Icyemezo cy'uko utakatiwe n'inkiko (Bill ID) *">
              <Input
                required
                value={form.criminalRecordBillId}
                onChange={(e) => patch({ criminalRecordBillId: e.target.value })}
              />
            </Field>

            <fieldset className="space-y-2 rounded-md border border-border p-3">
              <legend className="px-1 text-sm font-medium">Ibikoresho bisabwa *</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.hasPrinterScanner}
                  onChange={(e) =>
                    patch({ hasPrinterScanner: e.target.checked })
                  }
                />
                Printer with a scanner
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.hasComputer}
                  onChange={(e) => patch({ hasComputer: e.target.checked })}
                />
                Computer
              </label>
            </fieldset>

            <Field label="Office location *">
              <div className="flex flex-wrap gap-3 text-sm">
                {(["kiosk", "room", "desk"] as const).map((opt) => (
                  <label key={opt} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="officeType"
                      checked={form.officeType === opt}
                      onChange={() => patch({ officeType: opt })}
                    />
                    {opt === "kiosk" ? "Kiosk" : opt === "room" ? "Room" : "Desk"}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Building / aho biherereye *">
              <Input
                required
                value={form.building}
                onChange={(e) => patch({ building: e.target.value })}
              />
            </Field>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Kohereza…" : "Ohereza"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
