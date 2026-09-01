import { afterEach, describe, expect, it, vi } from "vitest"
import { listSitemapCollectionHandles } from "@/modules/catalog/api"
import type { CollectionOut } from "@/modules/catalog/schema"
import { fetchBlogPostsThrowing } from "@/modules/content/api"
import { PRODUCT_CATEGORIES } from "@/modules/catalog/types"

const fetchMock = vi.fn<
  (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
>(async () => new Response(JSON.stringify([]), { status: 200 }))

vi.stubGlobal("fetch", fetchMock)

function fakeCollection(id: number, overrides: Partial<CollectionOut> = {}): CollectionOut {
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

afterEach(() => {
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => new Response(JSON.stringify([]), { status: 200 }))
})

describe("listSitemapCollectionHandles", () => {
  it("includes top-level admin collections only (excludes child rows)", () => {
    const collections = [
      fakeCollection(1, { url_handle: "men-wallets" }),
      fakeCollection(2, { url_handle: "slim-wallets", parent_id: 1 }),
      fakeCollection(3, { url_handle: "" }),
      fakeCollection(4, { url_handle: "gift-sets" }),
    ]

    const handles = listSitemapCollectionHandles(collections, new Set())
    expect(handles.map((h) => h.handle)).toEqual(["men-wallets", "gift-sets"])
  })

  it("dedupes collections that share the same url_handle (case-insensitive)", () => {
    const collections = [
      fakeCollection(1, { url_handle: "Men-Wallets" }),
      fakeCollection(2, { url_handle: "men-wallets" }),
      fakeCollection(3, { url_handle: "travel" }),
    ]

    const handles = listSitemapCollectionHandles(collections, new Set())
    expect(handles.map((h) => h.handle)).toEqual(["Men-Wallets", "travel"])
  })

  it("skips handles that collide with predefined /categories URLs", () => {
    const collections = [
      fakeCollection(1, { url_handle: "wallets" }),
      fakeCollection(2, { url_handle: "custom" }),
    ]

    const predefined = new Set(PRODUCT_CATEGORIES.map((c) => c.value))
    const handles = listSitemapCollectionHandles(collections, predefined)
    expect(handles.map((h) => h.handle)).toEqual(["custom"])
  })

  it("does not emit built-in category URLs twice", () => {
    const predefined = new Set(PRODUCT_CATEGORIES.map((c) => c.value))
    const handles = listSitemapCollectionHandles(
      PRODUCT_CATEGORIES.map((c, i) => fakeCollection(i + 1, { url_handle: c.value })),
      predefined,
    )
    expect(handles).toHaveLength(0)
  })

  it("preserves updated_at for the lastModified field", () => {
    const collections = [fakeCollection(1, { url_handle: "men", updated_at: "2026-06-01T00:00:00Z" })]

    const handles = listSitemapCollectionHandles(collections, new Set())
    expect(handles[0].updatedAt).toBe("2026-06-01T00:00:00Z")
  })
})

describe("fetchBlogPostsThrowing (fail-closed)", () => {
  it("returns parsed posts for a valid response", async () => {
    const post = {
      id: 1,
      title: "A Post",
      handle: "a-post",
      body: null,
      excerpt: null,
      author: "Eligo",
      blog: "news",
      tags: null,
      visibility: "Visible",
      featured_image_url: null,
      thumbnail_url: null,
      seo_title: null,
      seo_description: null,
      seo_keyword: null,
      seo_canonical_url: null,
      template_suffix: null,
      published_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: null,
    }
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([post]), { status: 200 }),
    )

    await expect(fetchBlogPostsThrowing(0, 200)).resolves.toHaveLength(1)
  })

  it("throws on a malformed success response instead of returning []", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ posts: [] }), { status: 200 }),
    )

    await expect(fetchBlogPostsThrowing(0, 200)).rejects.toThrow()
  })
})