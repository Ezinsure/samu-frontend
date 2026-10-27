/**
 * MapLibre v6 workers break under Next.js/Turbopack when resolved via
 * import.meta.url. Copy the worker + its shared sibling into public/ so
 * setWorkerUrl() can point at a stable same-origin path.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const dist = join(
  dirname(createRequire(import.meta.url).resolve("maplibre-gl/package.json")),
  "dist",
);
const out = join(process.cwd(), "public", "maplibre");
mkdirSync(out, { recursive: true });

for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(dist, file), join(out, file));
  console.log(`copied ${file} → public/maplibre/`);
}
