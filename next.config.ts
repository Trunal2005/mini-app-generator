import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence warnings about next-auth edge runtime
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs"],
  // Disable type-checking on build for faster iteration (use tsc --noEmit separately)
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
