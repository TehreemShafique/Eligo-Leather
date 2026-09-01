import { afterEach, describe, expect, it, vi } from "vitest"
import { assertProductionSiteUrl } from "@/lib/env"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe("assertProductionSiteUrl (SITE_URL guard)", () => {
  it("rejects loopback localhost URLs", () => {
    expect(() => assertProductionSiteUrl("http://localhost:3000")).toThrow(
      /loopback/i,
    )
    expect(() => assertProductionSiteUrl("http://localhost")).toThrow(/loopback/i)
  })

  it("rejects 127.0.0.1 loopback URLs", () => {
    expect(() => assertProductionSiteUrl("http://127.0.0.1")).toThrow(/loopback/i)
    expect(() => assertProductionSiteUrl("http://127.0.0.1:8000")).toThrow(
      /loopback/i,
    )
  })

  it("accepts valid production URLs (trailing slash normalized)", () => {
    expect(() => assertProductionSiteUrl("https://eligoleather.com")).not.toThrow()
    expect(() => assertProductionSiteUrl("https://www.eligoleather.com/")).not.toThrow()
    expect(() => assertProductionSiteUrl("https://preview.eligoleather.com")).not.toThrow()
  })
})

describe("production env load guard", () => {
  it("fails the module load when NEXT_PUBLIC_SITE_URL is missing in production", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com")
    delete process.env.NEXT_PUBLIC_SITE_URL

    await expect(import("@/lib/env")).rejects.toThrow(
      /NEXT_PUBLIC_SITE_URL is required/,
    )
  })

  it("fails the module load when NEXT_PUBLIC_SITE_URL is a loopback in production", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com")
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000")

    await expect(import("@/lib/env")).rejects.toThrow(/loopback/i)
  })

  it("loads successfully with a valid production SITE_URL", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com")
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://eligoleather.com")

    await expect(import("@/lib/env")).resolves.toBeDefined()
  })
})