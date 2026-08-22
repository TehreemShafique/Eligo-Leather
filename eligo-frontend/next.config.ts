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
    const noStore = { key: "Cache-Control", value: "private, no-store" }
    return [
      {
        source: "/:path*",
        headers: [
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
      // Customer-specific or authentication-state routes must never be cached
      // by browsers or shared caches.
      {
        source: "/cart",
        headers: [noStore],
      },
      {
        source: "/checkout",
        headers: [noStore],
      },
      {
        source: "/account/:path*",
        headers: [noStore],
      },
      {
        source: "/login",
        headers: [noStore],
      },
      {
        source: "/register",
        headers: [noStore],
      },
    ]
  },
}

export default nextConfig
