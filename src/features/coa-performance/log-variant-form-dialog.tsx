"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Upload } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StockSerialPicker } from "@/features/inventory/stock-serial-picker";
import {
  createCoaEntry,
  uploadCoaGpsPhoto,
} from "@/lib/api/coa-performance";
import type { CoaMetric, CoaMetricVariant } from "@/lib/api/coa-metrics";
import { useAuth } from "@/lib/auth/auth-context";
import {
  isValidNid,
  isValidRwandaMobile,
  normalizeNidDigits,
  normalizeRwandaMobile,
  nidInputProps,
  rwandaPhoneInputProps,
} from "@/lib/validation/fields";

function stockTypeForField(
  fieldKey: string,
  variantKey: string,
): string | null {
  if (fieldKey === "simNumber") return "sim_4g";
  if (fieldKey === "fourGNumber") return "sim_4g";
  if (fieldKey === "routerSerial") {
    if (variantKey === "obb") return "router_obb";
    return "router_hbb";
  }
  return null;
}

interface LogVariantFormDialogProps {
  metric: CoaMetric | null;
  variant: CoaMetricVariant | null;
  month: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

type FormValues = Record<string, string>;

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function LogVariantFormDialog({
  metric,
  variant,
  month,
  open,
  onOpenChange,
  onSaved,
}: LogVariantFormDialogProps) {
  const { user } = useAuth();
  const schema = variant?.fieldSchema ?? [];

  const defaults = useMemo(() => {
    const values: FormValues = {};
    for (const field of schema) {
      if (field.type === "date") values[field.key] = todayIsoDate();
      else if (field.defaultFrom === "actorName") values[field.key] = user?.name ?? "";
      else if (field.defaultFrom === "actorDistrict") {
        values[field.key] = user?.workingDistrict ?? "";
      } else if (field.type === "select" && field.options?.[0]) {
        values[field.key] = field.options[0].value;
      } else {
        values[field.key] = "";
      }
    }
    return values;
  }, [schema, user?.name, user?.workingDistrict]);

  const [values, setValues] = useState<FormValues>({});
  const [stockUnitByField, setStockUnitByField] = useState<
    Record<string, string>
  >({});
  const [notes, setNotes] = useState("");
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsPhotoKey, setGpsPhotoKey] = useState<string | null>(null);
  const [gpsPhotoName, setGpsPhotoName] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(defaults);
      setStockUnitByField({});
      setNotes("");
      setGpsLat(null);
      setGpsLng(null);
      setGpsAccuracy(null);
      setGpsPhotoKey(null);
      setGpsPhotoName(null);
    }
  }, [open, defaults]);

  function patch(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLat(pos.coords.latitude);
        setGpsLng(pos.coords.longitude);
        setGpsAccuracy(
          Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
        );
        setLocating(false);
        toast.success("Location captured");
      },
      (err) => {
        setLocating(false);
        toast.error("Could not get location", {
          description: err.message || "Allow location access and try again.",
        });
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }

  async function onGpsPhotoSelected(file: File | undefined) {
    if (!file) return;
    setUploadingPhoto(true);
    const result = await uploadCoaGpsPhoto(file);
    setUploadingPhoto(false);
    if (!result.ok) {
      toast.error("Could not upload GPS photo", { description: result.error });
      return;
    }
    setGpsPhotoKey(result.data.storageKey);
    setGpsPhotoName(file.name);
    toast.success("GPS photo uploaded");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!metric || !variant) return;

    for (const field of schema) {
      if (field.type === "gps") {
        const hasCoords = gpsLat != null && gpsLng != null;
        if (field.required && !hasCoords && !gpsPhotoKey) {
          toast.error("Capture GPS coordinates or upload a map photo");
          return;
        }
        continue;
      }
      const stockType = stockTypeForField(field.key, variant.key);
      if (stockType) {
        if (field.required && !stockUnitByField[field.key]) {
          toast.error(`Select ${field.label} from your stock`);
          return;
        }
        continue;
      }
      const raw = (values[field.key] ?? "").trim();
      if (field.required && !raw) {
        toast.error(`${field.label} is required`);
        return;
      }
      if (!raw) continue;
      if (field.type === "phone" && !isValidRwandaMobile(raw)) {
        toast.error(`${field.label} must start with 07`);
        return;
      }
      if (field.type === "nid" && !isValidNid(raw, { exact16: true })) {
        toast.error(`${field.label} must be exactly 16 digits`);
        return;
      }
    }

    const stockUnitIds = [
      ...new Set(Object.values(stockUnitByField).filter(Boolean)),
    ];

    const data: Record<string, unknown> = {};
    const client: {
      fullName?: string;
      phone?: string;
      email?: string;
      nidNumber?: string;
      accountRef?: string;
      simNumber?: string;
      variantKey: string;
      data?: Record<string, unknown>;
      gpsLat?: number;
      gpsLng?: number;
      gpsPhotoKey?: string;
      stockUnitIds?: string[];
    } = { variantKey: variant.key, stockUnitIds };

    for (const field of schema) {
      if (field.type === "gps") continue;
      let raw = (values[field.key] ?? "").trim();
      if (!raw) continue;
      if (field.type === "phone") raw = normalizeRwandaMobile(raw);
      if (field.type === "nid") raw = normalizeNidDigits(raw);

      if (field.mapsTo === "fullName") client.fullName = raw;
      else if (field.mapsTo === "phone") client.phone = raw;
      else if (field.mapsTo === "email") client.email = raw;
      else if (field.mapsTo === "nidNumber") client.nidNumber = raw;
      else if (field.mapsTo === "accountRef") client.accountRef = raw;
      else if (field.mapsTo === "simNumber") client.simNumber = raw;
      else data[field.key] = raw;
    }

    if (Object.keys(data).length > 0) client.data = data;
    if (gpsLat != null && gpsLng != null) {
      client.gpsLat = gpsLat;
      client.gpsLng = gpsLng;
    }
    if (gpsPhotoKey) client.gpsPhotoKey = gpsPhotoKey;

    setSaving(true);
    const result = await createCoaEntry({
      metricKey: metric.key,
      month,
      variantKey: variant.key,
      notes: notes.trim() || undefined,
      clients: [client],
    });
    setSaving(false);

    if (!result.ok) {
      toast.error("Could not save", { description: result.error });
      return;
    }

    toast.success(`${variant.label} logged`);
    onSaved();
    onOpenChange(false);
  }

  const mapPreviewUrl =
    gpsLat != null && gpsLng != null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${gpsLng - 0.01}%2C${gpsLat - 0.01}%2C${gpsLng + 0.01}%2C${gpsLat + 0.01}&layer=mapnik&marker=${gpsLat}%2C${gpsLng}`
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{variant?.label ?? "Log activation"}</DialogTitle>
          <DialogDescription>
            {metric?.label} · {month}
            {variant?.key === "hbb" || variant?.key === "obb"
              ? ` · Product type ${variant.key.toUpperCase()}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid gap-3 sm:grid-cols-2">
            {schema.map((field) => {
              const stockType = stockTypeForField(field.key, variant?.key ?? "");
              if (stockType) {
                return (
                  <div key={field.key} className="sm:col-span-2">
                    <StockSerialPicker
                      label={field.label}
                      typeKey={stockType}
                      required={field.required}
                      value={stockUnitByField[field.key]}
                      excludeIds={Object.entries(stockUnitByField)
                        .filter(([key]) => key !== field.key)
                        .map(([, id]) => id)}
                      onChange={(unit) => {
                        setStockUnitByField((prev) => {
                          const next = { ...prev };
                          if (!unit) delete next[field.key];
                          else next[field.key] = unit.id;
                          return next;
                        });
                        patch(field.key, unit?.serial ?? "");
                      }}
                    />
                  </div>
                );
              }
              if (field.type === "gps") {
                return (
                  <div key={field.key} className="space-y-3 sm:col-span-2">
                    <FormField label={field.label} required={field.required}>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={locating}
                          onClick={captureLocation}
                        >
                          <MapPin className="h-4 w-4" />
                          {locating ? "Locating…" : "Use my current location"}
                        </Button>
                        <label className="inline-flex">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) =>
                              void onGpsPhotoSelected(e.target.files?.[0])
                            }
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={uploadingPhoto}
                            onClick={(e) => {
                              const input = e.currentTarget.parentElement?.querySelector(
                                "input",
                              );
                              input?.click();
                            }}
                          >
                            <Upload className="h-4 w-4" />
                            {uploadingPhoto
                              ? "Uploading…"
                              : gpsPhotoName
                                ? "Replace map photo"
                                : "Upload map photo"}
                          </Button>
                        </label>
                      </div>
                    </FormField>
                    {gpsLat != null && gpsLng != null ? (
                      <p className="text-xs text-foreground-secondary">
                        Captured {gpsLat.toFixed(6)}, {gpsLng.toFixed(6)}
                        {gpsAccuracy != null
                          ? ` · ±${Math.round(gpsAccuracy)} m`
                          : ""}
                      </p>
                    ) : null}
                    {gpsPhotoName ? (
                      <p className="text-xs text-foreground-secondary">
                        Photo: {gpsPhotoName}
                      </p>
                    ) : null}
                    {mapPreviewUrl ? (
                      <div className="overflow-hidden rounded-md border border-border">
                        <iframe
                          title="GPS preview"
                          src={mapPreviewUrl}
                          className="h-44 w-full"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                  </div>
                );
              }

              if (field.type === "select") {
                return (
                  <FormField
                    key={field.key}
                    label={field.label}
                    required={field.required}
                  >
                    <select
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                      value={values[field.key] ?? ""}
                      onChange={(e) => patch(field.key, e.target.value)}
                      required={field.required}
                    >
                      {(field.options ?? []).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                );
              }

              const inputProps =
                field.type === "phone"
                  ? rwandaPhoneInputProps()
                  : field.type === "nid"
                    ? nidInputProps()
                    : {};

              return (
                <FormField
                  key={field.key}
                  label={field.label}
                  required={field.required}
                  className={
                    field.key === "customerName" || field.key === "fullName"
                      ? "sm:col-span-2"
                      : undefined
                  }
                >
                  <Input
                    type={field.type === "date" ? "date" : "text"}
                    value={values[field.key] ?? ""}
                    onChange={(e) => {
                      let next = e.target.value;
                      if (field.type === "nid") next = normalizeNidDigits(next);
                      patch(field.key, next);
                    }}
                    placeholder={field.placeholder}
                    required={field.required}
                    {...inputProps}
                  />
                </FormField>
              );
            })}
          </div>

          <FormField label="Notes (optional)">
            <textarea
              className="min-h-16 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploadingPhoto}>
              {saving ? "Saving…" : "Save activation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
