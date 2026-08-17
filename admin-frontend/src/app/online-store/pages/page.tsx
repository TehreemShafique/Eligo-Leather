"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FileText,
  FileCode,
  Plus,
  MagnifyingGlass,
  SlidersHorizontal,
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Pages List matching Pic 1
  const [pagesList, setPagesList] = useState<PageRecord[]>([
    {
      id: 1,
      title: "Terms of Service",
      handle: "terms-of-service",
      visibility: "Visible",
      contentPreview: "",
      updatedAt: "19 Apr 2025",
    },
    {
      id: 2,
      title: "Refund Policy",
      handle: "refund-policy",
      visibility: "Visible",
      contentPreview: "",
      updatedAt: "19 Apr 2025",
    },
    {
      id: 3,
      title: "Contact Us",
      handle: "contact-us",
      visibility: "Visible",
      contentPreview: "",
      updatedAt: "28 Mar 2025",
    },
    {
      id: 4,
      title: "Track Your Order",
      handle: "track-order",
      visibility: "Visible",
      contentPreview: "",
      updatedAt: "1 Jan 2025",
    },
    {
      id: 5,
      title: "Privacy Policy",
      handle: "privacy-policy",
      visibility: "Visible",
      contentPreview: "",
      updatedAt: "31 Dec 2024",
    },
    {
      id: 6,
      title: "About Us",
      handle: "about-us",
      visibility: "Visible",
      contentPreview: "",
      updatedAt: "31 Dec 2024",
    },
    {
      id: 7,
      title: "Sales",
      handle: "sales",
      visibility: "Visible",
      contentPreview: "",
      updatedAt: "31 Dec 2024",
    },
    {
      id: 8,
      title: "HTML sitemap for blogs",
      handle: "avada-sitemap-blogs",
      visibility: "Hidden",
      contentPreview: "Blogs Blog Different Leather Grades & Leather Quality: ...",
      updatedAt: "28 Oct 2024",
    },
    {
      id: 9,
      title: "HTML sitemap for articles",
      handle: "avada-sitemap-articles",
      visibility: "Hidden",
      contentPreview: "Blog Posts Sewing of Leather: The Art and Craft Behind ...",
      updatedAt: "28 Oct 2024",
    },
    {
      id: 10,
      title: "HTML sitemap for collections",
      handle: "avada-sitemap-collections",
      visibility: "Hidden",
      contentPreview: "Collections Accessories All All Belts All Cases All Keych...",
      updatedAt: "28 Oct 2024",
    },
    {
      id: 11,
      title: "HTML sitemap for products",
      handle: "avada-sitemap-products",
      visibility: "Hidden",
      contentPreview: "Products Gift Box Gift Box Gift Box Gift Box Gift Box Gift ...",
      updatedAt: "28 Oct 2024",
    },
    {
      id: 12,
      title: "HTML sitemap",
      handle: "avada-sitemap",
      visibility: "Hidden",
      contentPreview: "Products Gift Box Gift Box Gift Box Gift Box Gift Box Gift ...",
      updatedAt: "28 Oct 2024",
    },
    {
      id: 13,
      title: "HTML sitemap for pages",
      handle: "avada-sitemap-pages",
      visibility: "Hidden",
      contentPreview: "Pages Contact Information Terms of Service Refund Pol...",
      updatedAt: "28 Oct 2024",
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
        const res = await fetch("http://127.0.0.1:8000/api/v1/pages/")
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
