import type { components } from "@/types/api-types"

export type ProductStatus = components["schemas"]["ProductStatus"]
export type ProductCategory = components["schemas"]["ProductCategory"]

export type ProductListItem = components["schemas"]["ProductListOut"]
export type ProductDetail = components["schemas"]["ProductOut"]
export type ProductVariant = components["schemas"]["VariantOut"]
export type ProductImage = components["schemas"]["ProductImageOut"]
export type Collection = components["schemas"]["CollectionOut"]

export const PRODUCT_CATEGORIES: { value: string; label: string }[] = [
  { value: "belts", label: "Belts" },
  { value: "wallets", label: "Wallets" },
  { value: "bifold-wallets", label: "Bifold Wallets" },
  { value: "trifold-wallets", label: "Trifold Wallets" },
  { value: "card-holders", label: "Card Holder Wallets" },
  { value: "slim-wallets", label: "Slim Wallets" },
  { value: "formal-belts", label: "Formal Belts" },
  { value: "casual-belts", label: "Casual Belts" },
  { value: "reversible-belts", label: "Reversible Belts" },
  { value: "keychains", label: "Keychains" },
  { value: "keychain-holders", label: "Keychain Holders" },
  { value: "car-key-covers", label: "Car Key Covers" },
  { value: "cases", label: "Cases & Accessories" },
  { value: "passport-cases", label: "Passport Cases" },
  { value: "watch-cases", label: "Watch Cases" },
  { value: "bags", label: "Bags" },
  { value: "accessories", label: "Accessories" },
  { value: "other", label: "Other" },
]

export function getCategoryLabel(category: string): string {
  return PRODUCT_CATEGORIES.find((c) => c.value === category)?.label ?? category.replace(/-/g, " ").toUpperCase()
}

export function getProductSlug(product: { id: number; url_handle?: string | null }): string {
  return product.url_handle?.trim() ? product.url_handle : String(product.id)
}

export function isCategorySlug(value: string): boolean {
  return PRODUCT_CATEGORIES.some((c) => c.value === value)
}
