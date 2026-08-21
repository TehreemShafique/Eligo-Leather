import { api } from "@/lib/api-client"
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
  {
    label: "Our Product",
    url: "/products",
    children: [
      {
        label: "Wallets",
        url: "/categories/wallets",
        subChildren: [
          { label: "Bifold Wallets", url: "/categories/bifold-wallets" },
          { label: "Trifold Wallets", url: "/categories/trifold-wallets" },
          { label: "Card Holder Wallets", url: "/categories/card-holders" },
          { label: "Slim Wallets", url: "/categories/slim-wallets" },
        ],
      },
      {
        label: "Belts",
        url: "/categories/belts",
        subChildren: [
          { label: "Formal Belts", url: "/categories/formal-belts" },
          { label: "Casual Belts", url: "/categories/casual-belts" },
          { label: "Reversible Belts", url: "/categories/reversible-belts" },
        ],
      },
      {
        label: "Keychains",
        url: "/categories/keychains",
        subChildren: [
          { label: "Keychain Holders", url: "/categories/keychain-holders" },
          { label: "Car Key Covers", url: "/categories/car-key-covers" },
        ],
      },
      {
        label: "Cases",
        url: "/categories/cases",
        subChildren: [
          { label: "Passport Cases", url: "/categories/passport-cases" },
          { label: "Watch Cases", url: "/categories/watch-cases" },
        ],
      },
    ],
  },
  { label: "Contact Us", url: "/contact" },
]

export async function listMenus(): Promise<Menu[]> {
  try {
    const data = await api.get("/menus", { auth: false })
    return Array.isArray(data) ? data : []
  } catch {
    console.warn("Backend API offline or unreachable, falling back to default navigation menu.")
    return []
  }
}

export async function getMenu(menuId: number): Promise<Menu | null> {
  try {
    const data = await api.get(`/menus/${menuId}`, { auth: false })
    return data as Menu
  } catch (error) {
    console.error(`Failed to fetch menu ${menuId}:`, error)
    return null
  }
}

export async function getHeaderMenu(): Promise<MenuItem[]> {
  try {
    const menus = await listMenus()
    if (!menus || menus.length === 0) {
      return transformDefaultNav(DEFAULT_HEADER_NAV)
    }

    const headerMenuMeta =
      menus.find((m) => m.handle === "header" || m.handle === "main-menu" || m.handle === "header-menu") ||
      menus[0]

    if (!headerMenuMeta) {
      return transformDefaultNav(DEFAULT_HEADER_NAV)
    }

    const fullMenu = await getMenu(headerMenuMeta.id)
    if (fullMenu && fullMenu.items && fullMenu.items.length > 0) {
      // Filter out Blog and Sales
      return fullMenu.items.filter((item) => {
        const lowerLabel = item.label.toLowerCase()
        const lowerUrl = (item.url || "").toLowerCase()
        return !lowerLabel.includes("blog") && !lowerLabel.includes("sale") && lowerUrl !== "/blog" && lowerUrl !== "/sales"
      })
    }

    return transformDefaultNav(DEFAULT_HEADER_NAV)
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
