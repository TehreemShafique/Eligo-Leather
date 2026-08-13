"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, DownloadSimple, UploadSimple, Tag, Check, Sliders } from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminNewCatalogPage() {
  const router = useRouter()
  const [title, setTitle] = useState("B2B Corporate VIP Catalog")
  const [status, setStatus] = useState("Active")
  const [currency, setCurrency] = useState("Store currency (PKR Rs)")
  const [adjustmentPercentage, setAdjustmentPercentage] = useState("15")
  const [adjustmentDirection, setAdjustmentDirection] = useState<"Decrease" | "Increase">("Decrease")
  const [includeCompareAt, setIncludeCompareAt] = useState(true)
  const [autoIncludeNew, setAutoIncludeNew] = useState(true)
  const [productTab, setProductTab] = useState<"included" | "excluded" | "all">("included")

  const catalogProducts = [
    {
      id: 1,
      name: "APEX - Waxy Handmade Keychain",
      variants: "3 variants",
      pricePKR: "1,299",
      compareAtPKR: "1,500",
      rules: "Included",
      img: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: 2,
      name: "ARDOR - Handmade Leather Card Holder Wallet",
      variants: "4 variants",
      pricePKR: "1,699",
      compareAtPKR: "2,200",
      rules: "Included",
      img: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: 3,
      name: "SOVEREIGN - Real Leather Classic Dress Belt",
      variants: "5 variants",
      pricePKR: "2,499",
      compareAtPKR: "3,000",
      rules: "Included",
      img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=200",
    },
  ]

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(`Catalog "${title}" saved and assigned!`)
    setTimeout(() => {
      router.push("/markets/catalogs")
    }, 400)
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/markets/catalogs"
            className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Catalog</h1>
            <p className="text-xs text-gray-500 mt-1">Configure market pricing adjustments and product rules.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/markets/catalogs"
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors border border-gray-300"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Save Catalog
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Title & Status Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Catalog Title & Status</h2>
            <span className="text-[11px] text-gray-400 font-mono">{title.length}/255</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-9">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Title</label>
              <input
                type="text"
                required
                maxLength={255}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. B2B Corporate VIP Catalog"
                className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 text-sm font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-gray-50 border border-gray-300 text-xs font-bold text-gray-900"
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Markets Assignment */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Markets Assignment</h2>
            <button
              type="button"
              onClick={() => toast.info("Opening market selector...")}
              className="text-xs font-bold text-amber-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add a market</span>
            </button>
          </div>
          <p className="text-xs text-gray-600">Assigned Market: <strong className="text-gray-900">Pakistan (Primary) & B2B Accounts</strong></p>
        </div>

        {/* Pricing Adjustments Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
            Pricing & Adjustments
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Set prices in</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
              >
                <option value="Store currency (PKR Rs)">Store currency (PKR Rs)</option>
                <option value="US Dollar (USD $)">US Dollar (USD $)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Price Adjustment Direction</label>
                <select
                  value={adjustmentDirection}
                  onChange={(e) => setAdjustmentDirection(e.target.value as any)}
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                >
                  <option value="Decrease">Decrease (-)</option>
                  <option value="Increase">Increase (+)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Percentage (%)</label>
                <input
                  type="number"
                  value={adjustmentPercentage}
                  onChange={(e) => setAdjustmentPercentage(e.target.value)}
                  placeholder="15"
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={includeCompareAt}
                onChange={(e) => setIncludeCompareAt(e.target.checked)}
                className="rounded border-gray-300 text-amber-800"
              />
              <span className="font-semibold text-gray-800">Include compare-at price in adjustments</span>
            </label>
          </div>
        </div>

        {/* Products Management Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Products Management</h2>
              <label className="flex items-center gap-2 cursor-pointer mt-1 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={autoIncludeNew}
                  onChange={(e) => setAutoIncludeNew(e.target.checked)}
                  className="rounded border-gray-300 text-amber-800"
                />
                <span>Automatically include new products</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toast.info("Exporting catalog products...")}
                className="px-3 py-1.5 bg-gray-100 border border-gray-300 text-gray-800 font-semibold rounded-lg text-xs"
              >
                Export
              </button>
              <button
                type="button"
                onClick={() => toast.info("Importing custom prices...")}
                className="px-3 py-1.5 bg-gray-100 border border-gray-300 text-gray-800 font-semibold rounded-lg text-xs"
              >
                Import
              </button>
            </div>
          </div>

          {/* Product Tabs & Table */}
          <div className="flex items-center gap-1 px-4 pt-2 border-b border-gray-200 bg-gray-50/50">
            <button
              type="button"
              onClick={() => setProductTab("included")}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
                productTab === "included" ? "border-amber-800 text-amber-800" : "border-transparent text-gray-600"
              }`}
            >
              Included (3)
            </button>
            <button
              type="button"
              onClick={() => setProductTab("excluded")}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
                productTab === "excluded" ? "border-amber-800 text-amber-800" : "border-transparent text-gray-600"
              }`}
            >
              Excluded (0)
            </button>
            <button
              type="button"
              onClick={() => setProductTab("all")}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
                productTab === "all" ? "border-amber-800 text-amber-800" : "border-transparent text-gray-600"
              }`}
            >
              All Products
            </button>
          </div>

          <div className="eligo-table-wrap">
            <table className="eligo-table">
              <thead>
                <tr>
                  <th className="eligo-th">Product</th>
                  <th className="eligo-th">Variants</th>
                  <th className="eligo-th">Price in PKR</th>
                  <th className="eligo-th">Compare-at Price</th>
                  <th className="eligo-th text-right">Rules</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {catalogProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 relative overflow-hidden border border-gray-200 shrink-0">
                          <Image src={prod.img} alt={prod.name} fill unoptimized className="object-cover" />
                        </div>
                        <span className="font-bold text-gray-900">{prod.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-600">{prod.variants}</td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        defaultValue={prod.pricePKR}
                        className="w-28 h-8 px-2 rounded bg-gray-50 border border-gray-300 font-bold text-amber-800 text-xs"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        defaultValue={prod.compareAtPKR}
                        className="w-28 h-8 px-2 rounded bg-gray-50 border border-gray-300 text-gray-500 text-xs"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {prod.rules}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </form>
    </div>
  )
}
