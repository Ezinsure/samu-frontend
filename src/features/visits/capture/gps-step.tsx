import { Crosshair, MapPin, Navigation } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import type { AgentRow } from "@/lib/api";
import {
  simulateFarAgentLocation,
  simulateNearAgentLocation,
} from "@/lib/visits/gps";
import { validationLabel, validationTone } from "@/lib/visits/presentation";
import type { VisitValidation } from "@/types";
import type { GpsCapture } from "./types";

interface GpsStepProps {
  gps: GpsCapture;
  agent: AgentRow | null;
  thresholdMeters: number;
  /** Preview distance in meters (the API recomputes it on submit). */
  distance: number | null;
  validation: VisitValidation | null;
}

/** Step 2: capture the coordinator's position and preview the GPS check. */
export function GpsStep({
  gps,
  agent,
  thresholdMeters,
  distance,
  validation,
}: GpsStepProps) {
  const { location } = gps;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={gps.captureDevice}>
          <Navigation className="h-4 w-4" />
          Use device GPS
        </Button>
        {agent ? (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                gps.setSimulated(simulateNearAgentLocation(agent.registeredLocation))
              }
            >
              <Crosshair className="h-4 w-4" />
              Simulate near agent
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                gps.setSimulated(simulateFarAgentLocation(agent.registeredLocation))
              }
            >
              <MapPin className="h-4 w-4" />
              Simulate mismatch
            </Button>
          </>
        ) : null}
      </div>

      {gps.status === "requesting" ? (
        <p className="text-sm text-foreground-secondary">
          Requesting location permission…
        </p>
      ) : null}
      {gps.error ? <p className="text-sm text-danger">{gps.error}</p> : null}

      {location && distance != null && validation ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-foreground-secondary">
              Current location
            </p>
            <p className="mt-1 font-mono text-sm">
              {location.lat}, {location.lng}
            </p>
            <p className="mt-1 text-xs text-foreground-secondary">
              Accuracy ±{location.accuracyMeters ?? "—"}m · Source:{" "}
              {gps.status === "simulated" ? "Demo simulation" : "Device GPS"}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-foreground-secondary">
              Distance vs registered
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {Math.round(distance)}m
            </p>
            <div className="mt-2">
              <StatusBadge
                label={validationLabel(validation)}
                tone={validationTone(validation)}
              />
            </div>
            <p className="mt-2 text-xs text-foreground-secondary">
              Threshold: {thresholdMeters}m (Admin setting). The server
              re-checks this when you submit.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-foreground-secondary">
          Capture GPS to compare against the agent&apos;s registered location.
        </p>
      )}
    </>
  );
}
