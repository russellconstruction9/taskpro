import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default async (phase: string) => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return nextConfig;
  }

  const withSerwist = (await import("@serwist/next")).default;
  return withSerwist({
    swSrc: "app/sw.ts",
    swDest: "public/sw.js",
    reloadOnOnline: true,
  })(nextConfig);
};
