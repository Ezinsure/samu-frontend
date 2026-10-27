import { setWorkerUrl } from "maplibre-gl";

let done = false;

/**
 * MapLibre v6 resolves its worker from import.meta.url, which Turbopack
 * turns into an empty/broken URL. Point at the copies in /public/maplibre
 * (see scripts/copy-maplibre-worker.mjs) before any Map is constructed.
 */
export function ensureMapLibreWorker() {
  if (done || typeof window === "undefined") return;
  setWorkerUrl(
    new URL("/maplibre/maplibre-gl-worker.mjs", window.location.origin).href,
  );
  done = true;
}
