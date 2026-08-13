"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  TextB,
  TextItalic,
  TextUnderline,
  ListBullets,
  ListNumbers,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Globe,
  Eye,
  CheckCircle,
  PencilSimple,
} from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminNewBlogPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState("Timeless Black Leather Accessories for Everyday Style")
  const [content, setContent] = useState(
    "Upgrade your daily essentials with a refined collection of black leather accessories designed for style, durability, and convenience. From a premium wallet and classic belt to a keychain, storage pouch, and cable organizer, each piece adds a polished look while keeping everyday items organized. The black leather finish with brass details creates a bold, elegant appearance suitable for both personal use and gifting."
  )
  const [excerpt, setExcerpt] = useState("Discover why handmade black leather accessories remain the ultimate choice for everyday carry.")
  const [visibility, setVisibility] = useState<"Visible" | "Hidden">("Visible")
  const [author, setAuthor] = useState("Bilal Hussain Abbasi")
  const [blogCategory, setBlogCategory] = useState("Style & Care")
  const [tags, setTags] = useState("Leather, Accessories, Wallets, Belts")
  const [saving, setSaving] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      toast.success("Blog post saved and published to storefront!")
      setSaving(false)
      router.push("/content/blogs")
    }, 500)
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/content/blogs"
            className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Blog Post</h1>
            <p className="text-xs text-gray-500 mt-1">Shopify Blog Article & SEO Content Editor</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/content/blogs"
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors border border-gray-300"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {saving ? "Saving..." : "Save Post"}
          </button>
        </div>
      </div>

      {/* Main Form Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Title Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Timeless Black Leather Accessories"
                className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-300 text-base font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
              />
            </div>

            {/* Rich Text Editor Toolbar & Content Box */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Content</label>
              <div className="border border-gray-300 rounded-xl overflow-hidden bg-white">
                {/* Rich Text Toolbar */}
                <div className="p-2 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-1 text-gray-700">
                  <select className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-semibold">
                    <option>Paragraph</option>
                    <option>Heading 1</option>
                    <option>Heading 2</option>
                    <option>Heading 3</option>
                  </select>
                  <div className="w-px h-5 bg-gray-300 mx-1" />
                  <button type="button" className="p-1.5 hover:bg-gray-200 rounded"><TextB className="w-4 h-4 font-bold" /></button>
                  <button type="button" className="p-1.5 hover:bg-gray-200 rounded"><TextItalic className="w-4 h-4" /></button>
                  <button type="button" className="p-1.5 hover:bg-gray-200 rounded"><TextUnderline className="w-4 h-4" /></button>
                  <div className="w-px h-5 bg-gray-300 mx-1" />
                  <button type="button" className="p-1.5 hover:bg-gray-200 rounded"><ListBullets className="w-4 h-4" /></button>
                  <button type="button" className="p-1.5 hover:bg-gray-200 rounded"><ListNumbers className="w-4 h-4" /></button>
                  <div className="w-px h-5 bg-gray-300 mx-1" />
                  <button type="button" className="p-1.5 hover:bg-gray-200 rounded"><LinkIcon className="w-4 h-4" /></button>
                  <button type="button" className="p-1.5 hover:bg-gray-200 rounded"><ImageIcon className="w-4 h-4" /></button>
                  <button type="button" className="p-1.5 hover:bg-gray-200 rounded"><Code className="w-4 h-4" /></button>
                </div>

                <textarea
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-4 text-xs text-gray-900 focus:outline-hidden leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Excerpt Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Excerpt</label>
            <p className="text-[11px] text-gray-500 mb-1">Add a summary excerpt to display on homepage blog feeds and category archives.</p>
            <textarea
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-xs text-gray-900"
            />
          </div>

          {/* Search Engine Listing Preview (SEO Snippet) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-800" />
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Search Engine Listing Preview</h2>
              </div>
              <button type="button" className="text-xs font-bold text-amber-800 hover:underline">Edit SEO</button>
            </div>

            {/* Google Snippet Mock */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1 font-sans">
              <div className="text-xs text-emerald-800 font-medium truncate">
                https://eligoleather.com &gt; blog &gt; {slug}
              </div>
              <div className="text-base font-semibold text-blue-800 hover:underline cursor-pointer leading-snug">
                {title} - Eligo Leather
              </div>
              <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {excerpt}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Visibility Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
              Visibility
            </h2>

            <div className="space-y-2 text-xs">
              <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer ${visibility === "Visible" ? "border-amber-800 bg-amber-50" : "border-gray-200"}`}>
                <input type="radio" name="visibility" checked={visibility === "Visible"} onChange={() => setVisibility("Visible")} />
                <span className="font-bold text-gray-900">Visible</span>
              </label>

              <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer ${visibility === "Hidden" ? "border-amber-800 bg-amber-50" : "border-gray-200"}`}>
                <input type="radio" name="visibility" checked={visibility === "Hidden"} onChange={() => setVisibility("Hidden")} />
                <span className="font-semibold text-gray-700">Hidden</span>
              </label>
            </div>
          </div>

          {/* Featured Image Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Featured Image</h2>
              <button type="button" className="text-[11px] font-bold text-amber-800 hover:underline">Edit</button>
            </div>

            <div className="relative w-full h-44 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <Image
                src="https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600"
                alt="Featured Image"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          </div>

          {/* Organization Sidebar */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
              Organization
            </h2>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Blog Category</label>
              <select
                value={blogCategory}
                onChange={(e) => setBlogCategory(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 font-semibold"
              >
                <option value="Style & Care">Style & Care</option>
                <option value="Leather Maintenance">Leather Maintenance</option>
                <option value="Buying Guides">Buying Guides</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
