import type { CollectionOut } from "./schema"

// The admin creates categories (collection rows) under one of the backend
// collection types. Those types are the storefront "collections" shown in
// the Our Product dropdown; every admin-created row of that type becomes a
// category inside it. Nothing here is hardcoded per-collection: a group only
// appears when at least one admin-created row exists for it.
export const COLLECTION_TYPE_LABELS: Record<string, string> = {
  wallets: "Wallets",
  belts: "Belts",
  cases: "Cases",
  keychains: "Keychains",
}

export interface StorefrontCategory {
  id: number
  name: string
  handle: string
  href: string
}

export interface StorefrontCategoryGroup {
  key: string
  label: string
  href: string
  categories: StorefrontCategory[]
}

export function isCollectionTypeSlug(slug: string): boolean {
  return Object.keys(COLLECTION_TYPE_LABELS).includes(slug)
}

function collectionHref(collection: CollectionOut): string {
  return `/categories/${
    collection.url_handle?.trim() ? collection.url_handle : collection.id
  }`
}

function toStorefrontCategory(collection: CollectionOut): StorefrontCategory {
  return {
    id: collection.id,
    name: collection.title.trim() || `Category ${collection.id}`,
    handle:
      collection.url_handle?.trim() ||
      String(collection.id),
    href: collectionHref(collection),
  }
}

function labelForType(type: string): string {
  return (
    COLLECTION_TYPE_LABELS[type] ??
    type.charAt(0).toUpperCase() + type.slice(1)
  )
}

const TYPE_ORDER = Object.keys(COLLECTION_TYPE_LABELS)

// Builds the collection -> category tree from admin-created collections.
// Used by BOTH the header "Our Product" dropdown and the products-page left
// sidebar so they always render the same data.
export function buildCategoryGroups(
  collections: CollectionOut[],
): StorefrontCategoryGroup[] {
  const byType = new Map<string, CollectionOut[]>()
  for (const collection of collections) {
    if (collection.parent_id != null) continue // child rows nest under their root later
    const type = collection.collection_type || "other"
    const bucket = byType.get(type)
    if (bucket) {
      bucket.push(collection)
    } else {
      byType.set(type, [collection])
    }
  }

  const orderedTypes = [
    ...TYPE_ORDER.filter((type) => byType.has(type)),
    ...[...byType.keys()]
      .filter((type) => !TYPE_ORDER.includes(type))
      .sort(),
  ]

  return orderedTypes.map((type) => {
    const members = (byType.get(type) ?? []).sort((a, b) =>
      a.title.localeCompare(b.title),
    )
    return {
      key: type,
      label: labelForType(type),
      href: `/categories/${type}`,
      categories: members.map(toStorefrontCategory),
    }
  })
}

// Flat list of every admin-created category across all groups.
export function flattenCategoryGroups(
  groups: StorefrontCategoryGroup[],
): StorefrontCategory[] {
  return groups.flatMap((group) => group.categories)
}
