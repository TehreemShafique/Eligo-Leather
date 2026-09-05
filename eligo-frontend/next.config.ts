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
    const publicCache = {
      key: "Cache-Control",
      value: "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400",
    }
    const noStore = { key: "Cache-Control", value: "private, no-store" }
    return [
      // PUBLIC pages: catalog, collections, blog, CMS/policy pages — safe for
      // browser and CDN caching with revalidation. (Later matching rules below
      // override this for private/dynamic routes and long-lived assets.)
      {
        source: "/:path*",
        headers: [
          publicCache,
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
      // Long-lived public assets (hero banners etc.) under /images.
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
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
