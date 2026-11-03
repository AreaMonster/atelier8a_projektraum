import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The checklist config is read from disk at runtime so it can be edited without a rebuild.
  outputFileTracingIncludes: { "/**": ["./config/**"] },
  // Hide the Next.js dev badge in the corner (only visible with `npm run dev` anyway).
  devIndicators: false,
};

export default nextConfig;
