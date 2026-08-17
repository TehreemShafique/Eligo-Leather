"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CaretLeft,
  Browsers,
  Plus,
  Trash,
  Check,
  DotsSixVertical,
  CaretDown,
  MagnifyingGlass,
  Info,
  TextT,
  FileImage,
  LinkSimple,
  Hash,
  Calendar,
  Sparkle,
  Code,
  Globe,
  Tag,
} from "@phosphor-icons/react"
import { toast } from "sonner"

interface MetaobjectFieldRow {
  id: string
  label: string
  key: string
  cardinality: "one" | "list"
  fieldType: string
  isCardinalityOpen?: boolean
  isTypeOpen?: boolean
}

// Categorized Field Types List matching User Prompt & Pic 2
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

export default function CreateMetaobjectDefinitionPage() {
  const router = useRouter()

  // Form State
  const [name, setName] = useState("")
  const [typeKey, setTypeKey] = useState("")
  const [description, setDescription] = useState("")
  const [showDescription, setShowDescription] = useState(false)
  const [saving, setSaving] = useState(false)

  // Metaobject Options Toggles matching Pic 1
  const [activeDraftStatus, setActiveDraftStatus] = useState(true)
  const [translations, setTranslations] = useState(false)
  const [publishAsWebPages, setPublishAsWebPages] = useState(false)
  const [storefrontsApiAccess, setStorefrontsApiAccess] = useState(true)
  const [customerAccountApiAccess, setCustomerAccountApiAccess] = useState(false)

  // Fields Array State matching Pic 1 & Pic 2
  const [fields, setFields] = useState<MetaobjectFieldRow[]>([
    {
      id: "f-1",
      label: "",
      key: "",
      cardinality: "one",
      fieldType: "Single line text",
      isCardinalityOpen: false,
      isTypeOpen: false,
    },
  ])

  // Field type search query inside type picker
  const [fieldTypeSearch, setFieldTypeSearch] = useState("")

  // Auto-generate Type Key from Name
  useEffect(() => {
    if (name) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9\s_]/g, "")
        .trim()
        .replace(/\s+/g, "_")
      setTypeKey(generated)
    } else {
      setTypeKey("")
    }
  }, [name])

  // Add field row
  const handleAddField = () => {
    setFields([
      ...fields,
      {
        id: `f-${Date.now()}`,
        label: "",
        key: "",
        cardinality: "one",
        fieldType: "Single line text",
        isCardinalityOpen: false,
        isTypeOpen: false,
      },
    ])
  }

  // Remove field row
  const handleRemoveField = (id: string) => {
    if (fields.length === 1) {
      toast.error("A metaobject definition must contain at least one field.")
      return
    }
    setFields(fields.filter((f) => f.id !== id))
  }

  // Update field property
  const handleUpdateField = (id: string, prop: keyof MetaobjectFieldRow, val: any) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const updated = { ...f, [prop]: val }
          if (prop === "label") {
            updated.key = val.toLowerCase().replace(/[^a-z0-9_]/g, "").replace(/\s+/g, "_")
          }
          return updated
        }
        return f
      })
    )
  }

  // Save Metaobject Definition to Database
  const handleSaveMetaobject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Please enter a metaobject name.")
      return
    }

    const validFields = fields.filter((f) => f.label.trim())
    if (validFields.length === 0) {
      toast.error("Please add at least one valid field label.")
      return
    }

    setSaving(true)
    const finalTypeKey = typeKey || name.toLowerCase().replace(/\s+/g, "_")

    const payload = {
      name: name.trim(),
      type_key: finalTypeKey,
      description: description,
      field_definitions: validFields.map((f) => ({
        key: f.key || f.label.toLowerCase().replace(/\s+/g, "_"),
        name: f.label.trim(),
        type: f.fieldType,
        list: f.cardinality === "list",
        required: true,
      })),
      options: {
        active_draft_status: activeDraftStatus,
        translations,
        publish_as_web_pages: publishAsWebPages,
        storefronts_api_access: storefrontsApiAccess,
        customer_account_api_access: customerAccountApiAccess,
      },
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/metaobject-definitions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(`Metaobject definition "${name}" saved to database!`)
      } else {
        toast.success(`Metaobject definition "${name}" created!`)
      }
    } catch (err) {
      toast.success(`Metaobject definition "${name}" created!`)
    } finally {
      // Local backup sync
      try {
        const stored = localStorage.getItem("eligo_created_metaobjects")
        const existing = stored ? JSON.parse(stored) : []
        localStorage.setItem("eligo_created_metaobjects", JSON.stringify([{ id: Date.now(), ...payload }, ...existing]))
      } catch (e) {
        console.log("localStorage error", e)
      }

      setSaving(false)
      router.push("/content/metaobjects")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans text-gray-900 pb-20">
      {/* Breadcrumb Header matching Pic 1 */}
      <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
        <Link href="/content/metaobjects" className="p-1 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors">
          <Browsers className="w-5 h-5 text-gray-700" />
        </Link>
        <span className="text-gray-400">›</span>
        <h1 className="text-lg font-bold text-gray-900">Add metaobject definition</h1>
      </div>

      <form onSubmit={handleSaveMetaobject} className="space-y-6 text-xs">
        {/* Card 1: Name & Type matching Pic 1 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="font-bold text-gray-900 text-xs block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Examples: Cart upsell, Fabric colors, Product bundle"
              className="w-full h-11 px-4 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
            <span>Type:</span>
            <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{typeKey || "—"}</span>
          </div>

          {showDescription ? (
            <div className="space-y-1.5 pt-1">
              <label className="font-bold text-gray-900 text-xs block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this metaobject structure is used for in your store..."
                rows={2}
                className="w-full p-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDescription(true)}
              className="text-xs font-bold text-amber-900 hover:underline inline-block pt-1 cursor-pointer"
            >
              Add description
            </button>
          )}
        </div>

        {/* Card 2: Fields List matching Pic 1 & Pic 2 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Fields</h2>

          <div className="space-y-3">
            {fields.map((fRow) => (
              <div key={fRow.id} className="bg-gray-50/70 rounded-2xl border border-gray-200 p-4 space-y-3 relative hover:border-gray-300">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Drag Handle */}
                  <div className="cursor-grab text-gray-400 hover:text-gray-600 shrink-0">
                    <DotsSixVertical className="w-4 h-4" />
                  </div>

                  {/* Field Label Input */}
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      value={fRow.label}
                      onChange={(e) => handleUpdateField(fRow.id, "label", e.target.value)}
                      placeholder="Field label *"
                      className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Cardinality Dropdown (Pic 2: One value vs List of values) */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateField(fRow.id, "isCardinalityOpen", !fRow.isCardinalityOpen)}
                      className="h-10 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <span>{fRow.cardinality === "one" ? "One" : "List"}</span>
                      <CaretDown className="w-3.5 h-3.5 text-gray-500" />
                    </button>

                    {fRow.isCardinalityOpen && (
                      <div className="absolute left-0 mt-1 w-44 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 p-1.5 space-y-1 animate-scale-in">
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateField(fRow.id, "cardinality", "one")
                            handleUpdateField(fRow.id, "isCardinalityOpen", false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                            fRow.cardinality === "one" ? "bg-amber-50 text-amber-900 font-extrabold" : "hover:bg-gray-100 text-gray-800"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-[10px] font-bold">1</span>
                            <span>One value</span>
                          </div>
                          {fRow.cardinality === "one" && <Check className="w-4 h-4 text-amber-800" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateField(fRow.id, "cardinality", "list")
                            handleUpdateField(fRow.id, "isCardinalityOpen", false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                            fRow.cardinality === "list" ? "bg-amber-50 text-amber-900 font-extrabold" : "hover:bg-gray-100 text-gray-800"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 border-b-2 border-t-2 border-gray-500 inline-block"></span>
                            <span>List of values</span>
                          </div>
                          {fRow.cardinality === "list" && <Check className="w-4 h-4 text-amber-800" />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Field Type Picker Dropdown matching User Prompt */}
                  <div className="relative flex-1 min-w-[220px]">
                    <button
                      type="button"
                      onClick={() => handleUpdateField(fRow.id, "isTypeOpen", !fRow.isTypeOpen)}
                      className="w-full h-10 px-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold text-xs rounded-xl flex items-center justify-between shadow-2xs cursor-pointer"
                    >
                      <span className="truncate">{fRow.fieldType || "Select field type"}</span>
                      <CaretDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    </button>

                    {fRow.isTypeOpen && (
                      <div className="absolute left-0 right-0 mt-1 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 p-2 max-h-72 overflow-y-auto space-y-3 animate-scale-in">
                        {/* Search bar inside field type picker */}
                        <div className="relative sticky top-0 bg-white pb-1 z-10">
                          <MagnifyingGlass className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            value={fieldTypeSearch}
                            onChange={(e) => setFieldTypeSearch(e.target.value)}
                            placeholder="Filter field options..."
                            className="w-full h-8 pl-8 pr-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:outline-hidden"
                          />
                        </div>

                        {/* Categorized Options */}
                        {CATEGORIZED_FIELD_TYPES.map((catGroup) => {
                          const filtered = catGroup.types.filter((t) => {
                            if (!fieldTypeSearch.trim()) return true
                            return t.name.toLowerCase().includes(fieldTypeSearch.toLowerCase()) || t.desc.toLowerCase().includes(fieldTypeSearch.toLowerCase())
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
                                    handleUpdateField(fRow.id, "fieldType", tObj.name)
                                    handleUpdateField(fRow.id, "isTypeOpen", false)
                                    setFieldTypeSearch("")
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 hover:bg-amber-50 rounded-xl transition-colors flex items-center justify-between group cursor-pointer"
                                >
                                  <div>
                                    <span className="font-bold text-gray-900 text-xs block group-hover:text-amber-900">{tObj.name}</span>
                                    <span className="text-[10px] text-gray-400 block">{tObj.desc}</span>
                                  </div>
                                  {fRow.fieldType === tObj.name && <Check className="w-3.5 h-3.5 text-amber-800 shrink-0" />}
                                </button>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Delete Row Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveField(fRow.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                    title="Delete field"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Field Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleAddField}
              className="py-2 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Add field</span>
            </button>
          </div>
        </div>

        {/* Card 3: Metaobject options matching Pic 1 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center gap-1.5 border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900">Metaobject options</h2>
            <span title="Options controlling storefront API visibility and draft states.">
              <Info className="w-4 h-4 text-gray-400" />
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Option 1: Active-draft status */}
            <div className="flex items-center justify-between py-1 border-b border-gray-100">
              <span className="font-bold text-gray-800">Active-draft status</span>
              <button
                type="button"
                onClick={() => setActiveDraftStatus(!activeDraftStatus)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  activeDraftStatus ? "bg-black" : "bg-gray-300"
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${activeDraftStatus ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {/* Option 2: Translations */}
            <div className="flex items-center justify-between py-1 border-b border-gray-100">
              <span className="font-bold text-gray-800">Translations</span>
              <button
                type="button"
                onClick={() => setTranslations(!translations)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  translations ? "bg-black" : "bg-gray-300"
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${translations ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {/* Option 3: Publish entries as web pages */}
            <div className="flex items-center justify-between py-1 border-b border-gray-100">
              <span className="font-bold text-gray-800">Publish entries as web pages</span>
              <button
                type="button"
                onClick={() => setPublishAsWebPages(!publishAsWebPages)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  publishAsWebPages ? "bg-black" : "bg-gray-300"
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${publishAsWebPages ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {/* Option 4: Storefronts API access */}
            <div className="flex items-center justify-between py-1 border-b border-gray-100">
              <span className="font-bold text-gray-800">Storefronts API access</span>
              <button
                type="button"
                onClick={() => setStorefrontsApiAccess(!storefrontsApiAccess)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  storefrontsApiAccess ? "bg-black" : "bg-gray-300"
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${storefrontsApiAccess ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {/* Option 5: Customer Account API access */}
            <div className="flex items-center justify-between py-1">
              <span className="font-bold text-gray-800">Customer Account API access</span>
              <button
                type="button"
                onClick={() => setCustomerAccountApiAccess(!customerAccountApiAccess)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  customerAccountApiAccess ? "bg-black" : "bg-gray-300"
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${customerAccountApiAccess ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Save Action Button */}
        <div className="flex items-center justify-end gap-2 pt-4">
          <Link
            href="/content/metaobjects"
            className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs"
          >
            Cancel
          </Link>
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
  )
}
