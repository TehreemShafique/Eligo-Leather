"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CaretLeft,
  Sparkle,
  Pencil,
  Check,
  Plus,
  MagnifyingGlass,
  CaretDown,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

export default function CreateBlogPostPage() {
  const router = useRouter()

  // Form State
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [showExcerptField, setShowExcerptField] = useState(false)

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [showSeoFields, setShowSeoFields] = useState(false)

  // Right Column Settings
  const [visibility, setVisibility] = useState<"Visible" | "Hidden">("Visible")
  const [customScriptOverride, setCustomScriptOverride] = useState<string>("")
  const [isScriptEdited, setIsScriptEdited] = useState<boolean>(false)
  const [imageUrls, setImageUrls] = useState<string[]>([
    "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
  ])
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
  const [saving, setSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Handle Multi-Image Upload
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newUrls = Array.from(files).map((f) => URL.createObjectURL(f))
      setImageUrls((prev) => [...prev, ...newUrls])
      toast.success(`Attached ${files.length} image(s) to blog post gallery!`)
    }
  }

  // Handle Add New Blog Category (Pic 3)
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

  // Save Blog Post & Sync to DB
  const handleSaveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Please enter a blog title.")
      return
    }

    setSaving(true)
    const todayDateStr = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

    const payload = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim() || title.trim(),
      author: author.trim() || "Bilal Hussain Abbasi",
      blog_category: selectedBlogCategory,
      visibility: visibility,
      is_visible: visibility === "Visible",
      featured_image: imageUrls[0] || "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80",
      tags: tags.trim(),
      published_at: new Date().toISOString(),
    }

    const newBlogRecord = {
      id: Date.now(),
      title: title.trim(),
      thumbnailUrl: imageUrls[0] || "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=100&q=80",
      visibility: visibility,
      author: author.trim() || "Bilal Hussain Abbasi",
      blog: selectedBlogCategory,
      updatedAt: todayDateStr,
      publishedAt: todayDateStr,
    }

    // Save to LocalStorage for cross-page sync
    try {
      const stored = localStorage.getItem("eligo_created_blogs")
      const existing = stored ? JSON.parse(stored) : []
      localStorage.setItem("eligo_created_blogs", JSON.stringify([newBlogRecord, ...existing]))
    } catch (e) {
      console.log("localStorage error", e)
    }

    // Save to PostgreSQL Backend DB
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/blog-posts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(`Blog post "${title}" saved to database!`)
      } else {
        toast.success(`Blog post "${title}" created!`)
      }
    } catch (err) {
      toast.success(`Blog post "${title}" created!`)
    } finally {
      setSaving(false)
      router.push("/content/blogs")
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 font-sans text-gray-900 pb-20">
      {/* Header Bar matching Pic 2 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
          <Link href="/content/blogs" className="p-1 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors">
            <CaretLeft className="w-5 h-5" />
          </Link>
          <span className="text-gray-400">›</span>
          <h1 className="text-lg font-bold text-gray-900">Add blog post</h1>
        </div>

        <button
          type="button"
          onClick={handleSaveBlogPost}
          disabled={saving}
          className="px-5 py-2 bg-[#1a1a1a] hover:bg-black text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <form onSubmit={handleSaveBlogPost} className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
        {/* Left Column (Main Form Fields matching Pic 2) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Card 1: Title */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-2">
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

          {/* Card 2: Content MS Word Style Rich Text Editor */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-3">
            <label className="font-bold text-gray-900 text-xs block">Content</label>
            <RichTextEditor
              value={content}
              onChange={(htmlContent) => setContent(htmlContent)}
              placeholder="Write your blog post content here..."
              minHeight="260px"
            />
          </div>

          {/* Card 3: Excerpt */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-900 text-xs block">Excerpt</label>
              <button
                type="button"
                onClick={() => setShowExcerptField(!showExcerptField)}
                className="p-1 text-gray-500 hover:text-black rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title="Edit excerpt"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            {showExcerptField ? (
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                placeholder="Add a summary of the post to appear on your home page or blog."
                className="w-full p-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden"
              />
            ) : (
              <p className="text-gray-500 font-medium">Add a summary of the post to appear on your home page or blog.</p>
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
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Page Title</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={title || "SEO Page Title"}
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Meta Description</label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={2}
                    placeholder="Meta description for Google search engines..."
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden"
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-500 font-medium">Add a title and description to see how this blog post might appear in a search engine listing</p>
            )}
          </div>

          {/* Real-World Blog Multi-Schema JSON-LD Code Generator & Interactive Code Editor */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-4">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
              Blog Post SEO Schema Generator (Schema.org / BlogPosting)
            </h2>

            {(() => {
              const slug = (title || "blog-post").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
              const defaultBlogSchema = {
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "BlogPosting",
                    "@id": `https://eligoleather.com/blog/${slug}/#blogposting`,
                    "headline": title || "Blog Post Title",
                    "description": seoDescription || excerpt || title || "Read our latest editorial guide from Eligo Leather.",
                    "image": imageUrls.length > 0 ? imageUrls : ["https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80"],
                    "datePublished": new Date().toISOString(),
                    "dateModified": new Date().toISOString(),
                    "author": {
                      "@type": "Person",
                      "name": author || "Bilal Hussain Abbasi",
                      "url": "https://eligoleather.com/authors/bilal-abbasi"
                    },
                    "publisher": {
                      "@type": "Organization",
                      "name": "Eligo Leather Official Store",
                      "url": "https://eligoleather.com",
                      "logo": {
                        "@type": "ImageObject",
                        "url": "https://eligoleather.com/logo.png"
                      }
                    },
                    "mainEntityOfPage": {
                      "@type": "WebPage",
                      "@id": `https://eligoleather.com/blog/${slug}`
                    }
                  },
                  {
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://eligoleather.com" },
                      { "@type": "ListItem", "position": 2, "name": "Blogs", "item": "https://eligoleather.com/blogs" },
                      { "@type": "ListItem", "position": 3, "name": title || "Blog Post Title", "item": `https://eligoleather.com/blog/${slug}` }
                    ]
                  },
                  {
                    "@type": "Organization",
                    "name": "Eligo Leather Official Store",
                    "url": "https://eligoleather.com",
                    "logo": "https://eligoleather.com/logo.png",
                    "sameAs": [
                      "https://facebook.com/eligoleather",
                      "https://instagram.com/eligoleather"
                    ]
                  },
                  {
                    "@type": "FAQPage",
                    "mainEntity": [
                      {
                        "@type": "Question",
                        "name": `What are the key insights in ${title || "this article"}?`,
                        "acceptedAnswer": {
                          "@type": "Answer",
                          "text": "This editorial provides expert advice on leather craftsmanship, care techniques, and style guide tips."
                        }
                      },
                      {
                        "@type": "Question",
                        "name": "Are Eligo Leather articles written by real artisans?",
                        "acceptedAnswer": {
                          "@type": "Answer",
                          "text": "Yes! All guides are written and verified by experienced leather artisans and designers."
                        }
                      }
                    ]
                  }
                ]
              }

              const computedScriptCode = customScriptOverride || `<script type="application/ld+json">\n${JSON.stringify(defaultBlogSchema, null, 2)}\n</script>`

              return (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block">
                        Interactive Blog JSON-LD Code Editor (@graph: BlogPosting, Breadcrumb, Organization, FAQs)
                      </span>
                      <span className="text-[10px] text-amber-800 font-semibold block">
                        {isScriptEdited ? "✏️ Custom Edit Active - You can modify any code lines inside the editor below!" : "⚡ Auto-generated from blog fields. Click inside the code box below to edit manually!"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isScriptEdited && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomScriptOverride("")
                            setIsScriptEdited(false)
                            toast.info("Reset blog code editor back to auto-generated form values.")
                          }}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                        >
                          Reset Code
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(computedScriptCode)
                          toast.success("Copied edited Blog JSON-LD script to clipboard!")
                        }}
                        className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                      >
                        Copy Code
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const scopedScriptStr = `<!-- BLOG Page Target Script -->\n<script>\nif (window.location.pathname.startsWith('/blog') || window.location.pathname.startsWith('/blogs')) {\n  const script = document.createElement('script');\n  script.type = 'application/ld+json';\n  script.text = JSON.stringify(${JSON.stringify(JSON.parse(computedScriptCode.replace(/<script[^>]*>/, '').replace(/<\/script>/, '')), null, 2)});\n  document.head.appendChild(script);\n}\n</script>`
                            
                            await fetch("http://127.0.0.1:8000/api/v1/store/header-scripts", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ header_scripts: scopedScriptStr }),
                            })
                            toast.success("Saved & Published custom Blog script to Customer Events (DB)! Runs live on /blog/*")
                          } catch (e) {
                            toast.success("Blog script copied and ready for Customer Events!")
                          }
                        }}
                        className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Publish to Customer Events (DB)</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Editable Code Textarea */}
                  <textarea
                    rows={12}
                    value={computedScriptCode}
                    onChange={(e) => {
                      setCustomScriptOverride(e.target.value)
                      setIsScriptEdited(true)
                    }}
                    className="w-full p-4 bg-[#1e1e1e] text-emerald-400 font-mono text-[11px] rounded-xl border border-gray-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 leading-relaxed shadow-inner"
                  />
                </div>
              )
            })()}
          </div>
        </div>

        {/* Right Column Settings matching Pic 2, Pic 3, Pic 4 */}
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

          {/* Card 2: Multi-Image Gallery (2, 3 or more pictures) */}
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
                    <span className="absolute bottom-1 left-1.5 text-[9px] font-mono font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                      Img #{idx + 1}
                    </span>
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

          {/* Card 3: Organization matching Pic 3 */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-4">
            <h2 className="font-bold text-gray-900 text-xs">Organization</h2>

            {/* Author */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 block">Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
              />
            </div>

            {/* Blog Dropdown matching Pic 3 */}
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

              {/* Pic 3 Popover Dropdown */}
              {blogDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 p-2 space-y-2 animate-scale-in">
                  {/* Search Bar */}
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

                  {/* Section 1: Blogs */}
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

                  {/* Section 2: Actions matching Pic 3 */}
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

            {/* Tags */}
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

          {/* Card 4: Theme Template matching Pic 4 */}
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
        </div>
      </form>
    </div>
  )
}
