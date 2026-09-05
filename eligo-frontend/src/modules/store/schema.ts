import { z } from "zod"

const StoreSettingOutSchema = z.object({
  id: z.number(),
  store_name: z.string(),
  support_email: z.string().nullable().optional(),
  store_phone: z.string().nullable().optional(),
  country: z.string(),
  currency: z.string(),
  backup_region: z.string().nullable().optional(),
  timezone: z.string(),
  unit_system: z.string().nullable().optional(),
})

const StoreBrandOutSchema = z.object({
  logo_url: z.string().nullable(),
  square_logo_url: z.string().nullable().optional(),
  primary_color: z.string().nullable().optional(),
  slogan: z.string().nullable(),
  short_description: z.string().nullable().optional(),
})

const HeaderScriptOutSchema = z.object({
  user_id: z.number(),
  header_scripts: z.string(),
  updated_at: z.string().nullable().optional(),
  disclaimer: z.string(),
})

const PublicStoreSchemaOutSchema = z.object({
  id: z.number(),
  name: z.string(),
  schema_type: z.string(),
  target_pages: z.string(),
  schema_json: z.string(),
  is_active: z.boolean(),
})

const NavItemSchema = z.object({
  label: z.string(),
  href: z.string(),
})

const StorefrontConfigSchema = z.object({
  storeName: z.string(),
  slogan: z.string().nullable(),
  logoUrl: z.string().nullable(),
  currency: z.string(),
  timezone: z.string(),
  country: z.string().nullable(),
  nav: z.array(NavItemSchema),
  headerScripts: z.string(),
})

export {
  StoreSettingOutSchema,
  StoreBrandOutSchema,
  HeaderScriptOutSchema,
  PublicStoreSchemaOutSchema,
  NavItemSchema,
  StorefrontConfigSchema,
}

export type StoreSettingOut = z.infer<typeof StoreSettingOutSchema>
export type StoreBrandOut = z.infer<typeof StoreBrandOutSchema>
export type HeaderScriptOut = z.infer<typeof HeaderScriptOutSchema>
export type PublicStoreSchemaOut = z.infer<typeof PublicStoreSchemaOutSchema>
export type StorefrontConfig = z.infer<typeof StorefrontConfigSchema>
