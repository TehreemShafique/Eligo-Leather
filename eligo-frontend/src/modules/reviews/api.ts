import { api } from "@/lib/api-client"
import { StoreReviewSchema, type StoreReview } from "./schema"

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

export type SubmitReviewInput = {
  productId?: string | number | null
  name: string
  email?: string
  rating: number
  title?: string
  content: string
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
    },
    { auth: false },
  )
}
