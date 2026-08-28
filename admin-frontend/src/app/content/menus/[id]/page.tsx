"use client"

import { apiFetch } from "@/lib/api"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import {
  CaretLeft,
  Image as ImageIcon,
  Plus,
  Trash,
  Check,
  DotsSixVertical,
  MagnifyingGlass,
  LinkSimple,
  FolderSimple,
  Package,
  FileText,
  House,
} from "@phosphor-icons/react"
import { toast } from "sonner"

interface MenuItemRow {
  localId: string
  dbId: number | null
  label: string
  link: string
  isDropdownOpen?: boolean
}

const EXISTING_WEBSITE_LINKS = [
  { name: "Home Page", url: "/", icon: House, category: "Pages" },
  { name: "All Products Catalog", url: "/products", icon: Package, category: "Catalog" },
  { name: "Collections Directory", url: "/collections", icon: FolderSimple, category: "Catalog" },
  { name: "Leather Bags Collection", url: "/collections/bags", icon: FolderSimple, category: "Collections" },
  { name: "Leather Jackets Collection", url: "/collections/jackets", icon: FolderSimple, category: "Collections" },
  { name: "Formal Belts Collection", url: "/collections/belts", icon: FolderSimple, category: "Collections" },
  { name: "Leather Wallets Collection", url: "/collections/wallets", icon: FolderSimple, category: "Collections" },
  { name: "Accessories Collection", url: "/collections/accessories", icon: FolderSimple, category: "Collections" },
  { name: "About Us Page", url: "/pages/about-us", icon: FileText, category: "Information" },
  { name: "Contact Us Page", url: "/pages/contact", icon: FileText, category: "Information" },
  { name: "Privacy Policy Page", url: "/pages/privacy-policy", icon: FileText, category: "Legal" },
  { name: "Refund & Return Policy", url: "/pages/refund-policy", icon: FileText, category: "Legal" },
  { name: "Terms of Service", url: "/pages/terms-of-service", icon: FileText, category: "Legal" },
  { name: "Blogs & News Articles", url: "/blogs", icon: FileText, category: "Content" },
  { name: "Storefront Search", url: "/search", icon: LinkSimple, category: "System" },
]

export default function EditMenuPage() {
  const router = useRouter()
  const params = useParams()
  const menuId = Number(params?.id)

  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [items, setItems] = useState<MenuItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const menu = await apiFetch<{
          id: number
          title: string
          handle: string
          items: { id: number; label: string; url: string; position: number }[]
        }>(`/api/v1/menus/${menuId}`)

        if (!isMounted) return
        setName(menu.title)
        setHandle(menu.handle)
        setItems(
          (menu.items || [])
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((it) => ({
              localId: `db-${it.id}`,
              dbId: it.id,
              label: it.label,
              link: it.url,
              isDropdownOpen: false,
            })),
        )
      } catch (err) {
        toast.error("Could not load this menu. It may not exist in the database.")
        router.replace("/content/menus")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [menuId, router])

  const handleAddItem = () => {
    const newItem: MenuItemRow = {
      localId: `item-${Date.now()}`,
      dbId: null,
      label: "",
      link: "",
      isDropdownOpen: false,
    }
    setItems([...items, newItem])
  }

  const handleRemoveItem = (localId: string) => {
    if (items.length === 1) {
      toast.error("A menu must have at least one menu item.")
      return
    }
    setItems(items.filter((item) => item.localId !== localId))
  }

  const handleUpdateItem = (localId: string, field: keyof MenuItemRow, value: string | boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.localId === localId ? { ...item, [field]: value } : item)),
    )
  }

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Please enter a menu name.")
      return
    }

    const validItems = items.filter((it) => it.label.trim())
    if (validItems.length === 0) {
      toast.error("Please add at least one menu item label.")
      return
    }

    setSaving(true)

    try {
      await apiFetch(`/api/v1/menus/${menuId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: name.trim(), handle: handle.trim() || name.toLowerCase().replace(/\s+/g, "-") }),
      })

      const existingIds = new Set(validItems.map((it) => it.dbId).filter(Boolean) as number[])
      const editedIds = new Set(items.filter((it) => it.dbId).map((it) => it.dbId as number))
      const removedIds = [...editedIds].filter((dbId) => !existingIds.has(dbId))

      for (const dbId of removedIds) {
        await apiFetch(`/api/v1/menus/items/${dbId}`, { method: "DELETE" })
      }

      await Promise.all(
        validItems.map(async (item, idx) => {
          const payload = {
            label: item.label.trim(),
            url: item.link.trim() || "/",
            position: idx,
          }
          if (item.dbId) {
            return apiFetch(`/api/v1/menus/items/${item.dbId}`, {
              method: "PATCH",
              body: JSON.stringify(payload),
            })
          }
          return apiFetch(`/api/v1/menus/${menuId}/items`, {
            method: "POST",
            body: JSON.stringify(payload),
          })
        }),
      )

      toast.success(`Menu "${name.trim()}" saved.`)
      router.push("/content/menus")
    } catch (err) {
      toast.error("Failed to save the menu. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto py-16 text-center text-sm text-gray-500">Loading menu…</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans text-gray-900 pb-20">
      <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
        <Link href="/content/menus" className="p-1 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors">
          <ImageIcon className="w-5 h-5 text-gray-700" />
        </Link>
        <span className="text-gray-400">›</span>
        <h1 className="text-lg font-bold text-gray-900">Edit menu</h1>
      </div>

      <form onSubmit={handleSaveMenu} className="space-y-6 text-xs">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="font-bold text-gray-900 text-xs block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sidebar menu"
              className="w-full h-11 px-4 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Handle:{" "}
            <span className="font-mono font-bold text-gray-800">
              {handle || "—"}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Menu items</h2>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.localId}
                className="bg-gray-50/70 rounded-2xl border border-gray-200 p-4 space-y-3 relative transition-all hover:border-gray-300"
              >
                <div className="flex items-center gap-3">
                  <div className="cursor-grab text-gray-400 hover:text-gray-600 shrink-0">
                    <DotsSixVertical className="w-4 h-4" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 block">Label</label>
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => handleUpdateItem(item.localId, "label", e.target.value)}
                      placeholder="e.g., About us"
                      className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 transition-all placeholder:text-gray-400"
                    />
                  </div>

                  <div className="flex-1 space-y-1 relative">
                    <label className="text-[11px] font-bold text-gray-700 block">Link</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={item.link}
                        onFocus={() => handleUpdateItem(item.localId, "isDropdownOpen", true)}
                        onChange={(e) => {
                          handleUpdateItem(item.localId, "link", e.target.value)
                          handleUpdateItem(item.localId, "isDropdownOpen", true)
                        }}
                        placeholder="Search or paste link"
                        className="w-full h-10 pl-3.5 pr-8 bg-white border border-gray-300 rounded-xl font-mono text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 transition-all placeholder:text-gray-400 placeholder:font-sans"
                      />
                      <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                    </div>

                    {item.isDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 p-2 max-h-64 overflow-y-auto space-y-1 animate-scale-in">
                        <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 flex items-center justify-between">
                          <span>Existing Website Links</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.localId, "isDropdownOpen", false)}
                            className="p-0.5 hover:bg-gray-100 rounded text-gray-500"
                          >
                            ✕
                          </button>
                        </div>

                        {EXISTING_WEBSITE_LINKS.filter((l) => {
                          if (!item.link.trim()) return true
                          const q = item.link.toLowerCase()
                          return l.name.toLowerCase().includes(q) || l.url.toLowerCase().includes(q)
                        }).map((linkObj, lIdx) => {
                          const IconComp = linkObj.icon
                          return (
                            <button
                              key={lIdx}
                              type="button"
                              onClick={() => {
                                handleUpdateItem(item.localId, "link", linkObj.url)
                                if (!item.label) {
                                  handleUpdateItem(item.localId, "label", linkObj.name.replace(" Page", "").replace(" Catalog", ""))
                                }
                                handleUpdateItem(item.localId, "isDropdownOpen", false)
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-amber-50 rounded-xl font-medium text-xs text-gray-800 flex items-center justify-between transition-colors group cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="p-1 rounded-lg bg-gray-100 group-hover:bg-amber-100 text-gray-600 group-hover:text-amber-900 transition-colors">
                                  <IconComp className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <span className="font-bold text-gray-900 block">{linkObj.name}</span>
                                  <span className="font-mono text-[10px] text-gray-400">{linkObj.url}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-extrabold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {linkObj.category}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 pt-5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateItem(item.localId, "isDropdownOpen", false)
                        toast.success(`Validated line item "${item.label || "Menu Item"}"`)
                      }}
                      className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                      title="Validate line item"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.localId)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Delete menu item"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Add menu item</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Link href="/content/menus" className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl transition-all">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-black text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  )
}
