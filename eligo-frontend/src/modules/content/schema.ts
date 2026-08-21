import { z } from "zod"

const VisibilitySchema = z.enum(["Visible", "Hidden"])

export const BlogPostOutSchema = z.object({
  id: z.number(),
  title: z.string(),
  handle: z.string(),
  body: z.string().nullable(),
  excerpt: z.string().nullable(),
  author: z.string(),
  blog: z.string(),
  tags: z.string().nullable(),
  visibility: VisibilitySchema,
  featured_image_url: z.string().nullable(),
  thumbnail_url: z.string().nullable(),
  seo_title: z.string().nullable(),
  seo_description: z.string().nullable(),
  template_suffix: z.string().nullable(),
  published_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
})

export type BlogPostOut = z.infer<typeof BlogPostOutSchema>
