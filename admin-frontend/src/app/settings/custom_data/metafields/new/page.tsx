"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  Info,
  Check,
  X,
  TextB,
  TextItalic,
  TextUnderline,
  ListBullets,
  ListNumbers,
  Link as LinkIcon,
  Code,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
} from "@phosphor-icons/react"
import { toast } from "sonner"

// MS-Word Style WYSIWYG Editor Component for Metafield Description
function DescriptionWysiwygEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) {
  const [isCodeView, setIsCodeView] = useState(false)

  const exec = (command: string, val?: string) => {
    document.execCommand(command, false, val)
  }

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-2xs">
      {/* Ribbon Toolbar */}
      <div className="p-2 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-1.5 text-xs text-gray-700 font-sans shadow-2xs select-none">
        <button
          type="button"
          onClick={() => exec("bold")}
          className="p-1.5 hover:bg-gray-200 rounded font-bold cursor-pointer transition-colors"
          title="Bold (Ctrl+B)"
        >
          <TextB className="w-4 h-4 text-gray-900" />
        </button>

        <button
          type="button"
          onClick={() => exec("italic")}
          className="p-1.5 hover:bg-gray-200 rounded cursor-pointer transition-colors"
          title="Italic (Ctrl+I)"
        >
          <TextItalic className="w-4 h-4 text-gray-900" />
        </button>

        <button
          type="button"
          onClick={() => exec("underline")}
          className="p-1.5 hover:bg-gray-200 rounded cursor-pointer transition-colors"
          title="Underline (Ctrl+U)"
        >
          <TextUnderline className="w-4 h-4 text-gray-900" />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />

        <button
          type="button"
          onClick={() => exec("justifyLeft")}
          className="p-1.5 hover:bg-gray-200 rounded cursor-pointer transition-colors"
          title="Align Left"
        >
          <TextAlignLeft className="w-4 h-4 text-gray-900" />
        </button>

        <button
          type="button"
          onClick={() => exec("justifyCenter")}
          className="p-1.5 hover:bg-gray-200 rounded cursor-pointer transition-colors"
          title="Align Center"
        >
          <TextAlignCenter className="w-4 h-4 text-gray-900" />
        </button>

        <button
          type="button"
          onClick={() => exec("justifyRight")}
          className="p-1.5 hover:bg-gray-200 rounded cursor-pointer transition-colors"
          title="Align Right"
        >
          <TextAlignRight className="w-4 h-4 text-gray-900" />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />

        <button
          type="button"
          onClick={() => exec("insertUnorderedList")}
          className="p-1.5 hover:bg-gray-200 rounded cursor-pointer transition-colors"
          title="Bulleted List"
        >
          <ListBullets className="w-4 h-4 text-gray-900" />
        </button>

        <button
          type="button"
          onClick={() => exec("insertOrderedList")}
          className="p-1.5 hover:bg-gray-200 rounded cursor-pointer transition-colors"
          title="Numbered List"
        >
          <ListNumbers className="w-4 h-4 text-gray-900" />
        </button>

        <button
          type="button"
          onClick={() => {
            const url = prompt("Enter Link URL:", "https://eligoleather.com")
            if (url) exec("createLink", url)
          }}
          className="p-1.5 hover:bg-gray-200 rounded cursor-pointer transition-colors"
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4 text-gray-900" />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />

        <button
          type="button"
          onClick={() => setIsCodeView(!isCodeView)}
          className={`p-1.5 rounded ml-auto cursor-pointer transition-colors ${
            isCodeView ? "bg-amber-200 text-amber-950 font-bold" : "hover:bg-gray-200"
          }`}
          title="Toggle HTML Code View"
        >
          <Code className="w-4 h-4 text-gray-900" />
        </button>
      </div>

      {/* Editor Surface */}
      {!isCodeView ? (
        <div
          contentEditable
          suppressContentEditableWarning={true}
          dangerouslySetInnerHTML={{ __html: value || "Provide instructions for staff when entering this field..." }}
          onInput={(e) => onChange(e.currentTarget.innerHTML)}
          className="p-3 text-xs font-sans text-gray-900 focus:outline-hidden min-h-[70px] leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
        />
      ) : (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 text-xs font-mono bg-gray-900 text-amber-400 focus:outline-hidden"
        />
      )}
    </div>
  )
}

function NewMetafieldFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const rawResourceType = (searchParams.get("resource") || "products").toLowerCase()

  // Map resource type to clean singular label
  const resourceTitleMap: Record<string, string> = {
    products: "product",
    variants: "variant",
    collections: "collection",
    customers: "customer",
    orders: "order",
    companies: "company",
    locations: "location",
    pages: "page",
    blog_posts: "blog post",
    markets: "market",
    shop: "shop",
  }

  const singularResourceLabel = resourceTitleMap[rawResourceType] || rawResourceType
  const pageHeadingTitle = `Add ${singularResourceLabel} metafield definition`

  // Form State
  const [name, setName] = useState(`${singularResourceLabel.charAt(0).toUpperCase() + singularResourceLabel.slice(1)} Attribute`)
  const [cardinality, setCardinality] = useState<"one" | "list">("one")
  const [selectedType, setSelectedType] = useState("Single line text")
  const [description, setDescription] = useState(`Specifies custom metadata attributes for ${rawResourceType.replace("_", " ")}.`)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Leather Wallets", "Belts"])
  const [storefrontApiAccess, setStorefrontApiAccess] = useState(true)

  // Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Please enter a definition name.")
      return
    }

    toast.success(`${singularResourceLabel.charAt(0).toUpperCase() + singularResourceLabel.slice(1)} metafield definition "${name}" created successfully!`)
    setTimeout(() => {
      router.push("/settings/custom_data")
    }, 400)
  }

  const namespaceKey = `custom.${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans pb-16">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/settings/custom_data"
            className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 capitalize">{pageHeadingTitle}</h1>
            <p className="text-xs text-gray-500 mt-0.5">Define custom metadata fields for your {rawResourceType.replace("_", " ")} catalog</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/settings/custom_data"
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors border border-gray-300"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Save definition
          </button>
        </div>
      </div>

      {/* Main Card 1: Name, Type, Description */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-5 text-xs">
        {/* Name Input */}
        <div className="space-y-1.5">
          <label className="block font-bold text-gray-900 text-xs">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Material Grade or Box Weight"
            className="w-full h-11 px-4 rounded-xl bg-gray-50/80 border border-gray-300 font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/40 text-sm"
          />
          <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
            <span>Namespace &amp; key: <strong className="font-mono text-amber-900">{namespaceKey}</strong></span>
          </div>
        </div>

        {/* Type Selector */}
        <div className="space-y-1.5">
          <label className="block font-bold text-gray-900 text-xs">Type</label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={cardinality}
              onChange={(e) => setCardinality(e.target.value as "one" | "list")}
              className="h-11 px-3 bg-gray-100 border border-gray-300 rounded-xl font-bold text-gray-800 text-xs shrink-0 cursor-pointer focus:outline-hidden"
            >
              <option value="one">One value</option>
              <option value="list">List of values</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="flex-1 h-11 px-4 bg-gray-50 border border-gray-300 rounded-xl font-bold text-amber-950 text-xs focus:outline-hidden cursor-pointer"
            >
              <optgroup label="Text & Rich Content">
                <option value="Single line text">Single line text</option>
                <option value="Multi-line text">Multi-line text</option>
                <option value="Rich text">Rich text (Lexical/WYSIWYG Toolbar)</option>
              </optgroup>

              <optgroup label="Media & Colors">
                <option value="File (Media)">File (Media)</option>
                <option value="Image">Image (File)</option>
                <option value="Color">Color (Hex Swatch)</option>
              </optgroup>

              <optgroup label="Reference Structures">
                <option value="Product">Product Reference</option>
                <option value="Variant">Variant Reference</option>
                <option value="Page">Page Reference</option>
              </optgroup>

              <optgroup label="Numbers & Measurement">
                <option value="Integer">Integer (Whole number)</option>
                <option value="Decimal">Decimal</option>
                <option value="Rating">Rating (1 to 5 stars)</option>
                <option value="Dimension">Dimension (cm, inches)</option>
                <option value="Money">Money (Currency)</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Description Field with WYSIWYG Toolbar */}
        <div className="space-y-1.5">
          <label className="block font-bold text-gray-900 text-xs">Description (Rich Text Toolbar Enabled)</label>
          <DescriptionWysiwygEditor
            value={description}
            onChange={setDescription}
          />
        </div>
      </div>

      {/* Main Card 2: Category assignments (For Products & Variants) */}
      {(rawResourceType === "products" || rawResourceType === "product" || rawResourceType === "variants" || rawResourceType === "variant") && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
          <div className="flex items-center gap-1.5">
            <h2 className="font-bold text-gray-900 text-xs">Category assignments</h2>
            <span title="Limit this metafield definition to specific product categories">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
            </span>
          </div>

          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((cat, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-amber-100 text-amber-900 font-semibold rounded-lg border border-amber-300 flex items-center gap-1.5 text-xs"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategories(selectedCategories.filter((c) => c !== cat))}
                    className="hover:text-black cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setCategoryModalOpen(true)}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl border border-gray-300 inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 text-amber-800" />
            <span>Select categories</span>
          </button>
        </div>
      )}

      {/* Main Card 3: Options - Storefront API access Toggle */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
        <div className="flex items-center gap-1.5">
          <h2 className="font-bold text-gray-900 text-xs">Options</h2>
          <span title="Controls storefront API accessibility">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div>
            <span className="font-bold text-gray-900 block text-xs">Storefront API access</span>
            <p className="text-[11px] text-gray-500 mt-0.5">Allows custom storefront apps and themes to read this {singularResourceLabel} metafield value.</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setStorefrontApiAccess(!storefrontApiAccess)
              toast.info(storefrontApiAccess ? "Storefront API access disabled" : "Storefront API access enabled")
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              storefrontApiAccess ? "bg-amber-800" : "bg-gray-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                storefrontApiAccess ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Select Categories Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Select Category Assignments</h3>
              <button onClick={() => setCategoryModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {["Leather Wallets", "Belts", "Card Holders", "Keychains", "Leather Bags", "Glasses Cases"].map((cat) => {
                const isChecked = selectedCategories.includes(cat)
                return (
                  <label
                    key={cat}
                    onClick={() => {
                      if (isChecked) setSelectedCategories(selectedCategories.filter((c) => c !== cat))
                      else setSelectedCategories([...selectedCategories, cat])
                    }}
                    className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer border border-transparent hover:border-gray-200"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? "bg-amber-800 border-amber-800 text-white" : "border-gray-300"}`}>
                      {isChecked && <Check className="w-3 h-3" />}
                    </div>
                    <span className="font-semibold text-gray-900">{cat}</span>
                  </label>
                )
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="px-5 py-2 bg-amber-800 text-white font-bold rounded-xl hover:bg-amber-900"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminNewMetafieldPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading Metafield Form...</div>}>
      <NewMetafieldFormContent />
    </Suspense>
  )
}
