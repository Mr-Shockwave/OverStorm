import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(frontendRoot, "..");

const nextConfig: NextConfig = {
  turbopack: {
    root: repoRoot,
    resolveAlias: {
      "convex/server": "./frontend/node_modules/convex/server",
      "convex/react": "./frontend/node_modules/convex/react",
    },
  },
};

export default nextConfig;
