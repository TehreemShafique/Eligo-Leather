"use client"

import { API_BASE } from "@/lib/api"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
} from "@phosphor-icons/react"
import { toast } from "sonner"

const COLLECTION_TYPES = [
  { value: "wallets", label: "Wallets" },
  { value: "belts", label: "Belts" },
  { value: "cases", label: "Cases" },
  { value: "keychains", label: "Keychains" },
] as const

export default function AdminNewCollectionPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [collectionType, setCollectionType] = useState<string>("wallets")
  const [pageTitle, setPageTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [saving, setSaving] = useState(false)

  const [customScriptOverride, setCustomScriptOverride] = useState<string>("")
  const [isScriptEdited, setIsScriptEdited] = useState<boolean>(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

    const payload = {
      title,
      description,
      collection_type: collectionType,
      seo_title: pageTitle,
      seo_description: metaDescription,
      meta_description: metaDescription,
      url_handle: slug,
      conditions: "Manual category collection",
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/catalog/collections/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(`Category "${title}" created in ${collectionType} collection!`)
        setTimeout(() => {
          router.push("/products/collections")
        }, 400)
      } else {
        const errData = await res.json().catch(() => null)
        toast.error(`Save Error: ${errData?.detail || "Failed to create category"}`)
      }
    } catch (err) {
      console.error("Save category error:", err)
      toast.error("Could not connect to backend.")
    } finally {
      setSaving(false)
    }
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/products/collections"
            className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Category</h1>
            <p className="text-xs text-gray-500 mt-1">Configure category parameters and SEO metafields.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products/collections"
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors border border-gray-300"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            <span>{saving ? "Saving..." : "Save Category"}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Category Details */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Category Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Leather Clutch Wallets"
                className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 text-sm font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Category Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-xs text-gray-900 font-medium"
              />
            </div>
          </div>

          {/* SEO & Metafields */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
              Category SEO &amp; Metafields
            </h2>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1 text-xs">
              <span className="text-[11px] text-emerald-800 font-mono block">https://eligoleather.com/collections/{slug}</span>
              <span className="text-sm font-bold text-blue-700 block">{pageTitle || "Page title"}</span>
              <span className="text-xs text-gray-600 block">{metaDescription || "Meta description"}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">SEO Title Tag</label>
                <input
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="e.g. Leather Clutch Wallets | Eligo Leather"
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Meta Description</label>
                <textarea
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-xs text-gray-900 font-medium"
                />
              </div>
            </div>

            {/* JSON-LD Code Editor */}
            <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
              {(() => {
                const defaultSchema = {
                  "@context": "https://schema.org",
                  "@graph": [
                    {
                      "@type": "CollectionPage",
                      "@id": `https://eligoleather.com/categories/${slug || "category"}/#collectionpage`,
                      "name": title || "Category Title",
                      "url": `https://eligoleather.com/categories/${slug || "category"}`,
                      "description": metaDescription || description || "Explore top-grain handcrafted leather items.",
                    },
                    {
                      "@type": "BreadcrumbList",
                      "itemListElement": [
                        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://eligoleather.com" },
                        { "@type": "ListItem", "position": 2, "name": "Categories", "item": "https://eligoleather.com/categories" },
                        { "@type": "ListItem", "position": 3, "name": title || "Category Title", "item": `https://eligoleather.com/categories/${slug || "category"}` },
                      ],
                    },
                  ],
                }

                const computedScriptCode = customScriptOverride || `<script type="application/ld+json">\n${JSON.stringify(defaultSchema, null, 2)}\n</script>`

                return (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block">
                          JSON-LD Schema Editor
                        </span>
                        <span className="text-[10px] text-amber-800 font-semibold block">
                          {isScriptEdited ? "Custom Edit Active" : "Auto-generated from fields. Click to edit."}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isScriptEdited && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomScriptOverride("")
                              setIsScriptEdited(false)
                              toast.info("Reset code editor to auto-generated values.")
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
                            toast.success("Copied JSON-LD script to clipboard!")
                          }}
                          className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                        >
                          Copy Code
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={10}
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
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6 text-xs">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <h2 className="font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Collection</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                Select Collection
              </label>
              <select
                value={collectionType}
                onChange={(e) => setCollectionType(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
              >
                {COLLECTION_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>
                    {ct.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 mt-1.5">
                Categories created here will appear under the <strong>{COLLECTION_TYPES.find(c => c.value === collectionType)?.label}</strong> collection.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
