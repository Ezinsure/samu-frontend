"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  CascadingGeoFields,
  type CascadingGeoValue,
} from "@/components/shared/cascading-geo-fields";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RWANDA_PROVINCE_LIST, districtsForProvince } from "@/lib/geo/rwanda";
import { apiRequest } from "@/lib/http/client";
import {
  isValidNid,
  isValidRwandaMobile,
  normalizeNidDigits,
  normalizeRwandaMobile,
  nidInputProps,
  rwandaPhoneInputProps,
} from "@/lib/validation/fields";

const WHATSAPP_NOTE =
  "Iyo umaze kohereza ibisabwa, winjira kuri group ya WhatsApp uhabwe amakuru y'itangwa rya Konti. Gutanga Konti bikorwa buri gihembwe. Konti y'irembo ihabwa uwujuje ibyasabwe, witabiriye amahugurwa, wakoze isuzumabumenyi akabona amanota 80%.";

const selectClass =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-600";

export default function JoinNetworkPage() {
  const params = useParams<{ token?: string[] }>();
  const inviteToken = params.token?.[0];

  const [geo, setGeo] = useState<CascadingGeoValue>({
    province: RWANDA_PROVINCE_LIST[0] ?? "Kigali City",
    district:
      districtsForProvince(RWANDA_PROVINCE_LIST[0] ?? "Kigali City")[0] ?? "",
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
    () => (partial: Partial<typeof form>) =>
      setForm((f) => ({ ...f, ...partial })),
    [],
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nid = normalizeNidDigits(form.nimeroIrangamuntu);
    if (!isValidNid(nid, { exact16: true })) {
      toast.error("Nimero y'irangamuntu igomba kuba imibare 16");
      return;
    }
    if (!isValidRwandaMobile(form.telefone)) {
      toast.error("Telefone igomba gutangira na 07");
      return;
    }
    if (!isValidRwandaMobile(form.emergencyPhone)) {
      toast.error("Telefone y'ubutabazi igomba gutangira na 07");
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("/public/network-register", {
        method: "POST",
        body: {
          inviteToken,
          amazina: form.amazina,
          nimeroIrangamuntu: nid,
          imyaka: Number(form.imyaka),
          igitsina: form.igitsina,
          telefone: normalizeRwandaMobile(form.telefone),
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
          emergencyPhone: normalizeRwandaMobile(form.emergencyPhone),
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
        description:
          error instanceof Error ? error.message : "Gerageza nanone",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-[var(--samu-background)]">
        <JoinBrandBar />
        <div className="mx-auto max-w-xl px-4 py-10">
          <Card className="border-border shadow-[var(--samu-shadow-card)]">
            <CardHeader>
              <CardTitle className="text-primary-900">Byoherejwe neza</CardTitle>
              <CardDescription>
                Wiyandikishije nk&apos;umukandida w&apos;umukozi (Agent
                candidate). Team ya Solektra izasuzuma ubusabe bwawe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-foreground-muted">
              <p>{WHATSAPP_NOTE}</p>
              <p>
                WhatsApp group:{" "}
                <a
                  className="font-medium text-primary-600 underline"
                  href="https://chat.whatsapp.com/GcllsuWzEXS4Lk1XlbHbxf"
                  target="_blank"
                  rel="noreferrer"
                >
                  Fungura group
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--samu-background)]">
      <JoinBrandBar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card className="overflow-hidden border-border shadow-[var(--samu-shadow-card)]">
          <div className="border-b border-border bg-primary-900 px-6 py-5 text-foreground-on-navy">
            <p className="text-xs font-medium uppercase tracking-wider text-primary-100">
              Solektra Agent Monitoring Utility
            </p>
            <h1 className="mt-1 text-lg font-semibold leading-snug sm:text-xl">
              IBYANGOMBWA BISABWA KUGIRANGO UBE AGENT W&apos;IREMBO
            </h1>
            <p className="mt-2 text-sm text-primary-100/90">
              Uzuza form iyi. Ntabwo ukenera konti ya SAMU.
              {inviteToken ? " Link ya recruiter yemejwe." : null}
            </p>
          </div>
          <CardContent className="pt-6">
            <form className="space-y-5" onSubmit={onSubmit}>
              <Section title="Umwirondoro">
                <FormField label="Amazina" required>
                  <Input
                    required
                    value={form.amazina}
                    onChange={(e) => patch({ amazina: e.target.value })}
                  />
                </FormField>
                <FormField label="Nimero y'irangamuntu" required>
                  <Input
                    required
                    value={form.nimeroIrangamuntu}
                    onChange={(e) =>
                      patch({
                        nimeroIrangamuntu: normalizeNidDigits(e.target.value),
                      })
                    }
                    {...nidInputProps()}
                    placeholder="Imibare 16"
                  />
                </FormField>
                <FormField label="Imyaka yawe" required>
                  <Input
                    required
                    type="number"
                    min={16}
                    max={100}
                    value={form.imyaka}
                    onChange={(e) => patch({ imyaka: e.target.value })}
                  />
                </FormField>
                <FormField label="Igitsina cyawe" required>
                  <select
                    className={selectClass}
                    value={form.igitsina}
                    onChange={(e) => patch({ igitsina: e.target.value })}
                  >
                    <option value="Gabo">Gabo</option>
                    <option value="Gore">Gore</option>
                  </select>
                </FormField>
                <FormField label="Nomero ya telefone" required>
                  <Input
                    required
                    value={form.telefone}
                    onChange={(e) => patch({ telefone: e.target.value })}
                    {...rwandaPhoneInputProps()}
                  />
                </FormField>
                <FormField label="Email" required>
                  <Input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => patch({ email: e.target.value })}
                  />
                </FormField>
                <FormField label="Amashuri wize" required>
                  <select
                    className={selectClass}
                    value={form.amashuri}
                    onChange={(e) => patch({ amashuri: e.target.value })}
                  >
                    <option value="Amashuri atatu yisumbuye">
                      Amashuri atatu yisumbuye
                    </option>
                    <option value="Narangije ayisumbuye">
                      Narangije ayisumbuye
                    </option>
                    <option value="Narangije kaminuza">
                      Narangije kaminuza
                    </option>
                  </select>
                </FormField>
                <FormField label="TIN Number" required>
                  <Input
                    required
                    value={form.tin}
                    onChange={(e) => patch({ tin: e.target.value })}
                  />
                </FormField>
                <FormField label="Ubwoko bwa bizinesi ukora" required>
                  <Input
                    required
                    value={form.ubwokoBizinesi}
                    onChange={(e) =>
                      patch({ ubwokoBizinesi: e.target.value })
                    }
                    placeholder="Urugero: Online service, papeterie…"
                  />
                </FormField>
              </Section>

              <Section title="Aho uherereye">
                <CascadingGeoFields
                  value={geo}
                  onChange={setGeo}
                  kinyarwanda
                  showVillage
                  required
                />
                <FormField label="Isibo" required>
                  <Input
                    required
                    value={form.isibo}
                    onChange={(e) => patch({ isibo: e.target.value })}
                  />
                </FormField>
                <FormField
                  label="Venue (urugero: sector office, center…)"
                  required
                >
                  <Input
                    required
                    value={form.venue}
                    onChange={(e) => patch({ venue: e.target.value })}
                  />
                </FormField>
              </Section>

              <Section title="Umwirondoro w'ubufasha">
                <FormField
                  label="Amazina y'umuntu twabaza amakuru yawe"
                  required
                >
                  <Input
                    required
                    value={form.emergencyName}
                    onChange={(e) =>
                      patch({ emergencyName: e.target.value })
                    }
                  />
                </FormField>
                <FormField
                  label="Nomero ya telefone y'umuntu twabaza amakuru yawe"
                  required
                >
                  <Input
                    required
                    value={form.emergencyPhone}
                    onChange={(e) =>
                      patch({ emergencyPhone: e.target.value })
                    }
                    {...rwandaPhoneInputProps()}
                  />
                </FormField>
                <FormField
                  label="Icyemezo cy'uko utakatiwe n'inkiko (Bill ID)"
                  required
                >
                  <Input
                    required
                    value={form.criminalRecordBillId}
                    onChange={(e) =>
                      patch({ criminalRecordBillId: e.target.value })
                    }
                  />
                </FormField>
              </Section>

              <Section title="Ibikoresho n'aho ukorera">
                <fieldset className="space-y-2 rounded-md border border-border p-3">
                  <legend className="px-1 text-sm font-medium">
                    Ibikoresho bisabwa
                    <span
                      className="ml-0.5 text-[var(--samu-danger)]"
                      aria-hidden
                    >
                      *
                    </span>
                  </legend>
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
                      onChange={(e) =>
                        patch({ hasComputer: e.target.checked })
                      }
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
                          checked={form.officeType === opt}
                          onChange={() => patch({ officeType: opt })}
                        />
                        {opt === "kiosk"
                          ? "Kiosk"
                          : opt === "room"
                            ? "Room"
                            : "Desk"}
                      </label>
                    ))}
                  </div>
                </FormField>
                <FormField label="Building / aho biherereye" required>
                  <Input
                    required
                    value={form.building}
                    onChange={(e) => patch({ building: e.target.value })}
                  />
                </FormField>
              </Section>

              <Button
                type="submit"
                className="h-11 w-full text-base"
                disabled={submitting}
              >
                {submitting ? "Kohereza…" : "Ohereza"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function JoinBrandBar() {
  return (
    <header className="border-b border-white/10 bg-primary-900 text-foreground-on-navy">
      <div className="mx-auto flex max-w-2xl items-center gap-2.5 px-4 py-3.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-primary-600 text-sm font-bold">
          S
        </span>
        <div>
          <p className="text-sm font-bold tracking-tight">SAMU</p>
          <p className="text-[10px] text-primary-100/80">Agent Network</p>
        </div>
      </div>
    </header>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-primary-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
