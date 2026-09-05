import type { components } from "@/types/api-types"

export type StoreSettingOut = components["schemas"]["StoreSettingOut"]
export type StoreBrandOut = components["schemas"]["StoreBrandOut"]
export type HeaderScriptOut = components["schemas"]["HeaderScriptOut"]

export type NavItem = {
  label: string
  href: string
}

export type StorefrontConfig = {
  storeName: string
  slogan: string | null
  logoUrl: string | null
  currency: string
  timezone: string
  country: string | null
  nav: NavItem[]
  headerScripts: string
}
