import { api } from "@/lib/api-client"
import { buildCategoryGroups } from "@/modules/catalog/categories"
import { listCollections } from "@/modules/catalog/api"
import type { Menu, MenuItem } from "./types"

export const DEFAULT_HEADER_NAV: Array<{
  label: string
  url: string
  children?: Array<{
    label: string
    url: string
    subChildren?: Array<{ label: string; url: string }>
  }>
}> = [
  { label: "Home", url: "/" },
  // Collections/categories under "Our Product" are built dynamically from
  // the admin-created catalog collections (see buildHeaderProductMenu).
  { label: "Our Product", url: "/products" },
  { label: "Contact Us", url: "/contact" },
]

// Public navigation content: safe to cache at the edge for a short window.
const MENUS_CACHE = { next: { revalidate: 60, tags: ["menus"] } }

export async function listMenus(): Promise<Menu[]> {
  try {
    const data = await api.get("/menus", { auth: false, ...MENUS_CACHE })
    return Array.isArray(data) ? data : []
  } catch {
    console.warn("Backend API offline or unreachable, falling back to default navigation menu.")
    return []
  }
}

export async function getMenu(menuId: number): Promise<Menu | null> {
  try {
    const data = await api.get(`/menus/${menuId}`, { auth: false, ...MENUS_CACHE })
    return data as Menu
  } catch (error) {
    console.error(`Failed to fetch menu ${menuId}:`, error)
    return null
  }
}

// Builds the "Our Product" dropdown children from the admin-created catalog
// collections: one entry per collection that has categories in the database,
// with its admin-created categories as the hover sub-dropdown. Shared data
// source with the products-page left sidebar (buildCategoryGroups).
export async function buildHeaderProductMenu(): Promise<MenuItem[]> {
  try {
    const collections = await listCollections()
    if (!collections.length) return []
    return buildCategoryGroups(collections).map((group, groupIndex) => ({
      id: 9100 + groupIndex,
      label: group.label,
      url: group.href,
      position: groupIndex,
      children: group.categories.map((category, categoryIndex) => ({
        id: 9200 + groupIndex * 100 + categoryIndex,
        label: category.name,
        url: category.href,
        position: categoryIndex,
      })),
    }))
  } catch {
    return []
  }
}

function isOurProductItem(item: MenuItem): boolean {
  return (
    item.label.trim().toLowerCase() === "our product" ||
    item.label.trim().toLowerCase() === "our products" ||
    item.url === "/products"
  )
}

async function attachDynamicProductMenu(
  items: MenuItem[],
): Promise<MenuItem[]> {
  const productChildren = await buildHeaderProductMenu()

  const existingIndex = items.findIndex(isOurProductItem)
  if (existingIndex >= 0) {
    const next = [...items]
    next[existingIndex] = {
      ...next[existingIndex],
      children: productChildren.length ? productChildren : undefined,
    }
    return next
  }

  if (!productChildren.length) return items

  // Base navigation without an Our Product entry: insert it after Home.
  const insertAt = items.length > 1 ? 1 : items.length
  const synthetic: MenuItem = {
    id: 9000,
    label: "Our Product",
    url: "/products",
    position: insertAt,
    children: productChildren,
  }
  return [
    ...items.slice(0, insertAt),
    synthetic,
    ...items.slice(insertAt),
  ]
}

export async function getHeaderMenu(): Promise<MenuItem[]> {
  try {
    let items: MenuItem[] = []
    const menus = await listMenus()
    if (menus && menus.length > 0) {
      const headerMenuMeta =
        menus.find((m) => m.handle === "header" || m.handle === "main-menu" || m.handle === "header-menu") ||
        menus[0]

      if (headerMenuMeta) {
        const fullMenu = await getMenu(headerMenuMeta.id)
        if (fullMenu && fullMenu.items && fullMenu.items.length > 0) {
          // Filter out Blog and Sales
          items = fullMenu.items.filter((item) => {
            const lowerLabel = item.label.toLowerCase()
            const lowerUrl = (item.url || "").toLowerCase()
            return !lowerLabel.includes("blog") && !lowerLabel.includes("sale") && lowerUrl !== "/blog" && lowerUrl !== "/sales"
          })
        }
      }
    }

    if (!items.length) {
      items = transformDefaultNav(DEFAULT_HEADER_NAV)
    }

    // Collections/categories always come from the live catalog database.
    return await attachDynamicProductMenu(items)
  } catch (error) {
    console.error("Failed to fetch header menu:", error)
    return transformDefaultNav(DEFAULT_HEADER_NAV)
  }
}

function transformDefaultNav(
  items: Array<{
    label: string
    url: string
    children?: Array<{
      label: string
      url: string
      subChildren?: Array<{ label: string; url: string }>
    }>
  }>
): MenuItem[] {
  return items.map((item, idx) => ({
    id: idx + 1,
    label: item.label,
    url: item.url,
    position: idx,
    children: item.children
      ? item.children.map((child, cIdx) => ({
          id: (idx + 1) * 100 + cIdx + 1,
          label: child.label,
          url: child.url,
          position: cIdx,
          children: child.subChildren
            ? child.subChildren.map((sub, sIdx) => ({
                id: (idx + 1) * 1000 + (cIdx + 1) * 10 + sIdx + 1,
                label: sub.label,
                url: sub.url,
                position: sIdx,
              }))
            : undefined,
        }))
      : undefined,
  }))
}

export const DEFAULT_HEADER_MENU = transformDefaultNav(DEFAULT_HEADER_NAV)
