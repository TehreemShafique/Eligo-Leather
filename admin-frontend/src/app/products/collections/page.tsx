"use client"

import { API_BASE } from "@/lib/api"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { FolderOpen, Plus, MagnifyingGlass, Trash } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

interface CategoryItem {
  id: number
  title: string
  description?: string
  productsCount: number
  conditions: string
  image: string
  collection_type: string
}

const COLLECTION_TYPES = [
  { value: "all", label: "All Collections" },
  { value: "wallets", label: "Wallets" },
  { value: "belts", label: "Belts" },
  { value: "cases", label: "Cases" },
  { value: "keychains", label: "Keychains" },
] as const

const COLLECTION_HEADINGS: Record<string, string> = {
  wallets: "Wallets",
  belts: "Belts",
  cases: "Cases",
  keychains: "Keychains",
}

const COLLECTION_ORDER = ["wallets", "belts", "cases", "keychains"]

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")

  const fetchCategoriesFromDB = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/catalog/collections/`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const mapped: CategoryItem[] = data.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            productsCount: c.products_count ?? 0,
            conditions: c.conditions || "Manual category collection",
            image: c.image_url || "",
            collection_type: c.collection_type || "wallets",
          }))
          setCategories(mapped)
        } else {
          setCategories([])
        }
      }
    } catch (err) {
      console.error("Failed to load categories:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategoriesFromDB()
  }, [])

  const handleDeleteCategory = async (category: CategoryItem) => {
    if (
      !window.confirm(
        `Delete "${category.title}" permanently? It will also disappear from the store frontend.`,
      )
    ) {
      return
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/catalog/collections/${category.id}`, { method: "DELETE" })
      if (res.ok || res.status === 204) {
        setCategories(prev => prev.filter(c => c.id !== category.id))
        toast.success(`"${category.title}" deleted from database successfully!`)
      } else {
        const detail = await res.text().catch(() => "")
        toast.error(`Backend refused to delete category (${res.status}). ${detail.slice(0, 120)}`)
      }
    } catch (err) {
      console.error("Failed to delete category:", err)
      toast.error("Could not reach the backend. Category was NOT deleted.")
    }
  }

  const searchFiltered = useMemo(() => {
    if (!searchQuery) return categories
    return categories.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [categories, searchQuery])

  const groupedByType = useMemo(() => {
    const groups: Record<string, CategoryItem[]> = {}
    for (const type of COLLECTION_ORDER) {
      groups[type] = searchFiltered.filter(c => c.collection_type === type)
    }
    return groups
  }, [searchFiltered])

  const displayedTypes = useMemo(() => {
    if (filterType === "all") return COLLECTION_ORDER
    return COLLECTION_ORDER.filter(t => t === filterType)
  }, [filterType])

  const totalCount = searchFiltered.length

  return (
    <div className="space-y-5 font-sans">
      <PageHeader
        title="Categories"
        icon={<FolderOpen className="w-5 h-5" />}
        actions={
          <Link
            href="/products/collections/new"
            className="eligo-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add category</span>
          </Link>
        }
      />

      {/* Toolbar */}
      <div className="eligo-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="eligo-input pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Collection Filter Dropdown */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-9 px-3 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-900 cursor-pointer"
            >
              {COLLECTION_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>
                  {ct.label}
                </option>
              ))}
            </select>

            <span className="text-xs font-bold text-gray-700 whitespace-nowrap">
              Total: <span className="text-amber-800 font-extrabold">{totalCount}</span>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-gray-500 font-semibold">
            Loading Categories from Database...
          </div>
        ) : totalCount === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-500">No categories found</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchQuery ? "Try a different search term." : "Create your first category to get started."}
            </p>
            {!searchQuery && (
              <Link
                href="/products/collections/new"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Category
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-0">
            {displayedTypes.map((type) => {
              const items = groupedByType[type]
              if (!items || items.length === 0) return null

              return (
                <div key={type}>
                  {/* Collection Heading */}
                  <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-extrabold text-amber-900 uppercase tracking-wide">
                        {COLLECTION_HEADINGS[type]}
                      </h2>
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold rounded-full">
                        {items.length} {items.length === 1 ? "category" : "categories"}
                      </span>
                    </div>
                  </div>

                  {/* Table for this collection */}
                  <div className="eligo-table-wrap">
                    <table className="eligo-table">
                      <thead>
                        <tr>
                          <th className="eligo-th">Category Title</th>
                          <th className="eligo-th w-[25%]">Products Count</th>
                          <th className="eligo-th w-[15%] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((c) => (
                          <tr key={c.id} className="hover:bg-amber-50/40 transition-colors">
                            <td className="eligo-td font-bold text-amber-900">
                              <Link href="/products/collections/new" className="hover:underline">{c.title}</Link>
                            </td>
                            <td className="eligo-td font-semibold text-gray-900">{c.productsCount} products</td>
                            <td className="eligo-td text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(c)}
                                className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                                title="Delete category"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
