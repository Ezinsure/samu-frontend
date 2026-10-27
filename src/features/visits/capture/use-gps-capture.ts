import { useCallback, useState } from "react";
import type { Coordinates } from "@/types";
import type { GpsCapture, GpsStatus } from "./types";

interface GpsState {
  status: GpsStatus;
  error?: string;
  location: Coordinates | null;
}

/** Browser geolocation (plus a demo simulation) for the capture wizard. */
export function useGpsCapture(): GpsCapture {
  const [state, setState] = useState<GpsState>({
    status: "idle",
    location: null,
  });

  const captureDevice = useCallback(() => {
    if (!navigator.geolocation) {
      setState((current) => ({
        ...current,
        status: "unavailable",
        error: "Geolocation is not available in this browser.",
      }));
      return;
    }

    setState((current) => ({ ...current, status: "requesting", error: undefined }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Browsers often report accuracy of tens of km indoors; keep a sane cap.
        const rawAccuracy = position.coords.accuracy;
        const accuracyMeters =
          Number.isFinite(rawAccuracy) && rawAccuracy > 0
            ? Math.min(Math.round(rawAccuracy), 100_000)
            : undefined;
        setState({
          status: "ready",
          location: {
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
            accuracyMeters,
          },
        });
      },
      (error) =>
        setState((current) => ({
          ...current,
          status: "denied",
          error:
            error.code === error.PERMISSION_DENIED
              ? "Location permission denied. Use a demo simulation below."
              : "Unable to read GPS. Use a demo simulation below.",
        })),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }, []);

  const setSimulated = useCallback((location: Coordinates) => {
    setState({ status: "simulated", location });
  }, []);

  return { ...state, captureDevice, setSimulated };
}
