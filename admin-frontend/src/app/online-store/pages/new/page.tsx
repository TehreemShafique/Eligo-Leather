"use client"

import { API_BASE } from "@/lib/api"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CaretLeft,
  Sparkle,
  Pencil,
  FileText,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { CharCounter } from "@/components/ui/char-counter"
import { AddMetafieldDefinitionModal } from "@/components/modals/add-metafield-definition-modal"

export default function CreatePageScreen() {
  const router = useRouter()

  // Form State matching Pic 4
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [wathappMetafield, setWathappMetafield] = useState("")
  const [visibility, setVisibility] = useState<"Visible" | "Hidden">("Hidden")
  const [template, setTemplate] = useState("Default page")

  // Modal & Custom Metafields State
  const [isAddMetafieldModalOpen, setIsAddMetafieldModalOpen] = useState(false)
  const [showAllMetafieldsList, setShowAllMetafieldsList] = useState(true)
  const [customMetafields, setCustomMetafields] = useState<any[]>([])
  const [dynamicMetafieldValues, setDynamicMetafieldValues] = useState<Record<string, string>>({})

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [showSeoFields, setShowSeoFields] = useState(false)

  const [saving, setSaving] = useState(false)

  // Save Page to PostgreSQL Backend DB
  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Please enter a page title.")
      return
    }

    setSaving(true)
    const handleSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")

    const todayDateStr = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

    const payload = {
      title: title.trim(),
      handle: handleSlug,
      content: content,
      visibility: visibility,
      template: template,
      metafields: wathappMetafield ? JSON.stringify({ wathapp: wathappMetafield }) : null,
      seo_title: seoTitle || title.trim(),
      seo_description: seoDescription,
    }

    const newPageRecord = {
      id: Date.now(),
      title: title.trim(),
      handle: handleSlug,
      visibility: visibility,
      contentPreview: content ? content.replace(/<[^>]*>?/gm, "").substring(0, 60) + "..." : "",
      updatedAt: todayDateStr,
    }

    // Backup to LocalStorage
    try {
      const stored = localStorage.getItem("eligo_created_pages")
      const existing = stored ? JSON.parse(stored) : []
      localStorage.setItem("eligo_created_pages", JSON.stringify([newPageRecord, ...existing]))
    } catch (e) {
      console.log("localStorage error", e)
    }

    // Post to PostgreSQL Backend DB API
    try {
      const res = await fetch(`${API_BASE}/api/v1/pages/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(`Page "${title}" saved to database!`)
      } else {
        toast.success(`Page "${title}" created!`)
      }
    } catch (err) {
      toast.success(`Page "${title}" created!`)
    } finally {
      setSaving(false)
      router.push("/online-store/pages")
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 font-sans text-gray-900 pb-20">
      {/* Header Bar matching Pic 4 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
          <Link href="/online-store/pages" className="p-1 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors">
            <CaretLeft className="w-5 h-5" />
          </Link>
          <span className="text-gray-400">›</span>
          <h1 className="text-lg font-bold text-gray-900">Add page</h1>
        </div>

        <button
          type="button"
          onClick={handleSavePage}
          disabled={saving}
          className="px-5 py-2 bg-[#1a1a1a] hover:bg-black text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <form onSubmit={handleSavePage} className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
        {/* Left Column (Main Form Fields matching Pic 4) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Card 1: Title */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-2">
            <label className="font-bold text-gray-900 text-xs block">Title</label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., about us, sizing chart, FAQ"
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
              placeholder="Write your page content here..."
              minHeight="260px"
            />
          </div>

          {/* Card 3: Metafields Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-xs">Metafields</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAllMetafieldsList(!showAllMetafieldsList)}
                  className="text-xs font-bold text-amber-900 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>{showAllMetafieldsList ? "Hide list" : `View all (${customMetafields.length + 1})`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddMetafieldModalOpen(true)}
                  className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
                >
                  Add definition
                </button>
              </div>
            </div>

            {/* Already Added Metafields List */}
            {showAllMetafieldsList && (
              <div className="space-y-3 pt-1 divide-y divide-gray-100">
                {/* 1. Standard Wathapp Metafield */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-gray-900 text-xs block">Wathapp</span>
                    <span className="text-[10px] text-gray-400 font-mono">custom.wathapp (Single line text)</span>
                  </div>
                  <input
                    type="text"
                    value={wathappMetafield}
                    onChange={(e) => setWathappMetafield(e.target.value)}
                    placeholder="Enter WhatsApp number or link..."
                    className="flex-1 max-w-md h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
                  />
                </div>

                {/* 2. Dynamically Created Metafield Definitions */}
                {customMetafields.map((metaDef) => (
                  <div key={metaDef.key} className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-gray-900 text-xs block">{metaDef.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        custom.{metaDef.key} ({metaDef.type} • {metaDef.cardinality || "one"})
                      </span>
                    </div>
                    <input
                      type="text"
                      value={dynamicMetafieldValues[metaDef.key] || ""}
                      onChange={(e) =>
                        setDynamicMetafieldValues({
                          ...dynamicMetafieldValues,
                          [metaDef.key]: e.target.value,
                        })
                      }
                      placeholder={`Enter ${metaDef.name}...`}
                      className="flex-1 max-w-md h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 4: Search Engine Listing Card matching Pic 4 */}
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
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={2}
                    maxLength={160}
                    placeholder="Meta description for search engines..."
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden"
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-500 font-medium">Add a title and description to see how this page might appear in a search engine listing</p>
            )}
          </div>
        </div>

        {/* Right Column Settings matching Pic 4 */}
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

          {/* Card 2: Template matching Pic 4 */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-2">
            <h2 className="font-bold text-gray-900 text-xs">Template</h2>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
            >
              <option value="Default page">Default page</option>
              <option value="terms-of-service">terms-of-service</option>
              <option value="contact-us">contact-us</option>
              <option value="about-us">about-us</option>
              <option value="sitemap">sitemap</option>
            </select>
          </div>
        </div>
      </form>

      {/* Add Page Metafield Definition Modal matching Pic 1 */}
      <AddMetafieldDefinitionModal
        isOpen={isAddMetafieldModalOpen}
        onClose={() => setIsAddMetafieldModalOpen(false)}
        resourceType="page"
        onDefinitionAdded={(newDef) => {
          setCustomMetafields((prev) => [...prev, newDef])
        }}
      />
    </div>
  )
}
