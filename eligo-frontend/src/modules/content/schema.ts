import { z } from "zod"

const VisibilitySchema = z.enum(["Visible", "Hidden"])

export const BlogPostOutSchema = z.object({
  id: z.number(),
  title: z.string(),
  handle: z.string(),
  body: z.string().nullable(),
  excerpt: z.string().nullable(),
  faqs: z.string().nullish(),
  author: z.string(),
  blog: z.string(),
  tags: z.string().nullable(),
  visibility: VisibilitySchema,
  featured_image_url: z.string().nullable(),
  thumbnail_url: z.string().nullable(),
  seo_title: z.string().nullable(),
  seo_description: z.string().nullable(),
  seo_keyword: z.string().nullable(),
  seo_canonical_url: z.string().nullable(),
  template_suffix: z.string().nullable(),
  published_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
})

export type BlogPostOut = z.infer<typeof BlogPostOutSchema>

// CMS page record served by the public GET /pages/{handle} endpoint
// (admin-managed under Online Stores -> Pages).
export const CmsPageOutSchema = z.object({
  id: z.number(),
  title: z.string(),
  handle: z.string(),
  content: z.string().nullable(),
  visibility: z.string(),
  template: z.string().nullish(),
  metafields: z.string().nullish(),
  seo_title: z.string().nullish(),
  seo_description: z.string().nullish(),
  created_at: z.string().optional(),
  updated_at: z.string().nullish(),
})

export type CmsPageOut = z.infer<typeof CmsPageOutSchema>

// Store policy row served by the public
// GET /settings/legal-privacy/public/policies endpoint
// (admin-managed under Settings -> Policies & Privacy).
export const PublicPolicyOutSchema = z.object({
  policy_type: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  updated_at: z.string().nullish(),
})

export type PublicPolicyOut = z.infer<typeof PublicPolicyOutSchema>
