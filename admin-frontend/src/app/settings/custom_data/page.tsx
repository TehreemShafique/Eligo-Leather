"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Tag,
  Plus,
  MagnifyingGlass,
  CaretRight,
  PushPin,
  Check,
  X,
  ArrowLeft,
  Trash,
} from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminSettingsCustomDataPage() {
  const [selectedResource, setSelectedResource] = useState<string | null>(null)
  const [selectedResourceType, setSelectedResourceType] = useState<string>("products")

  // Mock Metafield Definitions List
  const [productDefinitions, setProductDefinitions] = useState([
    { id: 1, name: "Product Material", key: "custom.material", type: "Rich text", category: "Leather Wallets", pinned: true },
    { id: 2, name: "Product Dimensions", key: "custom.dimensions", type: "Single line text", category: "Leather Wallets", pinned: fontTrue() },
    { id: 3, name: "Shipping & Return Policy", key: "custom.shipping_return_policy", type: "Multi-line text", category: "All Categories", pinned: false },
    { id: 4, name: "Care Instructions", key: "custom.care_instructions", type: "Multi-line text", category: "Leather Goods", pinned: false },
  ])

  function fontTrue() {
    return true
  }

  // Core Metafield Resources
  const metafieldResources = [
    { type: "products", name: "Products", defCount: 4, desc: "Product Material, Dimensions, Shipping & Return Policy, Meta Description." },
    { type: "variants", name: "Variants", defCount: 3, desc: "Custom variant colors, box dimensions, wholesale pricing rules." },
    { type: "collections", name: "Collections", defCount: 2, desc: "Collection hero banners, badge colors, promo tags." },
    { type: "customers", name: "Customers", defCount: 3, desc: "Loyalty tier badge, birthdate, preferred leather shade." },
    { type: "orders", name: "Orders", defCount: 2, desc: "Gift messaging, Leopards waybill notes, custom invoice numbers." },
    { type: "companies", name: "Companies", defCount: 0, desc: "B2B credit limits, tax exemption certificate IDs." },
    { type: "locations", name: "Locations", defCount: 1, desc: "Warehouse dispatch desk contact, pickup cutoff hours." },
    { type: "pages", name: "Pages", defCount: 2, desc: "Page subtitle, SEO canonical override, author signature." },
    { type: "blog_posts", name: "Blog posts", defCount: 1, desc: "Featured product links, reading time estimates." },
    { type: "markets", name: "Markets", defCount: 0, desc: "Regional duty tariffs, local currency formatting rules." },
    { type: "shop", name: "Shop", defCount: 2, desc: "Global brand assets, footer copyright disclaimers." },
  ]

  const handleTogglePin = (id: number) => {
    setProductDefinitions(
      productDefinitions.map((d) => (d.id === id ? { ...d, pinned: !d.pinned } : d))
    )
  }

  const handleDeleteDefinition = (id: number, name: string) => {
    setProductDefinitions(productDefinitions.filter((d) => d.id !== id))
    toast.info(`Metafield definition "${name}" removed.`)
  }

  return (
    <div className="space-y-6 font-sans max-w-6xl mx-auto pb-12">
      {/* Top Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
              <span>Metafield Definitions Hub</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Custom Data &amp; Metafield Definitions</h1>
            <p className="text-xs text-gray-500 mt-1">
              Define custom metadata fields to extend products, variants, collections, customers, and orders.
            </p>
          </div>

          <Link
            href={`/settings/custom_data/metafields/new?resource=${selectedResourceType}`}
            className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add definition</span>
          </Link>
        </div>
      </div>

      {/* Metafield Resources Content Area */}
      <div className="space-y-6 text-xs">
        {!selectedResource ? (
          /* Resource Overview List */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Resource Metafield Definitions
            </h2>

            <div className="grid grid-cols-1 divide-y divide-gray-100">
              {metafieldResources.map((res) => (
                <div
                  key={res.type}
                  onClick={() => {
                    setSelectedResource(res.name)
                    setSelectedResourceType(res.type)
                  }}
                  className="py-4 flex items-center justify-between hover:bg-gray-50/80 px-4 rounded-xl cursor-pointer transition-colors group"
                >
                  <div>
                    <div className="font-bold text-gray-900 text-sm group-hover:text-amber-800 transition-colors">
                      {res.name}
                    </div>
                    <span className="text-[11px] text-gray-500">{res.desc}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-gray-100 group-hover:bg-amber-100 group-hover:text-amber-800 rounded-full font-bold text-xs text-gray-700">
                      {res.defCount} definition{res.defCount !== 1 ? "s" : ""}
                    </span>
                    <CaretRight className="w-4 h-4 text-gray-400 group-hover:text-amber-800 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Resource-Specific Definition List View */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedResource(null)}
                  className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-black transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    {selectedResource} &gt; {selectedResource} metafield definitions
                  </span>
                  <h2 className="text-xl font-bold text-gray-900">{selectedResource} Custom Attributes</h2>
                </div>
              </div>

              <Link
                href={`/settings/custom_data/metafields/new?resource=${selectedResourceType}`}
                className="px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add definition</span>
              </Link>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
                <span className="font-bold text-gray-900 text-xs">
                  {selectedResource} Metafields List ({productDefinitions.length})
                </span>

                <div className="relative">
                  <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter definitions..."
                    className="pl-9 pr-4 py-1.5 bg-white border border-gray-300 rounded-xl text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Definition Name</th>
                    <th className="px-4 py-3">Namespace &amp; Key</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {productDefinitions.map((def) => (
                    <tr key={def.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-gray-900 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(def.id)}
                          className={`p-1 rounded hover:bg-gray-100 ${def.pinned ? "text-amber-800 font-bold" : "text-gray-400"}`}
                          title={def.pinned ? "Pinned Definition" : "Pin Definition"}
                        >
                          <PushPin className="w-3.5 h-3.5" />
                        </button>
                        <span>{def.name}</span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-amber-900 font-bold">
                        {def.key}
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-gray-700">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-900 rounded-full border border-amber-200 text-[11px]">
                          {def.type}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-gray-600">
                        {def.category}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteDefinition(def.id, def.name)}
                          className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                          title="Delete Definition"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
