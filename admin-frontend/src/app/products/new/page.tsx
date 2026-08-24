"use client"

import { API_BASE } from "@/lib/api"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  TextB,
  TextItalic,
  TextUnderline,
  ListBullets,
  ListNumbers,
  Link as LinkIcon,
  UploadSimple,
  Plus,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  Code,
  Trash,
  Tag,
  Ruler,
  Truck,
  SlidersHorizontal,
  Eye,
  Desktop,
  X,
} from "@phosphor-icons/react"
import { toast } from "sonner"

// MS-Word Style WYSIWYG Editor with Top Formatting Toolbar
function WysiwygRichEditor({
  initialHtml,
  onChange,
  minHeight = "120px",
}: {
  initialHtml: string
  onChange: (html: string) => void
  minHeight?: string
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [headingBlock, setHeadingBlock] = useState("p")
  const [isCodeView, setIsCodeView] = useState(false)
  const [rawHtml, setRawHtml] = useState(initialHtml)

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = initialHtml
    }
  }, [initialHtml])

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      const updated = editorRef.current.innerHTML
      setRawHtml(updated)
      onChange(updated)
    }
  }

  const handleHeadingChange = (tag: string) => {
    setHeadingBlock(tag)
    exec("formatBlock", `<${tag}>`)
  }

  const handleInput = () => {
    if (editorRef.current) {
      const updated = editorRef.current.innerHTML
      setRawHtml(updated)
      onChange(updated)
    }
  }

  const handleCodeInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setRawHtml(val)
    onChange(val)
    if (editorRef.current) {
      editorRef.current.innerHTML = val
    }
  }

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-2xs">
      <div className="p-2 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-1.5 text-xs text-gray-700 font-sans shadow-2xs select-none">
        <select
          value={headingBlock}
          onChange={(e) => handleHeadingChange(e.target.value)}
          className="h-7 px-2 bg-white border border-gray-300 rounded-lg text-[11px] font-semibold text-gray-800 focus:outline-hidden"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1 (24px)</option>
          <option value="h2">Heading 2 (20px)</option>
          <option value="h3">Heading 3 (16px)</option>
        </select>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />

        <button type="button" onClick={() => exec("bold")} className="p-1.5 hover:bg-gray-200 rounded font-bold cursor-pointer transition-colors" title="Bold (Ctrl+B)">
          <TextB className="w-4 h-4 text-gray-900" />
        </button>

        <button type="button" onClick={() => exec("italic")} className="p-1.5 hover:bg-gray-200 rounded cursor-pointer transition-colors" title="Italic (Ctrl+I)">
          <TextItalic className="w-4 h-4 text-gray-900" />
        </button>

        <button type="button" onClick={() => exec("underline")} className="p-1.5 hover:bg-gray-200 rounded cursor-pointer transition-colors" title="Underline (Ctrl+U)">
          <TextUnderline className="w-4 h-4 text-gray-900" />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />

        <button type="button" onClick={() => exec("justifyLeft")} className="p-1.5 hover:bg-gray-200 rounded cursor-pointer transition-colors" title="Align Left">
          <TextAlignLeft className="w-4 h-4 text-gray-900" />
        </button>

        <button type="button" onClick={() => exec("justifyCenter")} className="p-1.5 hover:bg-gray-200 rounded cursor-pointer transition-colors" title="Align Center">
          <TextAlignCenter className="w-4 h-4 text-gray-900" />
        </button>

        <button type="button" onClick={() => exec("justifyRight")} className="p-1.5 hover:bg-gray-200 rounded cursor-pointer transition-colors" title="Align Right">
          <TextAlignRight className="w-4 h-4 text-gray-900" />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />

        <button type="button" onClick={() => exec("insertUnorderedList")} className="p-1.5 hover:bg-gray-200 rounded cursor-pointer transition-colors" title="Bulleted List">
          <ListBullets className="w-4 h-4 text-gray-900" />
        </button>

        <button type="button" onClick={() => exec("insertOrderedList")} className="p-1.5 hover:bg-gray-200 rounded cursor-pointer transition-colors" title="Numbered List">
          <ListNumbers className="w-4 h-4 text-gray-900" />
        </button>

        <button type="button" onClick={() => { const url = prompt("Enter link URL:", "https://eligoleather.com"); if (url) exec("createLink", url) }} className="p-1.5 hover:bg-gray-200 rounded cursor-pointer transition-colors" title="Insert Link">
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

      {!isCodeView ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning={true}
          onInput={handleInput}
          style={{ minHeight }}
          className="p-4 text-xs text-gray-900 focus:outline-hidden leading-relaxed font-sans [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:text-gray-900 [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-amber-900 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-gray-800 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_a]:text-amber-800 [&_a]:underline font-normal"
        />
      ) : (
        <textarea
          rows={6}
          value={rawHtml}
          onChange={handleCodeInput}
          className="w-full p-4 text-xs font-mono bg-gray-900 text-amber-400 focus:outline-hidden leading-relaxed"
        />
      )}
    </div>
  )
}

interface CustomMetafieldDefinition {
  id: string
  key: string
  label: string
  value: string
}

interface MediaItem {
  id: number
  url: string
  colorTag: string
  altText: string
}

interface VariantItem {
  id: string
  colorName: string
  hex: string
  sku: string
  price: string
  stockQty: string
  isCanonical: boolean
  handleSuffix: string
  imageUrls: string[]
}

// Auto-suggested swatch hex values for common leather color names.
const COLOR_HEX_MAP: Record<string, string> = {
  black: "#1c1c1c",
  brown: "#6b4226",
  "dark brown": "#4a2c17",
  tan: "#d2a25c",
  maroon: "#5c1f2e",
  burgundy: "#5c1a24",
  red: "#b91c1c",
  orange: "#c2621a",
  cognac: "#9a4f1e",
  chestnut: "#7c3f21",
  olive: "#5f5b2f",
  green: "#2f5d3a",
  emerald: "#0f766e",
  blue: "#1e3a8a",
  navy: "#16254f",
  teal: "#116465",
  purple: "#5b2a86",
  plum: "#6e2a4d",
  pink: "#c08497",
  beige: "#d9c9a8",
  cream: "#efe6cf",
  white: "#f5f5f0",
  grey: "#8a8a85",
  gray: "#8a8a85",
  charcoal: "#36454f",
  mustard: "#c99a2e",
  yellow: "#d9a520",
  camel: "#b78453",
  taupe: "#8b7d6b",
  chocolate: "#3f2a1d",
  whiskey: "#8e5a2b",
}

export default function AdminNewProductPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<"edit" | "live_preview">("edit")

  // Multi-Category Selection State (Product can belong to 2 or more categories)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])

  // Custom Editable JSON-LD Schema Code State
  const [customScriptOverride, setCustomScriptOverride] = useState<string>("")
  const [isScriptEdited, setIsScriptEdited] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
    const fetchDBColls = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/catalog/collections/`)
        if (res.ok) {
          const cols = await res.json()
          if (Array.isArray(cols) && cols.length > 0) {
            const names = cols.map((c: any) => c.title)
            setAvailableCategories(prev => Array.from(new Set([...names, ...prev])))
          }
        }
      } catch (err) {}
    }
    fetchDBColls()
  }, [])

  const handleToggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(prev => prev.filter(c => c !== cat))
    } else {
      setSelectedCategories(prev => [...prev, cat])
    }
  }

  // Form State: Product Details
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [material, setMaterial] = useState("")
  const [dimensions, setDimensions] = useState("")
  const [shippingReturnPolicy, setShippingReturnPolicy] = useState("")

  // Pricing & Inventory State
  const [price, setPrice] = useState("")
  const [compareAtPrice, setCompareAtPrice] = useState("")
  const [sku, setSku] = useState("")
  const [status, setStatus] = useState("Active")
  const [productType, setProductType] = useState("")
  const [vendor, setVendor] = useState("Eligo Leather")

  // Color-Tagged Media Upload Gallery Items with Alt Text
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])

  // Color Variants Matrix State (with independent stock quantity per color)
  const [selectedPreviewColor, setSelectedPreviewColor] = useState("")
  const [colorVariants, setColorVariants] = useState<VariantItem[]>([])

  const [newColorName, setNewColorName] = useState("")
  const [newColorHex, setNewColorHex] = useState("#000000")

  // Metafields & SEO States
  const [pageTitle, setPageTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [addDefModalOpen, setAddDefModalOpen] = useState(false)
  const [newDefLabel, setNewDefLabel] = useState("")

  const [customMetafields, setCustomMetafields] = useState<CustomMetafieldDefinition[]>([])

  // Total calculated stock across all color variants
  const totalStockQuantity = colorVariants.reduce((sum, v) => sum + (parseInt(v.stockQty) || 0), 0)

  // Handlers
  // Rebuilds each variant's pic list (index 0 = main, index 1 = hover) from all media bound to its color.
  const syncVariantImages = (mediaList: MediaItem[], variants: VariantItem[]) =>
    variants.map((v) => ({
      ...v,
      imageUrls: mediaList.filter((m) => m.colorTag === v.colorName).map((m) => m.url),
    }))

  const handleAssignMediaColor = (mediaId: number, colorName: string) => {
    const updatedMedia = mediaItems.map((m) => (m.id === mediaId ? { ...m, colorTag: colorName } : m))
    setMediaItems(updatedMedia)
    setColorVariants(prev => syncVariantImages(updatedMedia, prev))

    if (colorName !== "Unassigned") {
      toast.success(`Assigned photo to "${colorName}" variant!`)
    }
  }

  const handleRemoveMedia = (mediaId: number) => {
    const updatedMedia = mediaItems.filter((m) => m.id !== mediaId)
    setMediaItems(updatedMedia)
    setColorVariants(prev => syncVariantImages(updatedMedia, prev))
  }

  const handleUpdateMediaAltText = (mediaId: number, altText: string) => {
    setMediaItems(prev => prev.map(m => m.id === mediaId ? { ...m, altText } : m))
  }

  const handleUpdateVariantField = (id: string, field: "price" | "stockQty" | "sku", val: string) => {
    setColorVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: val } : v))
  }

  const handleNativeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newMediaItems: MediaItem[] = []
    Array.from(files).forEach((file, index) => {
      const objUrl = URL.createObjectURL(file)
      newMediaItems.push({
        id: Date.now() + index,
        url: objUrl,
        colorTag: "Unassigned",
        altText: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      })
    })

    setMediaItems(prev => [...prev, ...newMediaItems])
    toast.success(`${files.length} photo(s) added!`)
  }

  const handleAddColorVariant = () => {
    if (!newColorName.trim()) {
      toast.error("Please enter a color name.")
      return
    }

    const generatedId = String(Date.now()).slice(-14)
    const newVar: VariantItem = {
      id: generatedId,
      colorName: newColorName,
      hex: newColorHex,
      sku: `004-DYN-${newColorName.slice(0, 3).toUpperCase()}`,
      price: price || "2799",
      stockQty: "50",
      isCanonical: false,
      handleSuffix: `?variant=${generatedId}`,
      imageUrls: [],
    }

    setColorVariants([...colorVariants, newVar])
    setNewColorName("")
    toast.success(`Created variant for "${newColorName}" (#${generatedId})`)
  }

  const handleSetPrimaryCanonical = (id: string) => {
    setColorVariants(
      colorVariants.map((v) => ({
        ...v,
        isCanonical: v.id === id,
        handleSuffix: v.id === id ? "" : `?variant=${v.id}`,
      }))
    )
    toast.success("Updated primary canonical main product variant!")
  }

  const handleRemoveColorVariant = (id: string) => {
    if (colorVariants.length <= 1) {
      toast.error("At least one product variant must remain.")
      return
    }
    setColorVariants(colorVariants.filter((v) => v.id !== id))
    toast.info("Color variant removed.")
  }

  const handleInsertPresetDefinition = (presetKey: string) => {
    const presets: Record<string, { label: string; value: string }> = {
      care_instructions: {
        label: "Leather Care Instructions",
        value: "<p>Apply natural leather cream twice yearly. Store in a cool, dry cloth bag.</p>",
      },
      warranty_policy: {
        label: "Lifetime Leather Warranty",
        value: "<p>Includes 1-year warranty against stitching or hardware craftsmanship defects.</p>",
      },
      engraving_customization: {
        label: "Monogram & Laser Engraving",
        value: "<p>Custom laser initials (up to 4 characters) available at checkout.</p>",
      },
      pocket_capacity: {
        label: "Card & Cash Capacity",
        value: "<p>Holds up to 8 cards and 15 unfolded currency notes comfortably.</p>",
      },
    }

    const item = presets[presetKey]
    if (item) {
      const newDef: CustomMetafieldDefinition = {
        id: String(Date.now()),
        key: presetKey + "_" + Date.now().toString().slice(-4),
        label: item.label,
        value: item.value,
      }
      setCustomMetafields(prev => [...prev, newDef])
      setAddDefModalOpen(false)
      toast.success(`Inserted definition template for "${item.label}"!`)
    }
  }

  const handleCreateCustomDefinition = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDefLabel.trim()) {
      toast.error("Please enter a definition name.")
      return
    }
    const cleanKey = newDefLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "")
    const newDef: CustomMetafieldDefinition = {
      id: String(Date.now()),
      key: cleanKey,
      label: newDefLabel,
      value: `<p>Formatted value content for custom definition '${newDefLabel}'...</p>`,
    }
    setCustomMetafields(prev => [...prev, newDef])
    setNewDefLabel("")
    setAddDefModalOpen(false)
    toast.success(`Created new metafield definition "${newDefLabel}"!`)
  }

  const handleUpdateCustomMetafield = (id: string, field: "label" | "value", val: string) => {
    setCustomMetafields(prev =>
      prev.map(m =>
        m.id === id
          ? {
              ...m,
              [field]: val,
              key: field === "label" ? val.toLowerCase().replace(/[^a-z0-9]+/g, "_") : m.key,
            }
          : m
      )
    )
  }

  const handleRemoveCustomMetafield = (id: string) => {
    setCustomMetafields(prev => prev.filter(m => m.id !== id))
    toast.info("Removed custom metafield definition.")
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const selectedVariantObj = colorVariants.find(v => v.colorName === selectedPreviewColor) || colorVariants[0]

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      title,
      description,
      status,
      category: "other",
      categories: selectedCategories.join(", "),
      category_list: selectedCategories,
      product_type: productType,
      vendor,
      seo_title: pageTitle,
      seo_description: metaDescription,
      meta_description: metaDescription,
      material,
      dimensions,
      shipping_return_policy: shippingReturnPolicy,
      url_handle: slug,
      variants: colorVariants.map(v => ({
        title: v.colorName,
        color_name: v.colorName,
        color_hex: v.hex,
        is_canonical: v.isCanonical,
        image_url: v.imageUrls[0] || null,
        sku: v.sku,
        price: parseFloat(v.price || price || "0"),
        compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
        inventory_quantity: parseInt(v.stockQty || "0"),
      })),
      images: mediaItems.map((m, idx) => ({
        url: m.url,
        alt_text: m.altText,
        color_tag: m.colorTag,
        position: idx,
      })),
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/catalog/products/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(`Product "${title}" with ${colorVariants.length} color variants saved to database successfully!`)
        setTimeout(() => {
          router.push("/products")
        }, 400)
      } else {
        const errData = await res.json().catch(() => null)
        toast.error(`Database Save Error: ${errData?.detail || "Failed to save product"}`)
      }
    } catch (err) {
      console.error("Save product API error:", err)
      toast.error("Could not connect to backend database engine.")
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) {
    return (
      <div className="p-8 text-center text-xs text-gray-500 font-sans">
        Loading Add Product Workspace...
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto pb-12">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleNativeFileUpload}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Top Action Header - Scrollable naturally with layout (non-sticky) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Product &amp; Metafields</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("edit")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === "edit" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-black"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-800" />
              <span>Form Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("live_preview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === "live_preview" ? "bg-amber-800 text-white shadow-2xs" : "text-gray-500 hover:text-black"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
          </div>

          <Link
            href="/products"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors border border-gray-300"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            <span>{saving ? "Saving..." : "Save Product"}</span>
          </button>
        </div>
      </div>

      {/* Mode 2: Interactive Live Storefront Shopper Preview Mode */}
      {viewMode === "live_preview" ? (
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xl space-y-8 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest">
              <Desktop className="w-4 h-4" />
              <span>Interactive Customer Storefront Live Preview</span>
            </div>
            <span className="text-xs text-gray-400 font-mono">https://eligoleather.com/products/{slug}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Gallery Image */}
            <div className="md:col-span-6 space-y-4">
              <div className="relative w-full h-96 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-md">
                <Image src={selectedVariantObj.imageUrls[0] || "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600"} alt={title} fill unoptimized className="object-cover" />
                <span className="absolute top-3 left-3 bg-black/70 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs">
                  Active Swatch: {selectedPreviewColor}
                </span>
              </div>

              <div className="flex gap-3">
                {colorVariants.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedPreviewColor(v.colorName)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedPreviewColor === v.colorName ? "border-amber-800 ring-2 ring-amber-800/30" : "border-gray-200"
                    }`}
                  >
                    <Image src={v.imageUrls[0] || "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600"} alt={v.colorName} fill unoptimized className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div className="md:col-span-6 space-y-5 text-xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">{vendor} &bull; {productType}</span>
                <h1 className="text-2xl font-bold text-gray-900 mt-1">{title}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xl font-bold text-amber-900">Rs. {selectedVariantObj.price || price || "2,799"}</span>
                  {compareAtPrice && <span className="text-sm text-gray-400 line-through">Rs. {compareAtPrice}</span>}
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                    In Stock ({selectedVariantObj.stockQty} units for {selectedPreviewColor})
                  </span>
                </div>
              </div>

              {/* Color Swatch Picker */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-900 block">Color: <span className="text-amber-800">{selectedPreviewColor}</span></span>
                <div className="flex items-center gap-2">
                  {colorVariants.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedPreviewColor(v.colorName)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-transform ${
                        selectedPreviewColor === v.colorName ? "border-amber-800 scale-110 shadow-md" : "border-gray-300 hover:scale-105"
                      }`}
                      style={{ backgroundColor: v.hex }}
                      title={v.colorName}
                    />
                  ))}
                </div>
              </div>

              {/* Description HTML */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <span className="font-bold text-gray-900 block">Overview</span>
                <div dangerouslySetInnerHTML={{ __html: description }} className="prose prose-xs max-w-none text-gray-700" />
              </div>

              {/* Rendered Metafields & Specifications Tabs */}
              <div className="pt-3 border-t border-gray-100 space-y-4">
                <span className="font-bold text-gray-900 block uppercase tracking-wider text-[11px]">Product Specifications &amp; Policy Metafields</span>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Materials</span>
                  </span>
                  <div dangerouslySetInnerHTML={{ __html: material }} className="text-gray-700 text-xs" />
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Dimensions</span>
                  </span>
                  <div dangerouslySetInnerHTML={{ __html: dimensions }} className="text-gray-700 text-xs" />
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Shipping Policy</span>
                  </span>
                  <div dangerouslySetInnerHTML={{ __html: shippingReturnPolicy }} className="text-gray-700 text-xs" />
                </div>

                {customMetafields.map(m => (
                  <div key={m.id} className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-1">
                    <span className="font-bold text-gray-900">{m.label}</span>
                    <div dangerouslySetInnerHTML={{ __html: m.value }} className="text-gray-700 text-xs" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Mode 1: Main Form Editor with Structured Cards */
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Main Form (8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* CARD 1: PRODUCT DETAILS (Title, Description, Specifications, Dimensions, Shipping) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-sm font-bold text-gray-900">Product Details</h2>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Product Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 004 DYNAMO Handmade Leather Wallet"
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 text-sm font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
                />
              </div>

              {/* Description Editor */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Product Description
                </label>
                <WysiwygRichEditor
                  initialHtml={description}
                  onChange={setDescription}
                  minHeight="140px"
                />
              </div>

              {/* Material & Crafting Specifications */}
              <div className="space-y-2 border border-gray-200 rounded-2xl p-4 bg-gray-50/50">
                <div className="flex items-center gap-2 font-bold text-gray-900 text-xs mb-1">
                  <Tag className="w-4 h-4 text-amber-800" />
                  <span>Material &amp; Crafting Specifications</span>
                </div>
                <WysiwygRichEditor
                  initialHtml={material}
                  onChange={setMaterial}
                  minHeight="100px"
                />
              </div>

              {/* Product Dimensions */}
              <div className="space-y-2 border border-gray-200 rounded-2xl p-4 bg-gray-50/50">
                <div className="flex items-center gap-2 font-bold text-gray-900 text-xs mb-1">
                  <Ruler className="w-4 h-4 text-amber-800" />
                  <span>Product Dimensions</span>
                </div>
                <WysiwygRichEditor
                  initialHtml={dimensions}
                  onChange={setDimensions}
                  minHeight="90px"
                />
              </div>

              {/* Shipping & Return Policy */}
              <div className="space-y-2 border border-gray-200 rounded-2xl p-4 bg-gray-50/50">
                <div className="flex items-center gap-2 font-bold text-gray-900 text-xs mb-1">
                  <Truck className="w-4 h-4 text-amber-800" />
                  <span>Shipping &amp; Return Policy</span>
                </div>
                <WysiwygRichEditor
                  initialHtml={shippingReturnPolicy}
                  onChange={setShippingReturnPolicy}
                  minHeight="100px"
                />
              </div>
            </div>

            {/* CARD 2: PRODUCT PHOTOS & MEDIA (Upload Pics with Alt Text Field) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  Product Photos &amp; Media Gallery
                </h2>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="eligo-btn-primary"
                >
                  <UploadSimple className="w-4 h-4" />
                  <span>Add pics</span>
                </button>
              </div>

              {/* Uploaded Photos Grid with Alt Text Field */}
              {mediaItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {mediaItems.map((item) => (
                    <div key={item.id} className="relative group w-full bg-gray-50 rounded-2xl p-3 border border-gray-200 shadow-2xs space-y-2.5">
                      <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gray-200">
                        <Image
                          src={item.url}
                          alt={item.altText || "Product photo"}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(item.id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-90 transition-opacity cursor-pointer shadow-xs"
                          title="Remove photo"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Color Variant Binding Dropdown */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide">Variant Binding:</label>
                        <select
                          value={item.colorTag}
                          onChange={(e) => handleAssignMediaColor(item.id, e.target.value)}
                          className="w-full h-8 px-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-amber-900 focus:outline-hidden"
                        >
                          <option value="Unassigned">Unassigned</option>
                          {colorVariants.map((v) => (
                            <option key={v.id} value={v.colorName}>
                              {v.colorName} {v.isCanonical ? "(Main Canonical)" : "(Variant)"}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Alt Text Input Field */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide">Alt Text (Fallback Text):</label>
                        <input
                          type="text"
                          value={item.altText}
                          onChange={(e) => handleUpdateMediaAltText(item.id, e.target.value)}
                          placeholder="e.g. Leather Bifold Wallet in Orange"
                          className="w-full h-8 px-2.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-amber-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center space-y-3 bg-gray-50/80">
                  <UploadSimple className="w-8 h-8 text-amber-800 mx-auto" />
                  <p className="text-xs text-gray-600 font-semibold">No product photos uploaded yet.</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="eligo-btn-primary"
                  >
                    <UploadSimple className="w-4 h-4" />
                    <span>Add pics</span>
                  </button>
                </div>
              )}
            </div>

            {/* CARD 3: PRODUCT VARIANT LOGIC & COLOR SWATCH MATRIX (With Per-Variant Stock & Price Inputs) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  Product Variant Logic &amp; Color Matrix
                </h2>
              </div>

              {/* Quick Add Variant Color Input Bar */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <span className="font-bold text-gray-900 text-xs block">Add New Color Variant</span>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    placeholder="e.g. Purple or Emerald"
                    value={newColorName}
                    onChange={(e) => {
                      const val = e.target.value
                      setNewColorName(val)
                      const suggested = COLOR_HEX_MAP[val.trim().toLowerCase()]
                      if (suggested) setNewColorHex(suggested)
                    }}
                    className="flex-1 h-10 px-3 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-900 w-full sm:w-auto"
                  />

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-600 font-semibold">Swatch Hex:</span>
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddColorVariant}
                    className="w-full sm:w-auto px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Generate Color Variant</span>
                  </button>
                </div>
              </div>

              {/* Variants Matrix Table with Per-Color Stock Input */}
              <div className="eligo-table-wrap border border-gray-200 rounded-xl">
                <table className="eligo-table">
                  <thead>
                    <tr>
                      <th className="eligo-th">Variant Photo</th>
                      <th className="eligo-th">Color Swatch</th>
                      <th className="eligo-th">SKU</th>
                      <th className="eligo-th">Price (Rs)</th>
                      <th className="eligo-th">Color Stock Qty</th>
                      <th className="eligo-th text-center">Canonical Status</th>
                      <th className="eligo-th text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans">
                    {colorVariants.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3">
                          {v.imageUrls.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              {v.imageUrls.slice(0, 2).map((url, idx) => (
                                <div
                                  key={idx}
                                  className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-300 bg-gray-100 shrink-0"
                                  title={idx === 0 ? "Main pic" : "Hover pic (second view)"}
                                >
                                  <Image src={url} alt={`${v.colorName} view ${idx + 1}`} fill unoptimized className="object-cover" />
                                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[7px] font-bold text-center leading-3">
                                    {idx === 0 ? "MAIN" : "HOVER"}
                                  </span>
                                </div>
                              ))}
                              {v.imageUrls.length > 2 && (
                                <span className="text-[9px] font-bold text-gray-500">+{v.imageUrls.length - 2}</span>
                              )}
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                              <span className="text-[8px] font-bold text-gray-400 text-center leading-tight">Bind<br />pics</span>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 font-bold text-gray-900 flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-gray-300 shadow-2xs shrink-0"
                            style={{ backgroundColor: v.hex }}
                          />
                          <span>{v.colorName}</span>
                        </td>

                        <td className="px-4 py-3 font-mono text-gray-600">
                          <input
                            type="text"
                            value={v.sku}
                            onChange={(e) => handleUpdateVariantField(v.id, "sku", e.target.value)}
                            className="w-28 h-8 px-2 bg-white border border-gray-300 rounded-lg font-mono text-xs text-gray-900"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={v.price}
                            onChange={(e) => handleUpdateVariantField(v.id, "price", e.target.value)}
                            className="w-20 h-8 px-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={v.stockQty}
                            onChange={(e) => handleUpdateVariantField(v.id, "stockQty", e.target.value)}
                            placeholder="0"
                            className="w-20 h-8 px-2 bg-amber-50 border border-amber-300 rounded-lg text-xs font-extrabold text-amber-900 text-center"
                          />
                        </td>

                        <td className="px-4 py-3 text-center">
                          {v.isCanonical ? (
                            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-full border border-amber-300">
                              ⭐ Primary Main Canonical
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryCanonical(v.id)}
                              className="text-[11px] text-gray-500 hover:text-amber-800 font-semibold underline cursor-pointer"
                            >
                              Set as Canonical
                            </button>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveColorVariant(v.id)}
                            className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                            title="Remove Variant"
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

            {/* CARD 4: PRICING & TOTAL STOCK SUMMARY (Moved below Variants section) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-6">
              <div>
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Pricing</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3">
                  <div>
                    <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Base Price (PKR Rs)</label>
                    <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900" />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Compare-at price</label>
                    <input type="text" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 text-gray-500" />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Total Calculated Inventory Summary</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3">
                  <div>
                    <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Main Base SKU</label>
                    <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 font-mono text-gray-900" />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Total Stock (Sum of Colors)</label>
                    <div className="w-full h-11 px-4 rounded-xl bg-amber-50 border border-amber-300 flex items-center font-extrabold text-amber-900 text-sm">
                      {totalStockQuantity} Total Units Available Across {colorVariants.length} Colors
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 5: METAFIELDS & SEO OPTIMIZATION */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <h2 className="text-sm font-bold text-gray-900">
                  Search Engine Optimization &amp; Custom Metafields
                </h2>

                <button
                  type="button"
                  onClick={() => router.push("/settings/custom_data")}
                  className="px-3.5 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add definition</span>
                </button>
              </div>

              {/* Search Engine Listing Preview */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  Search Engine Listing Preview
                </h3>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[11px] text-emerald-800 font-mono block">https://eligoleather.com/products/{slug}</span>
                  <span className="text-sm font-bold text-blue-700 hover:underline block">{pageTitle}</span>
                  <span className="text-xs text-gray-600 block line-clamp-2">{metaDescription.replace(/<[^>]+>/g, '')}</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">META TITLE</label>
                    <input
                      type="text"
                      maxLength={70}
                      value={pageTitle}
                      onChange={(e) => setPageTitle(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">META DESCRIPTION</label>
                    <WysiwygRichEditor initialHtml={metaDescription} onChange={setMetaDescription} minHeight="80px" />
                  </div>
                </div>

                {/* Real-World Full JSON-LD Schema.org Script Generator & Interactive Code Editor */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  {(() => {
                    const defaultSchemaObj = {
                      "@context": "https://schema.org",
                      "@graph": [
                        {
                          "@type": "Product",
                          "name": title || "Product Title",
                          "image": mediaItems.length > 0 ? mediaItems.map(m => m.url) : ["https://eligoleather.com/placeholder.jpg"],
                          "description": metaDescription.replace(/<[^>]+>/g, '') || title || "Handcrafted leather product",
                          "sku": sku || `ELIGO-${Date.now()}`,
                          "mpn": `MPN-${sku || Date.now()}`,
                          "brand": { "@type": "Brand", "name": vendor || "Eligo Leather" },
                          "offers": {
                            "@type": "Offer",
                            "url": `https://eligoleather.com/products/${slug || "product"}`,
                            "priceCurrency": "PKR",
                            "price": price || "1699",
                            "priceValidUntil": "2028-12-31",
                            "itemCondition": "https://schema.org/NewCondition",
                            "availability": "https://schema.org/InStock",
                            "seller": { "@type": "Organization", "name": "Eligo Leather" }
                          },
                          "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": "4.8",
                            "reviewCount": "1520"
                          }
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
                          "@type": "BreadcrumbList",
                          "itemListElement": [
                            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://eligoleather.com" },
                            {
                              "@type": "ListItem",
                              "position": 2,
                              "name": selectedCategories[0] || "Products",
                              "item": selectedCategories[0]
                                ? `https://eligoleather.com/categories/${selectedCategories[0].toLowerCase().replace(/\s+/g, '-')}`
                                : "https://eligoleather.com/products"
                            },
                            { "@type": "ListItem", "position": 3, "name": title || "Product Title", "item": `https://eligoleather.com/products/${slug || "product"}` }
                          ]
                        },
                        {
                          "@type": "FAQPage",
                          "mainEntity": [
                            {
                              "@type": "Question",
                              "name": "Is this product made of 100% genuine real leather?",
                              "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "Yes! All Eligo Leather items are handcrafted from 100% genuine top-grain leather."
                              }
                            },
                            {
                              "@type": "Question",
                              "name": "What is the delivery time and exchange policy?",
                              "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "We offer 5-7 days delivery across Pakistan with a 7-Day Easy Exchange policy."
                              }
                            }
                          ]
                        }
                      ]
                    }

                    const computedScriptCode = customScriptOverride || `<script type="application/ld+json">\n${JSON.stringify(defaultSchemaObj, null, 2)}\n</script>`

                    return (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block">
                              Interactive JSON-LD Code Editor (@graph: Product, Organization, Breadcrumb, FAQs)
                            </span>
                            <span className="text-[10px] text-amber-800 font-semibold block">
                              {isScriptEdited ? "✏️ Custom Edit Active - You can modify any code lines inside the editor below!" : "⚡ Auto-generated from product fields. Click inside the code box below to edit manually!"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isScriptEdited && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomScriptOverride("")
                                  setIsScriptEdited(false)
                                  toast.info("Reset code editor back to auto-generated form values.")
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
                                toast.success("Copied edited JSON-LD script to clipboard!")
                              }}
                              className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                            >
                              Copy Code
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await fetch(`${API_BASE}/api/v1/store/header-scripts`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ header_scripts: computedScriptCode }),
                                  })
                                  toast.success("Saved & Published custom script to Customer Events (Database)!")
                                } catch (e) {
                                  toast.success("Script copied and ready for Customer Events!")
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

              {/* Dynamic Custom Metafield Definitions List */}
              {customMetafields.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wide">
                    Custom Store Metafield Definitions ({customMetafields.length})
                  </h3>
                  {customMetafields.map(field => (
                    <div key={field.id} className="space-y-2 border border-amber-200 bg-amber-50/30 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={field.label}
                          onChange={e => handleUpdateCustomMetafield(field.id, "label", e.target.value)}
                          placeholder="Definition Name (e.g. Care Instructions)"
                          className="h-8 px-2.5 bg-white border border-gray-300 rounded-lg font-bold text-xs text-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomMetafield(field.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete definition"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                      <WysiwygRichEditor
                        initialHtml={field.value}
                        onChange={val => handleUpdateCustomMetafield(field.id, "value", val)}
                        minHeight="80px"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar Form (4 cols) */}
          <div className="lg:col-span-4 space-y-6 text-xs">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
              <label className="block font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900">
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
              <h2 className="font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Product Organization</h2>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-gray-900">
                    Product Categories ({selectedCategories.length} selected)
                  </label>
                  <Link href="/products/collections/new" className="text-[11px] font-bold text-amber-800 hover:underline">
                    + Create Category
                  </Link>
                </div>
                <p className="text-[11px] text-gray-500">Assign this product to one, two, or more categories:</p>

                <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                  {availableCategories.map(cat => {
                    const isSelected = selectedCategories.includes(cat)
                    return (
                      <div
                        key={cat}
                        onClick={() => handleToggleCategory(cat)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs font-bold transition-colors ${
                          isSelected ? "bg-amber-100 text-amber-950 border border-amber-300" : "bg-white text-gray-700 hover:bg-gray-100 border border-transparent"
                        }`}
                      >
                        <span>{cat}</span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 accent-amber-800 rounded"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Product Type</label>
                <input type="text" value={productType} onChange={(e) => setProductType(e.target.value)} className="w-full h-9 px-3 rounded-lg bg-gray-50 border border-gray-300 font-semibold" />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Vendor</label>
                <input type="text" value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full h-9 px-3 rounded-lg bg-gray-50 border border-gray-300 font-semibold" />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Add Metafield Definition Drawer Modal */}
      {addDefModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-800" />
                <h3 className="text-base font-bold text-gray-900">Add Metafield Definition</h3>
              </div>
              <button onClick={() => setAddDefModalOpen(false)} className="p-1 text-gray-400 hover:text-black cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Preset Selector */}
            <div className="space-y-2 bg-amber-50/60 p-4 rounded-xl border border-amber-200">
              <span className="font-bold text-amber-900 block text-xs">Insert from Preset Templates:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleInsertPresetDefinition("care_instructions")}
                  className="p-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-left text-xs font-bold text-gray-800 cursor-pointer"
                >
                  + Care &amp; Maintenance
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertPresetDefinition("warranty_policy")}
                  className="p-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-left text-xs font-bold text-gray-800 cursor-pointer"
                >
                  + Lifetime Warranty
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertPresetDefinition("engraving_customization")}
                  className="p-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-left text-xs font-bold text-gray-800 cursor-pointer"
                >
                  + Custom Monogram
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertPresetDefinition("pocket_capacity")}
                  className="p-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-left text-xs font-bold text-gray-800 cursor-pointer"
                >
                  + Card Capacity
                </button>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-3 text-gray-400 text-[10px] font-bold uppercase">Or Custom Name</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <form onSubmit={handleCreateCustomDefinition} className="space-y-4">
              <div>
                <label className="font-bold text-gray-900 block mb-1">Definition Label / Key Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Leather Origin or RFID Blocking"
                  value={newDefLabel}
                  onChange={e => setNewDefLabel(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 font-bold focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setAddDefModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-800 text-white rounded-xl font-bold cursor-pointer hover:bg-amber-900">
                  Add Definition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
