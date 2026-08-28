"use client"

import { API_BASE } from "@/lib/api"

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || ""

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import {
  CaretLeft,
  Sparkle,
  Pencil,
  Check,
  Plus,
  MagnifyingGlass,
  CaretDown,
  Trash,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { LexicalEditor } from "@/components/ui/lexical-editor"
import { CharCounter } from "@/components/ui/char-counter"
import { useUnsavedChanges } from "@/components/unsaved-changes"

function parseBlogFaqs(raw: string | null | undefined): { question: string; answer: string }[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((entry) => ({
        question: String((entry as Record<string, unknown>)?.question ?? "").trim(),
        answer: String((entry as Record<string, unknown>)?.answer ?? "").trim(),
      }))
      .filter((f) => f.question || f.answer)
  } catch {
    return []
  }
}

export default function EditBlogPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = Number(params?.id)

  // Form State
  const [title, setTitle] = useState("")
  const [slugInput, setSlugInput] = useState("")
  const [content, setContent] = useState("")
  const [excerpt, setExcerpt] = useState("")

  // FAQs State
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([])

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [seoKeyword, setSeoKeyword] = useState("")
  const [seoCanonicalUrl, setSeoCanonicalUrl] = useState("")
  const [showSeoFields, setShowSeoFields] = useState(false)

  // Right Column Settings
  const [visibility, setVisibility] = useState<"Visible" | "Hidden">("Visible")
  const [customScriptOverride, setCustomScriptOverride] = useState<string>("")
  const [isScriptEdited, setIsScriptEdited] = useState<boolean>(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [author, setAuthor] = useState("Bilal Hussain Abbasi")
  const [selectedBlogCategory, setSelectedBlogCategory] = useState("News")
  const [availableBlogs, setAvailableBlogs] = useState<string[]>(["News", "Style Guide", "Leather Care"])
  const [tags, setTags] = useState("")
  const [themeTemplate, setThemeTemplate] = useState("Default blog post")

  // Popover States
  const [blogDropdownOpen, setBlogDropdownOpen] = useState(false)
  const [blogSearchQuery, setBlogSearchQuery] = useState("")
  const [showNewBlogInput, setShowNewBlogInput] = useState(false)
  const [newBlogCategoryName, setNewBlogCategoryName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const { setUnsavedChanges } = useUnsavedChanges()
  const canonicalTouchedRef = useRef(false)

  const galleryModified = imageUrls.length > 0

  const hasUnsavedChanges =
    title.trim() !== "" ||
    slugInput.trim() !== "" ||
    content.trim() !== "" ||
    excerpt.trim() !== "" ||
    faqs.length > 0 ||
    seoTitle.trim() !== "" ||
    seoDescription.trim() !== "" ||
    seoKeyword.trim() !== "" ||
    seoCanonicalUrl.trim() !== "" ||
    showSeoFields ||
    galleryModified ||
    tags.trim() !== "" ||
    customScriptOverride.trim() !== ""

  useEffect(() => {
    setUnsavedChanges(hasUnsavedChanges)
  }, [setUnsavedChanges, hasUnsavedChanges])

  // Auto-derive the canonical URL from the slug (only when not manually overridden).
  useEffect(() => {
    if (canonicalTouchedRef.current) return
    const slug = slugInput
      ? slugInput.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      : title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    const base = (STORE_URL || "").replace(/\/$/, "")
    setSeoCanonicalUrl(`${base}/blog/${slug || "blog-post"}`)
  }, [slugInput, title])

  // Load the existing blog post from the DB
  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/blog-posts/${postId}`)
        if (!res.ok) {
          throw new Error("post not found")
        }
        const p = await res.json()
        if (!isMounted) return

        setTitle(p.title || "")
        setSlugInput(p.handle || p.title || "")
        setContent(p.body || "")
        setExcerpt(p.excerpt || "")
        setFaqs(parseBlogFaqs(p.faqs))
        setSeoTitle(p.seo_title || "")
        setSeoDescription(p.seo_description || "")
        setSeoKeyword(p.seo_keyword || "")
        setSeoCanonicalUrl(p.seo_canonical_url || "")
        if (p.seo_canonical_url) canonicalTouchedRef.current = true
        setVisibility(p.visibility === "Visible" ? "Visible" : "Hidden")
        setAuthor(p.author || "Bilal Hussain Abbasi")
        setSelectedBlogCategory(p.blog || "News")
        setTags(p.tags || "")
        setThemeTemplate(p.template_suffix || "Default blog post")
        const img = p.featured_image_url || p.thumbnail_url || ""
        if (img) setImageUrls([img])
        setCustomScriptOverride("")
        setIsScriptEdited(false)
      } catch (err) {
        toast.error("Could not load this blog post. It may not exist in the database.")
        router.replace("/content/blogs")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [postId, router])

  // Handle Multi-Image Upload
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newUrls = Array.from(files).map((f) => URL.createObjectURL(f))
      setImageUrls((prev) => [...prev, ...newUrls])
      toast.success(`Attached ${files.length} image(s) to blog post gallery!`)
    }
  }

  // Handle Add New Blog Category
  const handleCreateNewBlogCategory = () => {
    if (!newBlogCategoryName.trim()) {
      toast.error("Please enter a blog category name.")
      return
    }
    const catName = newBlogCategoryName.trim()
    if (!availableBlogs.includes(catName)) {
      setAvailableBlogs([...availableBlogs, catName])
    }
    setSelectedBlogCategory(catName)
    setNewBlogCategoryName("")
    setShowNewBlogInput(false)
    setBlogDropdownOpen(false)
    toast.success(`Created new blog category "${catName}"!`)
  }

  // Update Blog Post in DB (replaces the old one)
  const handleSaveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Please enter a blog title.")
      return
    }

    setSaving(true)

    const slug = slugInput
      ? slugInput.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      : title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

    const payload = {
      title: title.trim(),
      handle: slug,
      body: content.trim(),
      excerpt: excerpt.trim() || null,
      faqs: JSON.stringify(faqs),
      author: author.trim() || "Bilal Hussain Abbasi",
      blog: selectedBlogCategory,
      visibility: visibility,
      featured_image_url: imageUrls[0] || null,
      thumbnail_url: imageUrls[0] || null,
      tags: tags.trim() || null,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      seo_keyword: seoKeyword.trim() || null,
      seo_canonical_url: seoCanonicalUrl.trim() || null,
      template_suffix: themeTemplate,
      published_at: new Date().toISOString(),
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/blog-posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(`Blog post "${title}" updated!`)
        router.push("/content/blogs")
      } else {
        const body = await res.json().catch(() => null)
        toast.error(`Could not update blog post: ${body?.detail || "Server error"}`)
      }
    } catch (err) {
      toast.error("Could not reach the server. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="max-w-5xl mx-auto py-16 text-center text-sm text-gray-500">Loading blog post…</div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 font-sans text-gray-900 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
          <Link href="/content/blogs" className="p-1 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors">
            <CaretLeft className="w-5 h-5" />
          </Link>
          <span className="text-gray-400">›</span>
          <h1 className="text-lg font-bold text-gray-900">Edit blog post</h1>
        </div>

        <button
          type="button"
          onClick={handleSaveBlogPost}
          disabled={saving}
          className="px-5 py-2 bg-[#1a1a1a] hover:bg-black text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <form onSubmit={handleSaveBlogPost} className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
        {/* Left Column (Main Form Fields) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Card 1: Slug + Title */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-2">
            <div className="space-y-1.5">
              <label className="font-bold text-gray-900 text-xs block">Slug / URL Handle</label>
              <div className="flex items-center gap-0">
                {STORE_URL && <span className="h-11 px-3 bg-gray-100 border border-gray-300 border-r-0 rounded-l-xl text-[11px] text-gray-500 font-mono flex items-center shrink-0">{STORE_URL.replace(/\/$/, "")}/blog/</span>}
                <input
                  type="text"
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  placeholder={title ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : "blog-post-slug"}
                  className={`${STORE_URL ? "rounded-r-xl" : "rounded-xl"} flex-1 h-11 px-4 bg-white border border-gray-300 font-mono text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 transition-all placeholder:text-gray-400`}
                />
              </div>
              <p className="text-[10px] text-gray-400">Leave blank to auto-generate from title. Preview: <span className="font-mono text-gray-600">{STORE_URL ? `${STORE_URL.replace(/\/$/, "")}` : "https://yourdomain.com"}/blog/{slugInput ? slugInput.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : title ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : "..."}</span></p>
            </div>

            <label className="font-bold text-gray-900 text-xs block">Title</label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Blog about your latest products or deals"
                className="w-full h-11 pl-3.5 pr-10 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 transition-all placeholder:text-gray-400"
              />
              <div className="absolute right-3 p-1 rounded-md bg-indigo-50 text-indigo-600">
                <Sparkle className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Card 2: Content Rich Text Editor */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-3">
            <label className="font-bold text-gray-900 text-xs block">Content</label>
            <LexicalEditor
              value={content}
              onChange={(htmlContent) => setContent(htmlContent)}
              placeholder="Write your blog post content here..."
              minHeight="260px"
            />
          </div>

          {/* Card 2.5: Excerpt */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-2">
            <label className="font-bold text-gray-900 text-xs block">Post excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              placeholder="Short summary shown in blog preview cards and search results..."
              className="w-full p-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/20 transition-all placeholder:text-gray-400"
            />
            <p className="text-[10px] text-gray-400">Leave blank to auto-generate from the post content.</p>
          </div>

          {/* Card 3: FAQs */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-bold text-gray-900 text-xs block">Frequently Asked Questions</label>
                <span className="text-[10px] text-gray-500 font-medium">{faqs.length} FAQ{faqs.length !== 1 ? "s" : ""} added</span>
              </div>
              <button
                type="button"
                onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
                className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-[11px] rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ</span>
              </button>
            </div>

            {faqs.length === 0 ? (
              <p className="text-gray-400 font-medium text-[11px]">No FAQs added. Click "Add FAQ" to create one.</p>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 relative group">
                    <button
                      type="button"
                      onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-full text-xs font-bold flex items-center justify-center transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Remove FAQ"
                    >
                      ✕
                    </button>
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 block mb-1">Question {idx + 1}</label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => {
                          const next = [...faqs]
                          next[idx] = { ...next[idx], question: e.target.value }
                          setFaqs(next)
                        }}
                        placeholder="e.g., How do I care for my leather product?"
                        className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/20 transition-all placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 block mb-1">Answer</label>
                      <textarea
                        value={faq.answer}
                        onChange={(e) => {
                          const next = [...faqs]
                          next[idx] = { ...next[idx], answer: e.target.value }
                          setFaqs(next)
                        }}
                        rows={2}
                        placeholder="Provide a detailed answer..."
                        className="w-full p-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/20 transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 4: Search Engine Listing */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-900 text-xs block">Search engine listing</label>
              <button
                type="button"
                onClick={() => setShowSeoFields(!showSeoFields)}
                className="p-1 text-gray-500 hover:text-black rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title="Edit search engine listing"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            {showSeoFields ? (
              <div className="space-y-3 pt-1">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[11px] text-emerald-800 font-mono block">{STORE_URL ? `${STORE_URL.replace(/\/$/, "")}` : "https://yourdomain.com"}/blog/{slugInput ? slugInput.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : title ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : "..."}</span>
                  <span className="text-sm font-bold text-blue-700 hover:underline block">{seoTitle || title || "Page title"}</span>
                  <span className="text-xs text-gray-600 block line-clamp-2">{(seoDescription ? seoDescription.replace(/<[^>]+>/g, "").trim() : "") || "Meta description"}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Page Title</label>
                    <CharCounter value={seoTitle} limit={60} />
                  </div>
                  <input
                    type="text"
                    maxLength={60}
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={title || "SEO Page Title"}
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Meta Description</label>
                    <CharCounter value={seoDescription} limit={160} />
                  </div>
                  <LexicalEditor
                    value={seoDescription}
                    onChange={setSeoDescription}
                    placeholder="Meta description for Google search engines..."
                    minHeight="80px"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Focus keyword</label>
                  <input
                    type="text"
                    value={seoKeyword}
                    onChange={(e) => setSeoKeyword(e.target.value)}
                    placeholder="e.g. leather wallet care"
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">A key phrase you want this post to rank for. Separate multiple keywords with commas.</p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Canonical URL</label>
                  <input
                    type="text"
                    value={seoCanonicalUrl}
                    onChange={(e) => {
                      canonicalTouchedRef.current = true
                      setSeoCanonicalUrl(e.target.value)
                    }}
                    placeholder="https://yourdomain.com/blog/..."
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-mono text-xs font-medium text-gray-900 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Auto-generated from the slug. Override only if this post lives at a custom canonical URL.</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 font-medium">Add a title and description to see how this blog post might appear in a search engine listing</p>
            )}
          </div>
        </div>

        {/* Right Column Settings */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Visibility */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-3">
            <h2 className="font-bold text-gray-900 text-xs">Visibility</h2>
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === "Visible"}
                  onChange={() => setVisibility("Visible")}
                  className="w-4 h-4 text-amber-800 focus:ring-amber-800 cursor-pointer"
                />
                <span className="font-bold text-gray-800 text-xs">Visible</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === "Hidden"}
                  onChange={() => setVisibility("Hidden")}
                  className="w-4 h-4 text-amber-800 focus:ring-amber-800 cursor-pointer"
                />
                <span className="font-bold text-gray-800 text-xs">Hidden</span>
              </label>
            </div>
          </div>

          {/* Card 2: Multi-Image Gallery */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-xs">Featured Gallery Images ({imageUrls.length})</h2>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
              >
                + Add Image
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />

            {imageUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="h-28 rounded-xl overflow-hidden border border-gray-300 relative group">
                    <img src={url} alt={`Blog post picture ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 text-white rounded-full text-xs font-bold hover:bg-black transition-colors flex items-center justify-center cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-amber-800 rounded-2xl p-6 text-center space-y-2 cursor-pointer transition-colors bg-gray-50/50 hover:bg-amber-50/30"
              >
                <button
                  type="button"
                  className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs"
                >
                  Add pictures
                </button>
                <p className="text-gray-400 text-[11px]">Upload 2, 3, or more pictures for this post</p>
              </div>
            )}
          </div>

          {/* Card 3: Organization */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-4">
            <h2 className="font-bold text-gray-900 text-xs">Organization</h2>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 block">Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
              />
            </div>

            <div className="space-y-1.5 relative">
              <label className="text-[11px] font-bold text-gray-700 block">Blog</label>
              <button
                type="button"
                onClick={() => setBlogDropdownOpen(!blogDropdownOpen)}
                className="w-full h-10 px-3.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl font-bold text-gray-900 text-xs flex items-center justify-between shadow-2xs cursor-pointer"
              >
                <span>{selectedBlogCategory}</span>
                <CaretDown className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {blogDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 p-2 space-y-2 animate-scale-in">
                  <div className="relative">
                    <MagnifyingGlass className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={blogSearchQuery}
                      onChange={(e) => setBlogSearchQuery(e.target.value)}
                      placeholder="Blog"
                      className="w-full h-8 pl-8 pr-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block px-2">Blogs</span>
                    {availableBlogs
                      .filter((b) => !blogSearchQuery.trim() || b.toLowerCase().includes(blogSearchQuery.toLowerCase()))
                      .map((bName) => (
                        <button
                          key={bName}
                          type="button"
                          onClick={() => {
                            setSelectedBlogCategory(bName)
                            setBlogDropdownOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                            selectedBlogCategory === bName ? "bg-gray-100 text-gray-900 font-extrabold" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <span>{bName}</span>
                          {selectedBlogCategory === bName && <Check className="w-4 h-4 text-gray-800" />}
                        </button>
                      ))}
                  </div>

                  <div className="border-t border-gray-100 pt-1 space-y-1">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block px-2">Actions</span>
                    {showNewBlogInput ? (
                      <div className="p-2 space-y-2 bg-gray-50 rounded-xl border border-gray-200">
                        <input
                          type="text"
                          value={newBlogCategoryName}
                          onChange={(e) => setNewBlogCategoryName(e.target.value)}
                          placeholder="Category name..."
                          className="w-full h-8 px-2.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={handleCreateNewBlogCategory}
                          className="w-full py-1 bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs rounded-lg shadow-2xs cursor-pointer"
                        >
                          Create
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowNewBlogInput(true)}
                        className="w-full text-left px-3 py-2 text-gray-800 hover:bg-gray-50 rounded-xl font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-gray-600" />
                        <span>Create a new blog</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 block">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. Leather, Fashion, Care"
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
              />
            </div>
          </div>

          {/* Card 4: Theme Template */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-2">
            <h2 className="font-bold text-gray-900 text-xs">Theme template</h2>
            <select
              value={themeTemplate}
              onChange={(e) => setThemeTemplate(e.target.value)}
              className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
            >
              <option value="Default blog post">Default blog post</option>
              <option value="blog-post">blog-post</option>
            </select>
          </div>

          {/* Delete Blog Post */}
          <div className="bg-white rounded-2xl border border-red-200 shadow-2xs p-5 space-y-3">
            <h2 className="font-bold text-red-700 text-xs">Danger zone</h2>
            <p className="text-[11px] text-gray-500 font-medium">Permanently delete this blog post and all its data from the database.</p>
            <button
              type="button"
              onClick={async () => {
                if (!confirm(`Delete blog post "${title}"? This cannot be undone.`)) return
                try {
                  const res = await fetch(`${API_BASE}/api/v1/blog-posts/${postId}`, {
                    method: "DELETE",
                  })
                  if (res.ok) {
                    toast.success(`Blog post "${title}" deleted.`)
                    router.push("/content/blogs")
                  } else {
                    toast.error("Could not delete the blog post.")
                  }
                } catch (err) {
                  toast.error("Could not reach the server.")
                }
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Trash className="w-3.5 h-3.5" />
              <span>Delete blog post</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
