"use client"

import { API_BASE } from "@/lib/api"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FileText,
  FileCode,
  Plus,
  MagnifyingGlass,
  SlidersHorizontal,
  Trash,
  X,
  Spinner,
} from "@phosphor-icons/react"
import { toast } from "sonner"

interface PageRecord {
  id: number | string
  title: string
  handle: string
  visibility: "Visible" | "Hidden"
  contentPreview?: string
  updatedAt: string
}

export default function AdminPagesListPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([])
  const [deleting, setDeleting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const deletedKeysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    setMounted(true)
  }, [])

  // Pages List - Strictly Custom CMS Marketing Pages (Sales, About Us, Contact Us, Track Order)
  const [pagesList, setPagesList] = useState<PageRecord[]>([
    {
      id: 1,
      title: "Sales",
      handle: "sales",
      visibility: "Visible",
      contentPreview: "Explore exclusive limited-time promotional deals and discounts on genuine handcrafted leather goods.",
      updatedAt: "17 Aug 2026",
    },
    {
      id: 2,
      title: "About Us",
      handle: "about-us",
      visibility: "Visible",
      contentPreview: "Discover the heritage of Eligo Leather master artisans, top-grain craftsmanship, and ethical sourcing.",
      updatedAt: "17 Aug 2026",
    },
    {
      id: 3,
      title: "Contact Us",
      handle: "contact-us",
      visibility: "Visible",
      contentPreview: "Get in touch with Eligo Leather customer support team via email, phone, or store visit.",
      updatedAt: "17 Aug 2026",
    },
    {
      id: 4,
      title: "Track Your Order",
      handle: "track-order",
      visibility: "Visible",
      contentPreview: "Enter your Leopard CN tracking number to track your package delivery status in real-time.",
      updatedAt: "17 Aug 2026",
    },
  ])

  // Fetch live pages from Backend DB
  useEffect(() => {
    let isMounted = true

    // Check LocalStorage backup
    try {
      const stored = localStorage.getItem("eligo_created_pages")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
          setPagesList((prev) => {
            const combined = [...parsed, ...prev]
            const uniqueMap = new Map()
            combined.forEach((item) => {
              const key = item.id || item.handle || item.title
              if (!uniqueMap.has(key)) {
                uniqueMap.set(key, item)
              }
            })
            return Array.from(uniqueMap.values())
          })
        }
      }
    } catch (e) {
      console.log("localStorage read error", e)
    }

    // Fetch from Backend PostgreSQL DB
    const fetchPagesFromDB = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/pages/`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data) && data.length > 0) {
            const mapped: PageRecord[] = data.map((p: any) => ({
              id: p.id,
              title: p.title,
              handle: p.handle || p.title.toLowerCase().replace(/\s+/g, "-"),
              visibility: p.visibility === "Visible" ? "Visible" : "Hidden",
              contentPreview: p.content ? p.content.replace(/<[^>]*>?/gm, "").substring(0, 60) + "..." : "",
              updatedAt: p.updated_at ? new Date(p.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "28 Oct 2024",
            }))

            setPagesList((prev) => {
              const combined = [...mapped, ...prev]
              const uniqueMap = new Map()
              combined.forEach((item) => {
                const key = item.id || item.handle || item.title
                if (!uniqueMap.has(key)) {
                  uniqueMap.set(key, item)
                }
              })
              return Array.from(uniqueMap.values())
            })
          }
        }
      } catch (err) {
        console.log("Pages API offline, rendering default list.")
      }
    }

    fetchPagesFromDB()
    return () => {
      isMounted = false
    }
  }, [])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredPages.map((p) => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: number | string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const refreshPagesFromDB = () => {
    fetch(`${API_BASE}/api/v1/pages/`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped: PageRecord[] = data.map((p: any) => ({
            id: p.id,
            title: p.title,
            handle: p.handle || p.title.toLowerCase().replace(/\s+/g, "-"),
            visibility: p.visibility === "Visible" ? "Visible" : "Hidden",
            contentPreview: p.content ? p.content.replace(/<[^>]*>?/gm, "").substring(0, 60) + "..." : "",
            updatedAt: p.updated_at ? new Date(p.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "28 Oct 2024",
          }))
          setPagesList((prev) => {
            const currentSourceKeys = new Set(mapped.map((p) => String(p.id)))
            const localPages = prev.filter(
              (p) =>
                !deletedKeysRef.current.has(String(p.id)) &&
                !deletedKeysRef.current.has(p.handle) &&
                !deletedKeysRef.current.has(p.title) &&
                (Number.isInteger(p.id) ? !currentSourceKeys.has(String(p.id)) : true)
            )
            return [...mapped, ...localPages]
          })
        }
      })
      .catch(() => {})
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    const selectedPages = pagesList.filter((p) => selectedIds.includes(p.id))
    const targetNames = selectedPages.map((p) => `"${p.title}"`)
    if (!confirm(`Delete ${selectedPages.length} page${selectedPages.length === 1 ? "" : "s"}? ${targetNames.join(", ")}`)) return

    setDeleting(true)
    const ids = selectedPages.filter((p) => typeof p.id === "number").map((p) => Number(p.id))
    const handles = selectedPages.map((p) => p.handle)

    try {
      const res = await fetch(`${API_BASE}/api/v1/pages/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, handles }),
      })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        const count = data?.deleted ?? selectedPages.length
        toast.success(`Deleted ${count} page${count === 1 ? "" : "s"} from the database.`)
      } else {
        toast.error("Failed to delete pages. They were removed locally but the database was not updated.")
      }
    } catch {
      toast.error("Could not reach the server. Pages were removed locally only.")
    }

    // Remember the deleted pages so they are not re-added on refresh.
    selectedPages.forEach((p) => {
      deletedKeysRef.current.add(String(p.id))
      if (p.handle) deletedKeysRef.current.add(p.handle)
      deletedKeysRef.current.add(p.title)
    })

    // Remove selected pages from the local list and the localStorage backup.
    const keptKeys = new Set(selectedIds.map((id) => String(id)))
    const keptTitles = new Set(selectedPages.map((p) => p.title))
    setPagesList((prev) => prev.filter((p) => !keptKeys.has(String(p.id)) && !keptTitles.has(p.title)))
    try {
      const stored = localStorage.getItem("eligo_created_pages")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          const updated = parsed.filter((p) =>
            !selectedIds.some((id) => String(p?.id) === String(id)) &&
            !keptTitles.has(p?.title)
          )
          localStorage.setItem("eligo_created_pages", JSON.stringify(updated))
        }
      }
    } catch { /* ignore */ }

    setSelectedIds([])
    setDeleting(false)
    refreshPagesFromDB()
  }

  const filteredPages = pagesList.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return p.title.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q)
  })

  return (
    <div suppressHydrationWarning className="space-y-4 font-sans text-gray-900 pb-16">
      {/* Top Header Bar matching Pic 1 */}
      <div className="flex items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-700" />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Pages</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/online-store/pages/robots"
            className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
          >
            <FileCode className="w-4 h-4 text-amber-800" />
            <span>Edit robots.txt</span>
          </Link>

          <Link
            href="/online-store/pages/new"
            className="px-4 py-2 bg-[#1a1a1a] hover:bg-black text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
          >
            <span>Add page</span>
          </Link>
        </div>
      </div>

      {/* Main Pages Table Card matching Pic 1 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-3.5 border-b border-gray-200 flex items-center justify-between gap-4 bg-gray-50/50">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <button className="px-3 py-1 bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-1">
              <span>All</span>
            </button>
            <button onClick={() => toast.info("Create custom pages filter")} className="p-1 hover:bg-gray-200 rounded-lg text-gray-600">
              <Plus className="w-4 h-4" />
            </button>
            <div className="relative flex-1">
              <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages"
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-white border border-gray-300 text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl text-gray-600 shadow-2xs">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar (shown when pages are selected) */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-900">
                {selectedIds.length} selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Clear selection
              </button>
            </div>
            <button
              type="button"
              disabled={deleting}
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {deleting ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <Trash className="w-3.5 h-3.5" />}
              <span>{deleting ? "Deleting..." : `Delete ${selectedIds.length === 1 ? "page" : "pages"}`}</span>
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-600 font-semibold text-[11px]">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredPages.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-amber-800 focus:ring-amber-800 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-[30%]">Title ↕</th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-[14%]">Visibility</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Content</th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-[14%] text-right">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPages.map((pageItem, idx) => {
                const isSelected = selectedIds.includes(pageItem.id)
                return (
                  <tr
                    key={pageItem.id ? `page-${pageItem.id}-${idx}` : `page-${idx}`}
                    className={`hover:bg-[#faf8f5] transition-colors cursor-pointer ${
                      isSelected ? "bg-amber-50/50" : ""
                    }`}
                    onClick={() => router.push(`/online-store/pages/${pageItem.id}`)}
                  >
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(pageItem.id)}
                        className="w-4 h-4 rounded border-gray-300 text-amber-800 focus:ring-amber-800 cursor-pointer"
                      />
                    </td>

                    {/* Title */}
                    <td className="py-3.5 px-4 font-bold text-gray-900 text-xs hover:underline">
                      {pageItem.title}
                    </td>

                    {/* Visibility */}
                    <td className="py-3.5 px-4">
                      {pageItem.visibility === "Visible" ? (
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#d1fae5] text-[#065f46]">
                          Visible
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800">
                          Hidden
                        </span>
                      )}
                    </td>

                    {/* Content Preview */}
                    <td className="py-3.5 px-4 text-gray-500 font-medium truncate max-w-xs">
                      {pageItem.contentPreview || "—"}
                    </td>

                    {/* Updated */}
                    <td className="py-3.5 px-4 text-right font-medium text-gray-600">{pageItem.updatedAt}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
