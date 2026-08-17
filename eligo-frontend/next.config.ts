import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Explicitly disable Gzip compression as requested
  compress: false,
  images: {
    unoptimized: true,
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
          {
            key: "Cache-Control",
            value: "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400",
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
