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

export function getCatalogErrorMessage(error: unknown): string {
  return getApiErrorMessage(error)
}
