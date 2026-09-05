import { api, getApiErrorMessage } from "@/lib/api-client"
import { PAGINATION } from "@/lib/constants"
import {
  CollectionOutSchema,
  ProductListOutSchema,
  ProductOutSchema,
  type CollectionOut,
  type ProductListOut,
  type ProductOut,
} from "./schema"
import type { ProductCategory, ProductStatus } from "./types"

export type ListProductsParams = {
  status?: ProductStatus
  category?: ProductCategory
  search?: string
  /** Collection id or url_handle (or a collection type like "wallets"). */
  collection?: string
  skip?: number
  limit?: number
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value))
    }
  }
  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

// Public catalog content: safe to cache at the edge for a short window.
const CATALOG_CACHE = { next: { revalidate: 60, tags: ["catalog"] } }

export async function listProducts(params: ListProductsParams = {}): Promise<ProductListOut[]> {
  try {
    const {
      status,
      category,
      search,
      collection,
      skip = 0,
      limit = PAGINATION.defaultLimit,
    } = params

    const query = buildQueryString({
      status, category, search, collection, skip, limit,
    })
    const data = await api.get(`/catalog/products${query}`, { auth: false, ...CATALOG_CACHE })
    if (!data || !Array.isArray(data)) return []
    return ProductListOutSchema.array().parse(data)
  } catch (error) {
    console.warn("Backend API /catalog/products error or unreachable:", error)
    return []
  }
}

export async function getProduct(productId: number): Promise<ProductOut | null> {
  try {
    const data = await api.get(`/catalog/products/${productId}`, { auth: false, ...CATALOG_CACHE })
    if (!data) return null
    return ProductOutSchema.parse(data)
  } catch (error) {
    console.warn(`Backend API /catalog/products/${productId} error or unreachable:`, error)
    return null
  }
}

export async function listCollections(): Promise<CollectionOut[]> {
  try {
    const data = await api.get(`/catalog/collections`, { auth: false, ...CATALOG_CACHE })
    if (!data || !Array.isArray(data)) return []
    return CollectionOutSchema.array().parse(data)
  } catch (error) {
    console.warn("Backend API /catalog/collections error or unreachable:", error)
    return []
  }
}

export async function getCollection(collectionId: number): Promise<CollectionOut | null> {
  try {
    const data = await api.get(`/catalog/collections/${collectionId}`, { auth: false, ...CATALOG_CACHE })
    if (!data) return null
    return CollectionOutSchema.parse(data)
  } catch (error) {
    console.warn(`Backend API /catalog/collections/${collectionId} error or unreachable:`, error)
    return null
  }
}

export async function searchProducts(query: string): Promise<ProductListOut[]> {
  try {
    return await listProducts({ search: query, status: "Active", limit: PAGINATION.defaultLimit })
  } catch {
    return []
  }
}

// Error-preserving/throwing product fetch. Unlike `listProducts` (which swallows
// API failures and returns []), this helper rethrows on failure so callers —
// the category page and sitemap — can distinguish "request failed" from
// "no products". Accepts the full ListProductsParams shape.
export async function fetchProductsThrowing(params: ListProductsParams = {}): Promise<ProductListOut[]> {
  const { status, category, search, collection, skip = 0, limit = PAGINATION.defaultLimit } = params
  const query = buildQueryString({ status, category, search, collection, skip, limit })
  const data = await api.get(`/catalog/products${query}`, { auth: false, ...CATALOG_CACHE })
  // Fail closed: an invalid/malformed success response must surface as an error,
  // never be silently coerced into an empty dataset. The schema parse throws
  // (also for null/undefined) and the error propagates to the caller.
  return ProductListOutSchema.array().parse(data)
}

// Throwing per-page collection fetch (accepts skip/limit) for sitemap pagination.
// Rethrows on API failure so sitemap generation fails closed instead of silently
// producing a partial sitemap.
export async function fetchCollectionsThrowing(skip: number, limit: number): Promise<CollectionOut[]> {
  const query = buildQueryString({ skip, limit })
  const data = await api.get(`/catalog/collections${query}`, { auth: false, ...CATALOG_CACHE })
  // Fail closed: malformed success responses throw rather than returning [].
  return CollectionOutSchema.array().parse(data)
}

// Paginated + error-preserving collection fetch for category validation.
// The backend /catalog/collections default limit is only 50 rows, so a valid
// admin collection beyond row 50 would otherwise be missed. This pages through
// all collections (up to 200 per request, stopping once a batch returns <200)
// and distinguishes success (ok:true with data) from a backend/network failure
// (ok:false), preventing false 404s during outages.
export async function listCollectionsAllPages(): Promise<
  | { ok: true; data: CollectionOut[] }
  | { ok: false }
> {
  const all: CollectionOut[] = []
  const pageSize = 200
  try {
    for (let skip = 0; ; skip += pageSize) {
      const batch = await fetchCollectionsThrowing(skip, pageSize)
      all.push(...batch)
      if (batch.length < pageSize) break
    }
    return { ok: true, data: all }
  } catch (error) {
    console.warn("Backend API /catalog/collections error or unreachable:", error)
    return { ok: false }
  }
}

export function getCatalogErrorMessage(error: unknown): string {
  return getApiErrorMessage(error)
}

// Pure helper for the sitemap: reduces all collections to the top-level admin
// collections (parent_id == null) with a real non-empty url_handle, de-duped
// against each other and against predefined product-category handles (so a
// custom collection whose handle collides with a built-in /categories URL is
// not emitted twice). Kept here so sitemap generation logic is unit-testable.
export function listSitemapCollectionHandles(
  collections: CollectionOut[],
  predefinedHandles: ReadonlySet<string>,
): Array<{ handle: string; updatedAt?: string }> {
  const seen = new Set<string>()
  const result: Array<{ handle: string; updatedAt?: string }> = []
  for (const collection of collections) {
    const handle = collection.url_handle?.trim()
    if (collection.parent_id != null) continue
    if (!handle) continue
    const key = handle.toLowerCase()
    if (predefinedHandles.has(key) || seen.has(key)) continue
    seen.add(key)
    result.push({ handle, updatedAt: collection.updated_at })
  }
  return result
}
