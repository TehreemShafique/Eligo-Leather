"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  UploadSimple,
  Plus,
  TextB,
  TextItalic,
  TextUnderline,
  ListBullets,
  ListNumbers,
  Funnel,
  Globe,
  Sliders,
  Check,
} from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminNewCollectionPage() {
  const router = useRouter()
  const [title, setTitle] = useState("Leather Clutch Wallets")
  const [description, setDescription] = useState("Handcrafted luxury leather clutch wallets designed with multi-card slots and coin pouches.")
  const [themeTemplate, setThemeTemplate] = useState("Default collection")
  const [selectedAttribute, setSelectedAttribute] = useState("Category")
  const [selectedCategory, setSelectedCategory] = useState("Wallets (Apparel & Accessories > Handbags, Wallets & Cases > Wallets & Money Clips)")
  const [includeSubcategories, setIncludeSubcategories] = useState(true)
  const [pageTitle, setPageTitle] = useState("Leather Clutch Wallets | Eligo Leather")
  const [metaDescription, setMetaDescription] = useState("Explore handcrafted genuine leather clutch wallets.")

  const themeTemplates = [
    "Default collection",
    "all-belts",
    "all-cases",
    "all-keychains",
    "all-products",
    "all-wallets",
    "all",
    "belts",
    "boost-sd-original",
  ]

  const categoriesList = [
    "Belts (Apparel & Accessories > Clothing Accessories)",
    "Keychains (Apparel & Accessories > Handbag & Wallet Accessories)",
    "Business Card Cases & Card Cases & Wallets (Apparel & Accessories > Handbags, Wallets & Cases > Wallets & Money Clips)",
    "Cable Management (Electronics > Electronics Accessories)",
    "Eyewear Cases & Holders (Health & Beauty > Personal Care > Vision Care > Eyewear Accessories)",
    "Smoking Accessories (Home & Garden)",
  ]

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(`Collection "${title}" created successfully!`)
    setTimeout(() => {
      router.push("/products/collections")
    }, 400)
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
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
            <h1 className="text-2xl font-bold text-gray-900">Add Collection</h1>
            <p className="text-xs text-gray-500 mt-1">Configure collection rules, conditions, and publishing parameters.</p>
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
            className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Save Collection
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Details Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Title</label>
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
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-xs text-gray-900"
              />
            </div>
          </div>

          {/* Product Condition Attributes Card (Matching Prompt Specifications) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Products & Smart Conditions</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => toast.info("Condition added!")} className="px-3 py-1 bg-amber-50 text-amber-800 font-bold rounded-lg border border-amber-200">
                  + Add condition
                </button>
                <button type="button" onClick={() => toast.info("Products manual selector opened!")} className="px-3 py-1 bg-gray-100 text-gray-800 font-semibold rounded-lg border border-gray-300">
                  + Add products
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Search Attributes / Condition</label>
                <select
                  value={selectedAttribute}
                  onChange={(e) => setSelectedAttribute(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                >
                  <option value="Category">Category</option>
                  <option value="Compare at price">Compare at price</option>
                  <option value="Inventory stock">Inventory stock</option>
                  <option value="Price">Price</option>
                  <option value="Status">Status</option>
                  <option value="Tag">Tag</option>
                  <option value="Title">Title</option>
                  <option value="Type">Type</option>
                  <option value="Variant title">Variant title</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Select Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-amber-800"
                >
                  {categoriesList.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={includeSubcategories}
                  onChange={(e) => setIncludeSubcategories(e.target.checked)}
                  className="rounded border-gray-300 text-amber-800"
                />
                <span className="font-semibold text-gray-800">Include subcategories</span>
              </label>
            </div>
          </div>

          {/* Search Engine Listing Preview */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3 text-xs">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
              Search Engine Listing Preview
            </h2>
            <div>
              <div className="flex justify-between font-semibold text-gray-700 uppercase tracking-wide mb-1">
                <span>Page Title</span>
                <span className="font-mono text-gray-400">{pageTitle.length} of 70</span>
              </div>
              <input type="text" maxLength={70} value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} className="w-full h-9 px-3 rounded-lg bg-gray-50 border border-gray-300 font-semibold" />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">URL Handle</label>
              <div className="text-emerald-800 font-mono">https://eligoleather.com/collections/{slug}</div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6 text-xs">
          {/* Theme Template Selector */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <h2 className="font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Theme Template Selector</h2>
            <select value={themeTemplate} onChange={(e) => setThemeTemplate(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900">
              {themeTemplates.map((tmpl) => (
                <option key={tmpl} value={tmpl}>{tmpl}</option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </div>
  )
}
