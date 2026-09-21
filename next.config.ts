import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: rootDir,
    resolveAlias: {
      "@data": path.join(rootDir, "data"),
    },
  },
};

export default nextConfig;
