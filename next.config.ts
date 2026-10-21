import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["undici", "p-queue", "@neondatabase/serverless"],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "shared.akamai.steamstatic.com",
      },
      {
        protocol: "https",
        hostname: "cdn.akamai.steamstatic.com",
      },
      {
        protocol: "https",
        hostname: "steamcdn-a.akamaihd.net",
      },
      {
        protocol: "https",
        hostname: "shared.fastly.steamstatic.com",
      },
    ],
  },
};

export default nextConfig;
