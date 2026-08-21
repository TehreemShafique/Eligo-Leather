import { afterEach, describe, expect, it, vi } from "vitest"
import { api } from "@/lib/api-client"

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
  async () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
)

function lastInit(): RequestInit {
  const [, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1]
  return (init ?? {}) as RequestInit
}

vi.stubGlobal("fetch", fetchMock)

afterEach(() => {
  fetchMock.mockClear()
})

describe("api-client caching precedence", () => {
  it("defaults GET requests without options to cache no-store and sets no next config", async () => {
    await api.get("/catalog/products")

    expect(lastInit().cache).toBe("no-store")
    expect(lastInit().next).toBeUndefined()
  })

  it("copies an explicit cache option alone and never combines it with next", async () => {
    await api.get("/catalog/products", {
      cache: "force-cache",
      next: { revalidate: 60, tags: ["catalog"] },
    })

    expect(lastInit().cache).toBe("force-cache")
    expect(lastInit().next).toBeUndefined()
  })

  it("copies an explicit next config alone when no cache option is given", async () => {
    await api.get("/catalog/products", {
      next: { revalidate: 60, tags: ["catalog"] },
    })

    expect(lastInit().cache).toBeUndefined()
    expect(lastInit().next).toEqual({ revalidate: 60, tags: ["catalog"] })
  })

  it("sends neither cache nor next for non-GET requests without options", async () => {
    await api.post("/orders/create-order", { items: [] }, { auth: false })

    expect(lastInit().method).toBe("POST")
    expect(lastInit().cache).toBeUndefined()
    expect(lastInit().next).toBeUndefined()
  })

  it("copies an explicit cache option alone for non-GET requests", async () => {
    await api.post(
      "/orders/create-order",
      { items: [] },
      { auth: false, cache: "no-store", next: { revalidate: 10 } },
    )

    expect(lastInit().cache).toBe("no-store")
    expect(lastInit().next).toBeUndefined()
  })

  it("copies an explicit next config alone for non-GET requests", async () => {
    await api.post(
      "/orders/create-order",
      { items: [] },
      { auth: false, next: { revalidate: 10, tags: ["orders"] } },
    )

    expect(lastInit().cache).toBeUndefined()
    expect(lastInit().next).toEqual({ revalidate: 10, tags: ["orders"] })
  })
})
