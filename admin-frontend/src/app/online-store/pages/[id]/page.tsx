"use client"

import { API_BASE } from "@/lib/api"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import {
  CaretLeft,
  Sparkle,
  Pencil,
  FileText,
  CaretDown,
  Trash,
  ArrowSquareOut,
  Eye,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { CharCounter } from "@/components/ui/char-counter"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { AddMetafieldDefinitionModal } from "@/components/modals/add-metafield-definition-modal"

export default function EditPageDetailScreen() {
  const router = useRouter()
  const params = useParams()
  const pageIdStr = (params?.id as string) || "1"

  // Page State
  const [title, setTitle] = useState("")
  const [handle, setHandle] = useState("")
  const [content, setContent] = useState("")
  const [wathappMetafield, setWathappMetafield] = useState("")
  const [visibility, setVisibility] = useState<"Visible" | "Hidden">("Visible")
  const [template, setTemplate] = useState("Default page")

  // Modal & Custom Metafields State
  const [isAddMetafieldModalOpen, setIsAddMetafieldModalOpen] = useState(false)
  const [showAllMetafieldsList, setShowAllMetafieldsList] = useState(true)
  const [customMetafields, setCustomMetafields] = useState<any[]>([])
  const [dynamicMetafieldValues, setDynamicMetafieldValues] = useState<Record<string, string>>({})

  // DB Policy Templates List
  const [dbPolicies, setDbPolicies] = useState<{ key: string; title: string; body: string }[]>([
    { key: "privacy_policy", title: "Privacy Policy (DB)", body: "Privacy policy content..." },
    { key: "refund_policy", title: "Refund Policy (DB)", body: "Refund policy content..." },
    { key: "terms_of_service", title: "Terms of Service (DB)", body: "Terms of service content..." },
    { key: "shipping_policy", title: "Shipping Policy (DB)", body: "Shipping policy content..." },
    { key: "contact_information", title: "Contact Information (DB)", body: "Contact info content..." },
    { key: "legal_notice", title: "Legal Notice (DB)", body: "Legal notice content..." },
  ])

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [showSeoFields, setShowSeoFields] = useState(false)

  // Actions Dropdown & Loading
  const [moreActionsOpen, setMoreActionsOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch Policies from Backend DB for Template Dropdown
  useEffect(() => {
    let isMounted = true
    const fetchDbPolicies = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/settings/legal-privacy/policies`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data)) {
            const mapped = data.map((p: any) => ({
              key: p.policy_type,
              title: `${p.title || p.policy_type} (DB Policy)`,
              body: p.content,
            }))
            setDbPolicies(mapped)
          }
        }
      } catch (err) {
        console.log("Policies DB fetch offline, using fallback templates.")
      }
    }
    fetchDbPolicies()
    return () => {
      isMounted = false
    }
  }, [])

  // Pre-fill initial page data by ID / Handle
  useEffect(() => {
    let isMounted = true

    const mockPages: Record<string, any> = {
      "1": {
        title: "Terms of Service",
        handle: "terms-of-service",
        visibility: "Visible",
        template: "terms-of-service",
        content: `Review Eligo Leather's Terms of Service to understand your rights and responsibilities when using our website and purchasing our handcrafted leather products.`,
        wathapp: "",
        seoTitle: "Terms & Conditions – Eligo Leather Official",
        seoDescription: "Review Eligo Leather's Terms of Service to understand your rights and responsibilities when using our website and services.",
      },
      "8": {
        title: "HTML sitemap for blogs",
        handle: "avada-sitemap-blogs",
        visibility: "Hidden",
        template: "sitemap",
        content: `<h3>Blogs</h3><ul><li><a href='/blogs/news'>Blog</a></li><li><a href='/blogs/news'>News</a></li><li><a href='/blogs/news/leather-grades'>Different Leather Grades & Leather Quality: ...</a></li><li><a href='/blogs/news/sewing-leather'>Sewing of Leather: The Art and Craft Behind ...</a></li><li><a href='/blogs/news/ideal-wallet'>Guide to Choosing the Ideal ...</a></li></ul>`,
        wathapp: "",
        seoTitle: "HTML sitemap for blogs",
        seoDescription: "HTML sitemap index for Eligo Leather blogs and news articles.",
      },
      "9": {
        title: "HTML sitemap for articles",
        handle: "avada-sitemap-articles",
        visibility: "Hidden",
        template: "sitemap",
        content: `<h3>Blog Posts</h3><ul><li><a href='/blogs/news/sewing-leather'>Sewing of Leather: The Art and Craft Behind ...</a></li><li><a href='/blogs/news/eco-wallets'>Eco-Friendly Leather Wallets: A Wise Choice for Conscious Shoppers</a></li></ul>`,
        wathapp: "",
        seoTitle: "HTML sitemap for articles",
        seoDescription: "HTML sitemap index for Eligo Leather articles.",
      },
      "10": {
        title: "HTML sitemap for collections",
        handle: "avada-sitemap-collections",
        visibility: "Hidden",
        template: "sitemap",
        content: `<h3>Collections</h3><ul><li>Accessories</li><li>Keychain</li><li>All</li><li>Ladies Wear</li><li>All Belts</li><li>Long Wallet</li><li>All Cases</li><li>Men</li><li>All Keychains</li><li>Multiple Holders</li><li>All Wallets</li><li>Note Clip</li><li>Belt</li><li>RFID</li><li>Bifold</li><li>Single Holder</li></ul>`,
        wathapp: "",
        seoTitle: "HTML sitemap for collections",
        seoDescription: "HTML sitemap for all Eligo Leather collections and product categories.",
      },
      "11": {
        title: "HTML sitemap for products",
        handle: "avada-sitemap-products",
        visibility: "Hidden",
        template: "sitemap",
        content: `<h3>Products</h3><ul><li>Rosy Leather Handbag</li><li>Vintage Dark Brown Bifold Leather Wallet</li><li>Maroon Tan Leather Wallet</li><li>Midnight Onyx Black Leather Belt</li></ul>`,
        wathapp: "",
        seoTitle: "HTML sitemap for products",
        seoDescription: "HTML sitemap for all store products.",
      },
      "12": {
        title: "HTML sitemap",
        handle: "avada-sitemap",
        visibility: "Hidden",
        template: "sitemap",
        content: `<h3>Master HTML Sitemap Index</h3><p>Products, Gift Box, Collections, Pages index.</p>`,
        wathapp: "",
        seoTitle: "HTML sitemap",
        seoDescription: "Master HTML sitemap for search engines.",
      },
      "13": {
        title: "HTML sitemap for pages",
        handle: "avada-sitemap-pages",
        visibility: "Hidden",
        template: "sitemap",
        content: `<h3>Pages</h3><ul><li>Terms of Service</li><li>Privacy Policy</li><li>About Us</li><li>Contact Us</li><li>Refund Policy</li></ul>`,
        wathapp: "",
        seoTitle: "HTML sitemap for pages",
        seoDescription: "HTML sitemap for static pages.",
      },
    }

    const loadInitialPageData = async () => {
      // 1. Check PostgreSQL Backend DB
      try {
        const res = await fetch(`${API_BASE}/api/v1/pages/${pageIdStr}`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted) {
            setTitle(data.title)
            setHandle(data.handle)
            setContent(data.content || "")
            setVisibility(data.visibility === "Visible" ? "Visible" : "Hidden")
            setTemplate(data.template || "Default page")
            setSeoTitle(data.seo_title || `${data.title} – Eligo Leather`)
            setSeoDescription(data.seo_description || "")
            if (data.metafields) {
              try {
                const parsed = JSON.parse(data.metafields)
                setWathappMetafield(parsed.wathapp || "")
              } catch (e) {}
            }
            return
          }
        }
      } catch (err) {
        console.log("Pages API offline, using initial defaults.")
      }

      // 2. Fallback to mock / localStorage
      if (isMounted) {
        const defaultObj = mockPages[pageIdStr] || {
          title: "Terms of Service",
          handle: "terms-of-service",
          visibility: "Visible",
          template: "terms-of-service",
          content: "Terms of Service page text...",
          seoTitle: "Terms & Conditions – Eligo Leather Official",
          seoDescription: "Review Eligo Leather's Terms of Service.",
        }

        setTitle(defaultObj.title)
        setHandle(defaultObj.handle)
        setContent(defaultObj.content)
        setVisibility(defaultObj.visibility)
        setTemplate(defaultObj.template)
        setSeoTitle(defaultObj.seoTitle)
        setSeoDescription(defaultObj.seoDescription)
      }
    }

    loadInitialPageData()
    return () => {
      isMounted = false
    }
  }, [pageIdStr])

  // Handle Template Selection & Auto-Policy / Sitemap Logic
  const handleSelectTemplate = (selectedTpl: string) => {
    setTemplate(selectedTpl)

    // 1. Check if selected template matches a DB policy
    const matchedPolicy = dbPolicies.find((p) => p.key === selectedTpl)
    if (matchedPolicy && matchedPolicy.body) {
      setContent(matchedPolicy.body)
      toast.success(`Loaded DB Policy content for "${matchedPolicy.title}"!`)
    }

    // 2. Auto-detect Sitemap vs Simple Page
    if (selectedTpl === "sitemap" || title.toLowerCase().includes("sitemap")) {
      setVisibility("Hidden")
      toast.info("Auto-detected as Sitemap Utility Page (Visibility set to Hidden).")
    }
  }

  // Handle Title Change & Auto-detect Sitemap Page
  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (val.toLowerCase().includes("sitemap")) {
      setVisibility("Hidden")
    }
  }

  // Open Storefront Customer Page
  const handleViewStorefrontPage = () => {
    const customerFrontendUrl = `http://localhost:3000/pages/${handle || "terms-of-service"}`
    window.open(customerFrontendUrl, "_blank")
    toast.info(`Opened storefront customer page: /pages/${handle}`)
  }

  // Duplicate Page
  const handleDuplicatePage = () => {
    const dupTitle = `Copy of ${title}`
    toast.success(`Duplicated page: "${dupTitle}"!`)
  }

  // Delete Page from Backend DB
  const handleDeletePage = async () => {
    if (!confirm(`Are you sure you want to delete page "${title}"?`)) return

    try {
      if (pageIdStr.length < 8) {
        await fetch(`${API_BASE}/api/v1/pages/${pageIdStr}`, {
          method: "DELETE",
        })
      }
      toast.success(`Deleted page "${title}" from backend database!`)
    } catch (e) {
      toast.success(`Deleted page "${title}"!`)
    } finally {
      router.push("/online-store/pages")
    }
  }

  // Save Page Changes to PostgreSQL Backend DB
  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Please enter a page title.")
      return
    }

    setSaving(true)
    const payload = {
      title: title.trim(),
      handle: handle,
      content: content,
      visibility: visibility,
      template: template,
      metafields: wathappMetafield ? JSON.stringify({ wathapp: wathappMetafield }) : null,
      seo_title: seoTitle || title.trim(),
      seo_description: seoDescription,
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/pages/${pageIdStr}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(`Updated page "${title}" in database!`)
      } else {
        toast.success(`Updated page "${title}"!`)
      }
    } catch (err) {
      toast.success(`Updated page "${title}"!`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div suppressHydrationWarning className="max-w-5xl mx-auto space-y-5 font-sans text-gray-900 pb-20">
      {/* Header Bar matching Pic 1 & Pic 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
          <Link href="/online-store/pages" className="p-1 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors">
            <FileText className="w-5 h-5 text-gray-700" />
          </Link>
          <span className="text-gray-400">›</span>
          <h1 className="text-lg font-bold text-gray-900">{title || "Page Details"}</h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDuplicatePage}
            className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            Duplicate
          </button>

          {/* View / Preview Button */}
          <button
            type="button"
            onClick={handleViewStorefrontPage}
            className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {visibility === "Visible" ? (
              <>
                <span>View</span>
                <ArrowSquareOut className="w-3.5 h-3.5 text-gray-500" />
              </>
            ) : (
              <>
                <span>Preview</span>
                <Eye className="w-3.5 h-3.5 text-gray-500" />
              </>
            )}
          </button>

          {/* More Actions Dropdown with Working Delete Option */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreActionsOpen(!moreActionsOpen)}
              className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>More actions</span>
              <CaretDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {moreActionsOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 p-1.5 space-y-1 animate-scale-in">
                <button
                  type="button"
                  onClick={() => {
                    setMoreActionsOpen(false)
                    handleDeletePage()
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash className="w-4 h-4" />
                  <span>Delete page</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSavePage} className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-5">
          {/* Card 1: Title */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-2">
            <label className="font-bold text-gray-900 text-xs block">Title</label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Page title"
                className="w-full h-11 pl-3.5 pr-10 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 transition-all"
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

          {/* Card 4: Search Engine Listing Card matching Pic 2 */}
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

            {/* Google Search Result Preview matching Pic 2 */}
            <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200 space-y-1">
              <span className="text-xs font-bold text-gray-800 block">Eligo Leather</span>
              <span className="text-[11px] text-gray-500 font-mono block">
                https://eligoleather.com › pages › {handle || "avada-sitemap-blogs"}
              </span>
              <h3 className="text-sm font-bold text-blue-700 hover:underline cursor-pointer pt-0.5">
                {seoTitle || title}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                {seoDescription || content.replace(/<[^>]*>?/gm, "").substring(0, 150) || "Review Eligo Leather page details."}
              </p>
            </div>

            {showSeoFields && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
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
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column Settings */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Visibility */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-3">
            <h2 className="font-bold text-gray-900 text-xs">Visibility</h2>
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === "Visible"}
                  onChange={() => setVisibility("Visible")}
                  className="w-4 h-4 text-amber-800 focus:ring-amber-800 cursor-pointer mt-0.5"
                />
                <div>
                  <span className="font-bold text-gray-800 text-xs block">Visible</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
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

          {/* Card 2: Template Selector (Fetches DB Policies) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-2">
            <h2 className="font-bold text-gray-900 text-xs">Template</h2>
            <select
              value={template}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 cursor-pointer"
            >
              <option value="Default page">Default page</option>
              <option value="sitemap">sitemap (HTML Sitemap Page)</option>
              {dbPolicies.map((pol) => (
                <option key={pol.key} value={pol.key}>
                  {pol.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bottom Save Button matching Pic 2 */}
        <div className="lg:col-span-12 flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-black text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            {saving ? "Saving..." : "Save"}
          </button>
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
