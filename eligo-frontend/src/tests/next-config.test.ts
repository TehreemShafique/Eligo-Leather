import { describe, expect, it } from "vitest"
import nextConfig from "../../next.config"

describe("next config performance", () => {
  it("enables compression for text responses", () => {
    expect(nextConfig.compress).toBe(true)
  })

  it("enables Next.js image optimization", () => {
    expect(nextConfig.images?.unoptimized).not.toBe(true)
  })

  it("caches public pages but keeps private/dynamic pages uncached", async () => {
    const headers = (await nextConfig.headers?.()) ?? []

    const cacheControl = (source: string) =>
      headers
        .find((rule) => rule.source === source)
        ?.headers.find((h) => h.key === "Cache-Control")?.value

    expect(cacheControl("/:path*")).toContain("public")
    expect(cacheControl("/cart")).toBe("private, no-store")
    expect(cacheControl("/checkout")).toBe("private, no-store")
    expect(cacheControl("/account/:path*")).toBe("private, no-store")
    expect(cacheControl("/login")).toBe("private, no-store")
    expect(cacheControl("/register")).toBe("private, no-store")
    expect(cacheControl("/images/:path*")).toContain("public")
  })
})