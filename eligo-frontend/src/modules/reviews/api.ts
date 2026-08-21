import { api } from "@/lib/api-client"

export interface StorefrontReview {
  id: string | number
  productId: string | number | null
  productTitle: string | null
  reviewerName: string
  reviewerEmail: string | null
  rating: number
  title: string
  body: string
  status: "pending" | "approved" | "rejected"
  createdAt: string | null
}

interface RawSupabaseReview {
  id: string | number
  product_id?: string | number | null
  product_title?: string | null
  reviewer_name?: string | null
  reviewer_email?: string | null
  rating?: number | null
  title?: string | null
  body?: string | null
  status?: string | null
  created_at?: string | null
}

function mapReview(raw: RawSupabaseReview): StorefrontReview {
  return {
    id: raw.id,
    productId: raw.product_id ?? null,
    productTitle: raw.product_title ?? null,
    reviewerName: raw.reviewer_name || "Verified Customer",
    reviewerEmail: raw.reviewer_email ?? null,
    rating: Number(raw.rating) || 5,
    title: raw.title || "Great Quality",
    body: raw.body || "",
    status: (raw.status as StorefrontReview["status"]) || "pending",
    createdAt: raw.created_at ?? null,
  }
}

export async function fetchApprovedReviews(limit = 50): Promise<StorefrontReview[]> {
  try {
    const data = await api.get<{ reviews: RawSupabaseReview[] }>(
      `/orders/public/product-reviews?status=approved&limit=${limit}`,
      { auth: false, next: { revalidate: 60, tags: ["reviews"] } },
    )
    return Array.isArray(data?.reviews) ? data.reviews.map(mapReview) : []
  } catch {
    return []
  }
}

export interface SubmitReviewInput {
  reviewerName: string
  rating: number
  title: string
  body: string
  productId?: string | number | null
  productTitle?: string | null
}

export async function submitReview(input: SubmitReviewInput): Promise<void> {
  await api.post(
    "/orders/public/product-reviews",
    {
      reviewer_name: input.reviewerName,
      rating: input.rating,
      title: input.title,
      body: input.body,
      product_id: input.productId ?? null,
      product_title: input.productTitle ?? null,
    },
    { auth: false },
  )
}

export function buildRatingMap(
  reviews: StorefrontReview[],
): Map<string, { rating: number; count: number }> {
  const totals = new Map<string, { sum: number; count: number }>()
  for (const review of reviews) {
    if (!review.productId) continue
    const key = String(review.productId)
    const entry = totals.get(key) ?? { sum: 0, count: 0 }
    entry.sum += review.rating
    entry.count += 1
    totals.set(key, entry)
  }
  const result = new Map<string, { rating: number; count: number }>()
  for (const [key, { sum, count }] of totals) {
    result.set(key, { rating: Math.round((sum / count) * 10) / 10, count })
  }
  return result
}

export function formatTimeAgo(iso: string | null): string {
  if (!iso) return "recently"
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return "recently"
  const seconds = Math.max(1, Math.floor((Date.now() - then) / 1000))
  const units: Array<[number, string]> = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [30, "day"],
    [12, "month"],
    [Infinity, "year"],
  ]
  let value = seconds
  for (const [step, name] of units) {
    if (value < step) {
      const rounded = Math.max(1, Math.floor(value))
      return `${rounded} ${name}${rounded === 1 ? "" : "s"} ago`
    }
    value /= step
  }
  return "a long time ago"
}
