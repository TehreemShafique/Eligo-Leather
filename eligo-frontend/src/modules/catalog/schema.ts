import { z } from "zod"

const ProductCategorySchema = z.enum([
  "belts",
  "wallets",
  "bags",
  "jackets",
  "shoes",
  "accessories",
  "other",
])

const ProductStatusSchema = z.enum(["Active", "Draft", "Archived"])

const VariantOutSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  title: z.string(),
  color_name: z.string().nullable().optional(),
  color_hex: z.string().nullable().optional(),
  metaobject_entry_id: z.number().nullable().optional(),
  sku: z.string().nullable(),
  price: z.string(),
  compare_at_price: z.string().nullable(),
  cost_per_item: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  inventory_quantity: z.number(),
  weight: z.string().nullable().optional(),
  weight_unit: z.string(),
  inventory_tracked: z.boolean(),
  continue_selling_out_of_stock: z.boolean(),
  is_canonical: z.boolean().optional(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

const ProductImageOutSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  url: z.string(),
  alt_text: z.string().nullable(),
  color_tag: z.string().nullable().optional(),
  focal_point_x: z.number().nullable().optional(),
  focal_point_y: z.number().nullable().optional(),
  position: z.number(),
  created_at: z.string(),
})

const ProductListOutSchema = z.object({
  id: z.number(),
  title: z.string(),
  status: ProductStatusSchema,
  category: ProductCategorySchema,
  product_type: z.string().nullable(),
  vendor: z.string(),
  tags: z.string().nullable(),
  url_handle: z.string().nullable().optional(),
  price: z.string().nullable().optional(),
  compare_at_price: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  categories: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  variants: z.array(VariantOutSchema).optional().default([]),
  images: z.array(ProductImageOutSchema).optional().default([]),
})

const ProductOutSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  status: ProductStatusSchema,
  category: ProductCategorySchema,
  product_type: z.string().nullable(),
  channels: z.string().nullable().optional(),
  vendor: z.string(),
  theme_template: z.string(),
  seo_title: z.string().nullable(),
  seo_description: z.string().nullable(),
  meta_description: z.string().nullish(),
  material: z.string().nullish(),
  dimensions: z.string().nullish(),
  shipping_return_policy: z.string().nullish(),
  url_handle: z.string().nullable(),
  tags: z.string().nullable(),
  categories: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  variants: z.array(VariantOutSchema),
  images: z.array(ProductImageOutSchema),
})

const CollectionOutSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  conditions: z.string().nullable().optional(),
  channels: z.string().nullable().optional(),
  collection_type: z.string(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  url_handle: z.string().nullable().optional(),
  parent_id: z.number().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

const SearchParamsSchema = z.object({
  q: z.string().trim().min(1, "Enter a search term").max(100),
})

export {
  ProductCategorySchema,
  ProductStatusSchema,
  ProductListOutSchema,
  VariantOutSchema,
  ProductImageOutSchema,
  ProductOutSchema,
  CollectionOutSchema,
  SearchParamsSchema,
}

export type ProductListOut = z.infer<typeof ProductListOutSchema>
export type ProductOut = z.infer<typeof ProductOutSchema>
export type VariantOut = z.infer<typeof VariantOutSchema>
export type ProductImageOut = z.infer<typeof ProductImageOutSchema>
export type CollectionOut = z.infer<typeof CollectionOutSchema>
export type SearchParams = z.infer<typeof SearchParamsSchema>
