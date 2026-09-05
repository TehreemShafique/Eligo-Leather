import { afterEach, describe, expect, it, vi } from "vitest"
import { ApiError } from "@/lib/api-client"
import { isPageNotFound, resolvePageState } from "@/modules/content/api"

const fetchMock = vi.fn<
  (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
>(async () => new Response(JSON.stringify({}), { status: 200 }))

vi.stubGlobal("fetch", fetchMock)

const visiblePage = {
  id: 1,
  title: "About Us",
  handle: "about-us",
  content: "<p>About Eligo Leather.</p>",
  visibility: "Visible",
  updated_at: "2026-01-01T00:00:00Z",
}

const hiddenPage = {
  ...visiblePage,
  handle: "secret",
  visibility: "Hidden",
}

afterEach(() => {
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({}), { status: 200 }))
})

describe("resolvePageState (/pages/[slug])", () => {
  it("classifies a Visible page as visible (indexable)", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(visiblePage), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const state = await resolvePageState("about-us")
    expect(state.kind).toBe("visible")
    if (state.kind === "visible") expect(state.page.title).toBe("About Us")
  })

  it("classifies a Hidden page as hidden -> 404/noindex", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(hiddenPage), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const state = await resolvePageState("secret")
    expect(state.kind).toBe("hidden")
  })

  it("classifies a genuine backend 404 as missing -> 404/noindex", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Not found" }), { status: 404 }),
    )

    const state = await resolvePageState("does-not-exist")
    expect(state.kind).toBe("missing")
  })

  it("classifies a backend/network outage as unavailable -> noindex (not 404)", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"))

    const state = await resolvePageState("about-us")
    expect(state.kind).toBe("unavailable")
  })

  it("uses a no-store fetch for CMS pages (preserves previous freshness)", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(visiblePage), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    await resolvePageState("about-us")
    const [, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1]
    expect((init ?? {})?.cache).toBe("no-store")
  })
})

describe("isPageNotFound", () => {
  it("returns true for ApiError with status 404", () => {
    expect(isPageNotFound(new ApiError(404, { detail: "Not found" }))).toBe(true)
  })

  it("returns false for other ApiError statuses", () => {
    expect(isPageNotFound(new ApiError(500, "boom"))).toBe(false)
  })

  it("returns false for non-ApiError failures", () => {
    expect(isPageNotFound(new TypeError("fetch failed"))).toBe(false)
  })
})