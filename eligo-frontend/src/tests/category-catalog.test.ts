import { afterEach, describe, expect, it, vi } from "vitest"
import {
  fetchCollectionsThrowing,
  fetchProductsThrowing,
  listCollectionsAllPages,
} from "@/modules/catalog/api"
import { isCategorySlug } from "@/modules/catalog/types"

const fetchMock = vi.fn<
  (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
>(async () => new Response(JSON.stringify([]), { status: 200 }))

vi.stubGlobal("fetch", fetchMock)

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function fakeCollection(id: number, overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id,
    title: `Collection ${id}`,
    description: null,
    image_url: null,
    collection_type: "wallets",
    url_handle: `collection-${id}`,
    parent_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

function fakeProduct(id: number): Record<string, unknown> {
  return {
    id,
    title: `Leather Product ${id}`,
    status: "Active",
    category: "wallets",
    product_type: null,
    vendor: "Eligo",
    tags: null,
    url_handle: `product-${id}`,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  }
}

afterEach(() => {
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => new Response(JSON.stringify([]), { status: 200 }))
})

describe("listCollectionsAllPages (category validation)", () => {
  it("paginates past 200 to include admin collections beyond the first batch", async () => {
    const firstBatch = Array.from({ length: 200 }, (_, i) => fakeCollection(i + 1))
    const secondBatch = Array.from({ length: 50 }, (_, i) => fakeCollection(201 + i))
    fetchMock.mockResolvedValueOnce(jsonResponse(firstBatch))
    fetchMock.mockResolvedValueOnce(jsonResponse(secondBatch))

    const result = await listCollectionsAllPages()

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toHaveLength(250)
      expect(result.data[249].id).toBe(250)
    }
    // One 200-request page + one final short page => two backend calls.
    expect(fetchMock.mock.calls).toHaveLength(2)
  })

  it("stops paginating once a batch is shorter than 200", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([fakeCollection(1)]))

    const result = await listCollectionsAllPages()

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toHaveLength(1)
    expect(fetchMock.mock.calls).toHaveLength(1)
  })

  it("fails closed (ok:false) on a backend/network error instead of returning partial data", async () => {
    const firstBatch = Array.from({ length: 200 }, (_, i) => fakeCollection(i + 1))
    fetchMock.mockResolvedValueOnce(jsonResponse(firstBatch))
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"))

    const result = await listCollectionsAllPages()

    expect(result.ok).toBe(false)
  })
})

describe("fetchProductsThrowing (fail-closed)", () => {
  it("returns an empty array for a genuine empty dataset", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]))

    await expect(fetchProductsThrowing({ status: "Active" })).resolves.toEqual([])
  })

  it("returns parsed products for a valid response", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([fakeProduct(7)]))

    const products = await fetchProductsThrowing({ status: "Active" })
    expect(products).toHaveLength(1)
    expect(products[0].id).toBe(7)
  })

  it("throws on a malformed (non-array) success response instead of returning []", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: "not an array" }))

    await expect(fetchProductsThrowing({ status: "Active" })).rejects.toThrow()
  })

  it("throws on an HTTP error instead of returning []", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "boom" }, 500))

    await expect(fetchProductsThrowing({ status: "Active" })).rejects.toThrow()
  })
})

describe("fetchCollectionsThrowing (fail-closed)", () => {
  it("throws on a malformed success response instead of returning []", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ nope: true }))

    await expect(fetchCollectionsThrowing(0, 200)).rejects.toThrow()
  })

  it("returns parsed collections for a valid response", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([fakeCollection(1)]))

    await expect(fetchCollectionsThrowing(0, 200)).resolves.toHaveLength(1)
  })
})

describe("isCategorySlug (exact match)", () => {
  it("accepts real predefined category slugs only", () => {
    expect(isCategorySlug("wallets")).toBe(true)
    expect(isCategorySlug("belts")).toBe(true)
  })

  it("rejects keyword-like slugs that are not exact predefined categories", () => {
    expect(isCategorySlug("random-wallet-test")).toBe(false)
    expect(isCategorySlug("wallet")).toBe(false)
    expect(isCategorySlug("leather-belt")).toBe(false)
  })
})