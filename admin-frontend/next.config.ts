import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Enable Gzip/Brotli compression for text-based responses
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Admin portal is fully private (every page requires auth); live
          // order/inventory state must never be cached by browsers or CDNs.
          {
            key: "Cache-Control",
            value: "private, no-store",
          },
          {
            key: "X-Server-Response-Time-Target",
            value: "< 0.6s",
          },
          {
            key: "X-Content-Load-Target",
            value: "< 0.4s",
          },
          {
            key: "X-Max-Payload-Budget",
            value: "4MB",
          },
        ],
      },
    ]
  },
}

export default nextConfig
