import { api } from "@/lib/api-client"
import {
  StoreReviewSchema,
  ReviewSummarySchema,
  type StoreReview,
  type ReviewSummary,
} from "./schema"

// Public, admin-moderated review endpoints (Supabase Reviews app).
// Mounted by the settings module, hence the /settings/apps prefix.
const REVIEWS_BASE = "/settings/apps/supabase_reviews/public/reviews"
const REVIEWS_CACHE = { next: { revalidate: 60, tags: ["reviews"] } }

export type ListApprovedReviewsParams = {
  productId?: string | number | null
  perPage?: number
}

export async function listApprovedReviews(
  params: ListApprovedReviewsParams = {},
): Promise<StoreReview[]> {
  try {
    const query = new URLSearchParams()
    if (params.productId != null && params.productId !== "") {
      query.set("product_id", String(params.productId))
    }
    query.set("per_page", String(params.perPage ?? 12))

    const search = query.toString()
    const data = await api.get<unknown>(
      `${REVIEWS_BASE}${search ? `?${search}` : ""}`,
      { auth: false, ...REVIEWS_CACHE },
    )
    if (!data || !Array.isArray(data)) return []
    return StoreReviewSchema.array().parse(data)
  } catch {
    // Reviews are optional storefront content. When the reviews app is not
    // configured, unreachable, or simply has no approved rows yet, the
    // section renders without cards instead of surfacing an error.
    return []
  }
}

// Average star rating + review count for a single product, computed from
// approved reviews in the backend. Returns null when there are no approved
// reviews (callers fall back to their defaults).
export async function fetchReviewSummary(
  productId: string | number | null | undefined,
): Promise<ReviewSummary | null> {
  if (productId == null || productId === "") return null
  try {
    const data = await api.get<unknown>(
      `${REVIEWS_BASE}/summary?product_id=${encodeURIComponent(String(productId))}`,
      { auth: false, ...REVIEWS_CACHE },
    )
    if (!data || typeof data !== "object") return null
    return ReviewSummarySchema.parse(data)
  } catch {
    return null
  }
}

// Average star ratings for every product that has approved reviews, keyed by
// product id string. One backend call serves a whole product catalog page.
export async function fetchAllReviewSummaries(): Promise<
  Record<string, ReviewSummary>
> {
  try {
    const data = await api.get<unknown>(`${REVIEWS_BASE}/summary`, {
      auth: false,
      ...REVIEWS_CACHE,
    })
    if (!data || !Array.isArray(data)) return {}
    const list = ReviewSummarySchema.array().safeParse(data)
    if (!list.success) return {}
    const map: Record<string, ReviewSummary> = {}
    for (const item of list.data) {
      map[String(item.product_id)] = item
    }
    return map
  } catch {
    return {}
  }
}

export type SubmitReviewInput = {
  productId?: string | number | null
  name: string
  email?: string
  rating: number
  title?: string
  content: string
  images?: string[]
}

export async function submitReview(input: SubmitReviewInput): Promise<void> {
  await api.post(
    REVIEWS_BASE,
    {
      external_id:
        input.productId != null && input.productId !== ""
          ? String(input.productId)
          : null,
      reviewer_name: input.name.trim(),
      reviewer_email: input.email?.trim() || "",
      rating: input.rating,
      title: input.title?.trim() || "",
      body: input.content.trim(),
      images: input.images ?? [],
    },
    { auth: false },
  )
}

// Upload customer review photos to the backend (no auth). Accepts multiple
// files, converts each to WebP, and returns the public URLs to attach to the
// review. Relative /static/... paths are resolved later by resolveApiMediaUrl.
export async function uploadReviewPhotos(
  files: FileList | File[],
): Promise<string[]> {
  const formData = new FormData()
  for (const file of Array.from(files)) {
    formData.append("files", file)
  }
  const data = await api.post<{ success: boolean; urls: string[] }>(
    `${REVIEWS_BASE}/upload`,
    formData as unknown as Record<string, unknown>,
    { auth: false },
  )
  return data?.urls ?? []
}
