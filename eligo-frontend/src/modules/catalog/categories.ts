import { api } from "@/lib/api-client"
import type { MenuItem } from "@/modules/menu/types"

export interface CategoryNode {
  id: number
  title: string
  slug: string
  parent_id: number | null
  product_count: number
  children: CategoryNode[]
}

/** Public admin-managed category tree (built from collections). */
export async function fetchCategoryTree(): Promise<CategoryNode[]> {
  try {
    const data = await api.get("/catalog/categories/tree", {
      auth: false,
      next: { revalidate: 60, tags: ["catalog"] },
    })
    return Array.isArray(data) ? (data as CategoryNode[]) : []
  } catch (error) {
    console.warn("Backend API /catalog/categories/tree error or unreachable:", error)
    return []
  }
}

export function findCategoryBySlug(
  nodes: CategoryNode[],
  slug: string,
): CategoryNode | null {
  for (const node of nodes) {
    if (node.slug === slug) return node
    const nested = findCategoryBySlug(node.children, slug)
    if (nested) return nested
  }
  return null
}

function categoryNodeToMenuItem(node: CategoryNode): MenuItem {
  return {
    id: node.id,
    label: node.title,
    url: `/categories/${node.slug}`,
    children: node.children.map(categoryNodeToMenuItem),
  }
}

/**
 * Replaces the hardcoded navigation dropdown entries under the
 * "Our Product" item with the live DB category tree.
 */
export function mergeCategoryTreeIntoNav(
  items: MenuItem[],
  tree: CategoryNode[],
): MenuItem[] {
  if (!tree.length) return items

  let replaced = false
  const merged = items.map((item) => {
    const isProductItem =
      item.url === "/products" || item.label.toLowerCase().includes("product")
    if (!isProductItem) return item
    replaced = true
    return { ...item, children: tree.map(categoryNodeToMenuItem) }
  })

  return replaced ? merged : items
}
