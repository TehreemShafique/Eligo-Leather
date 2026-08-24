"use client"

import { API_BASE } from "@/lib/api"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  NotePencil,
  Plus,
  MagnifyingGlass,
  ChatDots,
  Sliders,
  CheckCircle,
  Eye,
  Trash,
  PencilSimple,
  Info,
  SlidersHorizontal,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

interface BlogPostRecord {
  id: number | string
  title: string
  thumbnailUrl?: string
  visibility: "Visible" | "Hidden"
  author: string
  blog: string
  updatedAt: string
  publishedAt: string
}

export default function AdminBlogPostsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([])

  // User requirement: Only set 1 single row by default!
  const [posts, setPosts] = useState<BlogPostRecord[]>([
    {
      id: 1,
      title: "Eco-Friendly Leather Wallets: A Wise Choice for Conscious Shoppers",
      thumbnailUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=100&q=80",
      visibility: "Visible",
      author: "Bilal Hussain Abbasi",
      blog: "News",
      updatedAt: "27 Jun 2025",
      publishedAt: "4 Dec 2024",
    },
  ])

  // Fetch live blog posts from DB & LocalStorage
  useEffect(() => {
    let isMounted = true

    // Check local storage for newly created blog posts
    const loadLocalCreated = () => {
      try {
        const stored = localStorage.getItem("eligo_created_blogs")
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
            setPosts((prev) => {
              const combined = [...parsed, ...prev]
              const uniqueMap = new Map()
              combined.forEach((item) => {
                const key = item.id || item.title
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
    }

    loadLocalCreated()

    // Fetch from Backend PostgreSQL DB
    const fetchBlogPostsFromDB = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/blog-posts/`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data) && data.length > 0) {
            const mapped: BlogPostRecord[] = data.map((p: any) => ({
              id: p.id,
              title: p.title,
              thumbnailUrl: p.featured_image || p.thumbnail_url || "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=100&q=80",
              visibility: p.is_visible || p.visibility === "Visible" ? "Visible" : "Hidden",
              author: p.author || "Bilal Hussain Abbasi",
              blog: p.blog_category || p.blog || "News",
              updatedAt: p.updated_at ? new Date(p.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "27 Jun 2025",
              publishedAt: p.published_at ? new Date(p.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "4 Dec 2024",
            }))

            setPosts((prev) => {
              const combined = [...mapped, ...prev]
              const uniqueMap = new Map()
              combined.forEach((item) => {
                const key = item.id || item.title
                if (!uniqueMap.has(key)) {
                  uniqueMap.set(key, item)
                }
              })
              return Array.from(uniqueMap.values())
            })
          }
        }
      } catch (err) {
        console.log("Blog API offline, rendering default single post.")
      }
    }

    fetchBlogPostsFromDB()
    return () => {
      isMounted = false
    }
  }, [])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredPosts.map((p) => p.id))
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

  const filteredPosts = posts.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.title.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q) ||
      p.blog.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4 font-sans text-gray-900 pb-16">
      {/* Top Header Bar matching Pic 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <NotePencil className="w-5 h-5 text-gray-700" />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Blog posts</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.info("Opening Manage Blogs Modal...")}
            className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <NotePencil className="w-4 h-4 text-gray-600" />
            <span>Manage blogs</span>
          </button>

          <button
            onClick={() => toast.info("Opening Blog Comments Moderation...")}
            className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ChatDots className="w-4 h-4 text-gray-600" />
            <span>Manage comments</span>
          </button>

          <Link
            href="/content/blogs/new"
            className="px-4 py-2 bg-[#1a1a1a] hover:bg-black text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
          >
            <span>Add blog post</span>
          </Link>
        </div>
      </div>

      {/* Info Banner matching Pic 1 */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center gap-3 text-xs text-blue-900 font-medium">
        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <span>There are </span>
          <button onClick={() => toast.info("3 blog comments pending moderation")} className="font-bold underline">
            3 comments
          </button>
          <span> that require moderation.</span>
        </div>
      </div>

      {/* Main Blog Posts Table Card matching Pic 1 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-3.5 border-b border-gray-200 flex items-center justify-between gap-4 bg-gray-50/50">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <button className="px-3 py-1 bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-1">
              <span>All</span>
            </button>
            <button onClick={() => toast.info("Create custom blog filter")} className="p-1 hover:bg-gray-200 rounded-lg text-gray-600">
              <Plus className="w-4 h-4" />
            </button>
            <div className="relative flex-1">
              <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search and filter blog posts"
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
                    checked={selectedIds.length > 0 && selectedIds.length === filteredPosts.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-amber-800 focus:ring-amber-800 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700">Title</th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-[12%]">Visibility</th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-[18%]">Author</th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-[12%]">Blog</th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-[14%]">Updated ↕</th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-[14%] text-right">Published</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post, idx) => {
                  const isSelected = selectedIds.includes(post.id)
                  return (
                    <tr
                      key={post.id ? `blog-${post.id}-${idx}` : `blog-${idx}`}
                      className={`hover:bg-[#faf8f5] transition-colors ${isSelected ? "bg-amber-50/50" : ""}`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(post.id)}
                          className="w-4 h-4 rounded border-gray-300 text-amber-800 focus:ring-amber-800 cursor-pointer"
                        />
                      </td>

                      {/* Thumbnail & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                            {post.thumbnailUrl ? (
                              <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                                IMG
                              </div>
                            )}
                          </div>
                          <span className="font-bold text-gray-900 text-xs line-clamp-2">{post.title}</span>
                        </div>
                      </td>

                      {/* Visibility */}
                      <td className="py-3.5 px-4">
                        {post.visibility === "Visible" ? (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#d1fae5] text-[#065f46]">
                            Visible
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                            Hidden
                          </span>
                        )}
                      </td>

                      {/* Author */}
                      <td className="py-3.5 px-4 font-medium text-gray-800">{post.author}</td>

                      {/* Blog */}
                      <td className="py-3.5 px-4 font-medium text-gray-800">{post.blog}</td>

                      {/* Updated */}
                      <td className="py-3.5 px-4 font-medium text-gray-600">{post.updatedAt}</td>

                      {/* Published */}
                      <td className="py-3.5 px-4 text-right font-medium text-gray-900">{post.publishedAt}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-gray-500 font-medium">
                    No blog posts found. Click "Add blog post" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
