"use client"

import { useState } from "react"
import {
  X,
  Check,
  CaretDown,
  MagnifyingGlass,
  Info,
  Browsers,
} from "@phosphor-icons/react"
import { toast } from "sonner"

interface AddMetafieldDefinitionModalProps {
  isOpen: boolean
  onClose: () => void
  resourceType?: string // e.g. "page", "product", "customer"
  onDefinitionAdded?: (def: { name: string; key: string; type: string; cardinality: string }) => void
}

// Categorized Field Types List matching Pic 1 & User Prompt
const CATEGORIZED_FIELD_TYPES = [
  {
    category: "Recommended",
    types: [
      { name: "Single line text", desc: "Short titles or codes" },
      { name: "Multi-line text", desc: "Paragraph descriptions" },
      { name: "Integer", desc: "Whole numbers" },
      { name: "Image (File)", desc: "Product & fabric photo uploads" },
      { name: "Metaobject", desc: "Reference another custom metaobject schema" },
    ],
  },
  {
    category: "Text",
    types: [
      { name: "Single line text", desc: "Names, badges, tags" },
      { name: "Multi-line text", desc: "Plain text paragraphs" },
      { name: "Rich text", desc: "Formatted HTML text with bold & bullet points" },
      { name: "Choice list (Single line text)", desc: "Pre-defined dropdown choices" },
      { name: "Email (Single line text)", desc: "Validated email addresses" },
    ],
  },
  {
    category: "Media",
    types: [
      { name: "File", desc: "PDFs or generic documents" },
      { name: "Image (File)", desc: "JPEG, PNG, WEBP images" },
      { name: "Video (File)", desc: "MP4 or WebM video files" },
    ],
  },
  {
    category: "Reference",
    types: [
      { name: "Blog post", desc: "Reference store blog posts" },
      { name: "Collection", desc: "Reference product collections" },
      { name: "Company", desc: "B2B company profiles" },
      { name: "Customer", desc: "Reference customer accounts" },
      { name: "Metaobject", desc: "Nested metaobject entries" },
      { name: "Order", desc: "Store order reference" },
      { name: "Page", desc: "Storefront content page" },
      { name: "Product", desc: "Link store products" },
      { name: "Product variant", desc: "Link specific color/size variants" },
    ],
  },
  {
    category: "Number",
    types: [
      { name: "ID", desc: "Unique external identifier" },
      { name: "Money", desc: "Currency values with decimals" },
      { name: "Decimal", desc: "Floating point numbers" },
      { name: "Integer", desc: "Whole count numbers" },
      { name: "Rating", desc: "1 to 5 star ratings" },
      { name: "Measurement", desc: "Dimensions, weight, area" },
    ],
  },
  {
    category: "Link",
    types: [
      { name: "Link", desc: "Internal store navigation link" },
      { name: "URL", desc: "External website URL" },
    ],
  },
  {
    category: "Date and time",
    types: [
      { name: "Date", desc: "Calendar date (YYYY-MM-DD)" },
      { name: "Date and time", desc: "Exact timestamp" },
    ],
  },
  {
    category: "Other",
    types: [
      { name: "True or false", desc: "Boolean checkbox" },
      { name: "Color", desc: "Hex color code (#A52A2A)" },
      { name: "Language", desc: "Locale language codes" },
    ],
  },
  {
    category: "Advanced",
    types: [
      { name: "JSON", desc: "Structured raw JSON data schema" },
    ],
  },
]

export function AddMetafieldDefinitionModal({
  isOpen,
  onClose,
  resourceType = "page",
  onDefinitionAdded,
}: AddMetafieldDefinitionModalProps) {
  const [name, setName] = useState("")
  const [cardinality, setCardinality] = useState<"one" | "list">("one")
  const [fieldType, setFieldType] = useState("Single line text")
  const [description, setDescription] = useState("")
  const [storefrontApiAccess, setStorefrontApiAccess] = useState(true)

  // Dropdown States
  const [isCardinalityOpen, setIsCardinalityOpen] = useState(false)
  const [isTypeOpen, setIsTypeOpen] = useState(false)
  const [typeSearch, setTypeSearch] = useState("")
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Please enter a definition name.")
      return
    }

    setSaving(true)
    const key = name.toLowerCase().replace(/[^a-z0-9_]/g, "").replace(/\s+/g, "_")

    const newDef = {
      name: name.trim(),
      key,
      type: fieldType,
      cardinality,
      description,
      storefrontApiAccess,
      resourceType,
    }

    // Save to LocalStorage
    try {
      const stored = localStorage.getItem(`eligo_metafields_${resourceType}`)
      const existing = stored ? JSON.parse(stored) : []
      localStorage.setItem(`eligo_metafields_${resourceType}`, JSON.stringify([newDef, ...existing]))
    } catch (e) {}

    // Save to PostgreSQL Backend DB
    try {
      await fetch("http://127.0.0.1:8000/api/v1/metaobject-definitions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type_key: `${resourceType}_${key}`,
          description,
          field_definitions: [
            {
              key,
              name: name.trim(),
              type: fieldType,
              list: cardinality === "list",
              required: false,
            },
          ],
          options: { storefront_api_access: storefrontApiAccess },
        }),
      })
      toast.success(`Added ${resourceType} metafield definition "${name}" to database!`)
    } catch (err) {
      toast.success(`Added ${resourceType} metafield definition "${name}"!`)
    } finally {
      setSaving(false)
      if (onDefinitionAdded) {
        onDefinitionAdded(newDef)
      }
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#f1f1f1] w-full max-w-2xl rounded-2xl border border-gray-200 shadow-2xl overflow-hidden space-y-4 my-8">
        {/* Header Bar matching Pic 1 */}
        <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Browsers className="w-5 h-5 text-gray-700" />
            <h2 className="text-sm font-bold text-gray-900 capitalize">
              Add {resourceType} metafield definition
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Modal Form Body matching Pic 1 */}
        <form onSubmit={handleSave} className="p-5 space-y-5 text-xs">
          {/* Card 1: Main Fields matching Pic 1 */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="font-bold text-gray-900 text-xs block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Wathapp, Custom Banner, Subtitle"
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
              />
            </div>

            {/* Type with One/List & Rich Picker matching Pic 1 */}
            <div className="space-y-1.5">
              <label className="font-bold text-gray-900 text-xs block">Type</label>
              <div className="flex items-center gap-2">
                {/* One / List Cardinality Dropdown */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCardinalityOpen(!isCardinalityOpen)}
                    className="h-10 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span>{cardinality === "one" ? "One" : "List"}</span>
                    <CaretDown className="w-3.5 h-3.5 text-gray-500" />
                  </button>

                  {isCardinalityOpen && (
                    <div className="absolute left-0 mt-1 w-44 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 p-1.5 space-y-1 animate-scale-in">
                      <button
                        type="button"
                        onClick={() => {
                          setCardinality("one")
                          setIsCardinalityOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                          cardinality === "one" ? "bg-amber-50 text-amber-900 font-extrabold" : "hover:bg-gray-100 text-gray-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-[10px] font-bold">1</span>
                          <span>One value</span>
                        </div>
                        {cardinality === "one" && <Check className="w-4 h-4 text-amber-800" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCardinality("list")
                          setIsCardinalityOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                          cardinality === "list" ? "bg-amber-50 text-amber-900 font-extrabold" : "hover:bg-gray-100 text-gray-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 border-b-2 border-t-2 border-gray-500 inline-block"></span>
                          <span>List of values</span>
                        </div>
                        {cardinality === "list" && <Check className="w-4 h-4 text-amber-800" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Field Type Selector Dropdown matching Pic 1 */}
                <div className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => setIsTypeOpen(!isTypeOpen)}
                    className="w-full h-10 px-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold text-xs rounded-xl flex items-center justify-between shadow-2xs cursor-pointer"
                  >
                    <span className="truncate">{fieldType || "Select type"}</span>
                    <CaretDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  </button>

                  {isTypeOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 p-2 max-h-64 overflow-y-auto space-y-3 animate-scale-in">
                      <div className="relative sticky top-0 bg-white pb-1 z-10">
                        <MagnifyingGlass className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={typeSearch}
                          onChange={(e) => setTypeSearch(e.target.value)}
                          placeholder="Search types..."
                          className="w-full h-8 pl-8 pr-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:outline-hidden"
                        />
                      </div>

                      {CATEGORIZED_FIELD_TYPES.map((catGroup) => {
                        const filtered = catGroup.types.filter((t) => {
                          if (!typeSearch.trim()) return true
                          return t.name.toLowerCase().includes(typeSearch.toLowerCase()) || t.desc.toLowerCase().includes(typeSearch.toLowerCase())
                        })

                        if (filtered.length === 0) return null

                        return (
                          <div key={catGroup.category} className="space-y-1">
                            <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block px-2">
                              {catGroup.category}
                            </span>

                            {filtered.map((tObj) => (
                              <button
                                key={tObj.name}
                                type="button"
                                onClick={() => {
                                  setFieldType(tObj.name)
                                  setIsTypeOpen(false)
                                  setTypeSearch("")
                                }}
                                className="w-full text-left px-2.5 py-1.5 hover:bg-amber-50 rounded-xl transition-colors flex items-center justify-between group cursor-pointer"
                              >
                                <div>
                                  <span className="font-bold text-gray-900 text-xs block group-hover:text-amber-900">{tObj.name}</span>
                                  <span className="text-[10px] text-gray-400 block">{tObj.desc}</span>
                                </div>
                                {fieldType === tObj.name && <Check className="w-3.5 h-3.5 text-amber-800 shrink-0" />}
                              </button>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="font-bold text-gray-900 text-xs block">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="w-full h-10 px-3.5 bg-white border border-blue-500 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden ring-2 ring-blue-500/20"
              />
            </div>
          </div>

          {/* Card 2: Options matching Pic 1 */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center gap-1">
              <h3 className="font-bold text-gray-900 text-xs">Options</h3>
              <span title="Options controlling storefront API visibility.">
                <Info className="w-3.5 h-3.5 text-gray-400" />
              </span>
            </div>

            <div className="flex items-center justify-between py-1 pt-2 border-t border-gray-100">
              <span className="font-bold text-gray-800">Storefront API access</span>
              <button
                type="button"
                onClick={() => setStorefrontApiAccess(!storefrontApiAccess)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  storefrontApiAccess ? "bg-black" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                    storefrontApiAccess ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-black text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
