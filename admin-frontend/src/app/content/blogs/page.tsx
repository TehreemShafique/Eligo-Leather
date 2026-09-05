"use client"

import { API_BASE } from "@/lib/api"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  NotePencil,
  Plus,
  MagnifyingGlass,
  SlidersHorizontal,
  Trash,
  PencilSimple,
  Spinner,
} from "@phosphor-icons/react"
import { toast } from "sonner"

interface BlogPostRecord {
  id: number
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
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [deleting, setDeleting] = useState(false)
  const [deletingIds, setDeletingIds] = useState<number[]>([])

  const [posts, setPosts] = useState<BlogPostRecord[]>([])

  // Fetch live blog posts from the backend PostgreSQL DB
  useEffect(() => {
    let isMounted = true

    const fetchBlogPostsFromDB = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/blog-posts/`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data)) {
            const mapped: BlogPostRecord[] = data.map((p: any) => ({
              id: Number(p.id),
              title: p.title,
              thumbnailUrl: p.featured_image_url || p.thumbnail_url || "",
              visibility:
                p.visibility === "Visible" || p.visibility === "visible"
                  ? "Visible"
                  : "Hidden",
              author: p.author || "Bilal Hussain Abbasi",
              blog: p.blog || "News",
              updatedAt: p.updated_at
                ? new Date(p.updated_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—",
              publishedAt: p.published_at
                ? new Date(p.published_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—",
            }))
            setPosts(mapped)
          }
        }
      } catch (err) {
        setPosts([])
      }
    }

    fetchBlogPostsFromDB()
    return () => {
      isMounted = false
    }
  }, [])

  const refreshBlogPostsFromDB = () => {
    fetch(`${API_BASE}/api/v1/blog-posts/`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped: BlogPostRecord[] = data.map((p: any) => ({
            id: Number(p.id),
            title: p.title,
            thumbnailUrl: p.featured_image_url || p.thumbnail_url || "",
            visibility:
              p.visibility === "Visible" || p.visibility === "visible"
                ? "Visible"
                : "Hidden",
            author: p.author || "Bilal Hussain Abbasi",
            blog: p.blog || "News",
            updatedAt: p.updated_at
              ? new Date(p.updated_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—",
            publishedAt: p.published_at
              ? new Date(p.published_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—",
          }))
          setPosts(mapped)
        }
      })
      .catch(() => {})
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredPosts.map((p) => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  // Manage blogs: open the edit page for the single selected blog.
  const handleManageBlogs = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select a blog post to manage.")
      return
    }
    if (selectedIds.length > 1) {
      toast.error("Please select exactly one blog post to manage.")
      return
    }
    router.push(`/content/blogs/${selectedIds[0]}`)
  }

  const handleDeleteOne = async (post: BlogPostRecord) => {
    if (!confirm(`Delete blog post "${post.title}"? This cannot be undone.`)) return
    setDeletingIds((prev) => [...prev, post.id])
    try {
      const res = await fetch(`${API_BASE}/api/v1/blog-posts/${post.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success(`Blog post "${post.title}" deleted.`)
      } else {
        toast.error(`Could not delete "${post.title}".`)
      }
    } catch {
      toast.error("Could not reach the server.")
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== post.id))
      setSelectedIds((prev) => prev.filter((id) => id !== post.id))
      refreshBlogPostsFromDB()
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    const selectedPosts = posts.filter((p) => selectedIds.includes(p.id))
    if (!confirm(`Delete ${selectedPosts.length} blog post${selectedPosts.length === 1 ? "" : "s"}? This cannot be undone.`)) return

    setDeleting(true)
    let deleted = 0
    let failed = false
    for (const post of selectedPosts) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/blog-posts/${post.id}`, {
          method: "DELETE",
        })
        if (res.ok) deleted++
        else failed = true
      } catch {
        failed = true
      }
    }

    if (failed) {
      toast.error("Some posts could not be deleted from the database.")
    } else if (deleted > 0) {
      toast.success(`Deleted ${deleted} blog post${deleted === 1 ? "" : "s"} from the database.`)
    } else {
      toast.error("Nothing was deleted.")
    }

    setSelectedIds([])
    setDeleting(false)
    refreshBlogPostsFromDB()
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
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <NotePencil className="w-5 h-5 text-gray-700" />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Blog posts</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManageBlogs}
            className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <NotePencil className="w-4 h-4 text-gray-600" />
            <span>Manage blogs</span>
          </button>

          <Link
            href="/content/blogs/new"
            className="px-4 py-2 bg-[#1a1a1a] hover:bg-black text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
          >
            <span>Add blog post</span>
          </Link>
        </div>
      </div>

      {/* Bulk delete action bar when rows are selected */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between gap-3 p-3 bg-white border border-gray-200 rounded-2xl shadow-2xs">
          <span className="text-xs font-bold text-gray-900">
            {selectedIds.length} selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-60"
          >
            {deleting ? (
              <Spinner className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash className="w-3.5 h-3.5" />
            )}
            <span>{deleting ? "Deleting..." : `Delete ${selectedIds.length === 1 ? "blog post" : "blog posts"}`}</span>
          </button>
        </div>
      )}

      {/* Main Blog Posts Table Card */}
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
                <th className="py-3 px-4 font-semibold text-gray-700 w-[14%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post, idx) => {
                  const isSelected = selectedIds.includes(post.id)
                  const isDeleting = deletingIds.includes(post.id)
                  return (
                    <tr
                      key={`blog-${post.id}-${idx}`}
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
                        <button
                          type="button"
                          onClick={() => router.push(`/content/blogs/${post.id}`)}
                          className="flex items-center gap-3 text-left cursor-pointer group"
                          title="Edit blog post"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                            {post.thumbnailUrl ? (
                              <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                                IMG
                              </div>
                            )}
                          </div>
                          <span className="font-bold text-gray-900 text-xs line-clamp-2 group-hover:text-amber-800">
                            {post.title}
                          </span>
                        </button>
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

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => router.push(`/content/blogs/${post.id}`)}
                            className="p-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit blog post"
                          >
                            <PencilSimple className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteOne(post)}
                            disabled={isDeleting}
                            className="p-2 bg-white border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-500 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                            title="Delete blog post"
                          >
                            {isDeleting ? (
                              <Spinner className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-gray-500 font-medium">
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
