import type { Coordinates, VisitValidation } from "@/types";

/**
 * Client-side GPS helpers used for the *preview* in the capture wizard.
 * The API recomputes the distance and validation on submit, so these values
 * are never trusted — they only give the coordinator instant feedback.
 */

/** Haversine distance in meters between two WGS84 points. */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earth = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(h));
}

export function evaluateGpsValidation(
  distanceFromRegisteredMeters: number,
  thresholdMeters: number,
): { validation: VisitValidation; flaggedReason?: string } {
  if (distanceFromRegisteredMeters <= thresholdMeters) {
    return { validation: "accepted" };
  }
  return {
    validation: "flagged",
    flaggedReason: `GPS distance ${Math.round(distanceFromRegisteredMeters)}m above threshold (${thresholdMeters}m)`,
  };
}

/** Offsets a registered location by `offsetMeters` (demo GPS simulation). */
export function simulateNearAgentLocation(
  registered: Coordinates,
  offsetMeters = 6,
): Coordinates {
  const latOffset = offsetMeters / 111_320;
  const lngOffset =
    offsetMeters / (111_320 * Math.cos((registered.lat * Math.PI) / 180));
  return {
    lat: Number((registered.lat + latOffset).toFixed(6)),
    lng: Number((registered.lng + lngOffset).toFixed(6)),
    accuracyMeters: 5,
  };
}

export function simulateFarAgentLocation(
  registered: Coordinates,
  offsetMeters = 150,
): Coordinates {
  return simulateNearAgentLocation(registered, offsetMeters);
}
