import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The checklist config is read from disk at runtime so it can be edited without a rebuild.
  outputFileTracingIncludes: { "/**": ["./config/**"] },
};

export default nextConfig;
