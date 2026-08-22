import { z } from "zod"

// Review rows live in the Supabase `reviews` table (managed by the admin
// under Settings -> Apps -> Supabase Reviews) and reach the storefront only
// after an admin approves them.
const PhotoListSchema = z
  .union([z.array(z.string()), z.string()])
  .transform((value) =>
    Array.isArray(value)
      ? value.filter(Boolean)
      : value
          .split(",")
          .map((photo) => photo.trim())
          .filter(Boolean),
  )
  .nullish()
  .transform((value) => value ?? [])

export const StoreReviewSchema = z.object({
  id: z.union([z.number(), z.string()]),
  product_id: z.union([z.number(), z.string()]).nullish(),
  reviewer_name: z.string(),
  rating: z.coerce.number().min(0).max(5).catch(5),
  title: z.string().nullish(),
  body: z.string().nullish(),
  status: z.string().nullish(),
  avatar_url: z.string().nullish(),
  images: PhotoListSchema,
  photo_urls: PhotoListSchema,
  created_at: z.string().nullish(),
})

export type StoreReview = {
  id: number | string
  product_id?: number | string | null
  reviewer_name: string
  rating: number
  title?: string | null
  body?: string | null
  status?: string | null
  avatar_url?: string | null
  images: string[]
  photo_urls: string[]
  created_at?: string | null
}
