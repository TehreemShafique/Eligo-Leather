"use client"

import { API_BASE } from "@/lib/api"

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || ""

import { useState, useRef, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  UploadSimple,
  Plus,
  Trash,
  Gift,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { LexicalEditor } from "@/components/ui/lexical-editor"
import { CharCounter } from "@/components/ui/char-counter"

interface MediaItem {
  id: number
  url: string
  altText: string
}

interface ProductItem {
  id: number
  title: string
  status: string
  category: string
  image_url: string | null
  price: number | null
}

export default function AdminNewGiftCardProductPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)

  // Gift Card Code
  const [giftCardCode, setGiftCardCode] = useState("")

  // Slug
  const [slugInput, setSlugInput] = useState("")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("Active")

  // Pricing
  const [basePrice, setBasePrice] = useState("")
  const [compareAtPrice, setCompareAtPrice] = useState("")

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])

  const [pageTitle, setPageTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")

  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])

  useEffect(() => {
    setMounted(true)
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/catalog/products/?limit=200`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            setAvailableProducts(data.map((p: any) => ({
              id: p.id,
              title: p.title,
              status: p.status,
              category: p.category,
              image_url: p.image_url,
              price: p.price,
            })))
          }
        }
      } catch (err) {}
    }
    fetchProducts()
  }, [])

  // Auto-calculate compare-at price from selected products
  useEffect(() => {
    if (selectedProductIds.length === 0) {
      setCompareAtPrice("")
      return
    }
    const total = selectedProductIds.reduce((sum, pid) => {
      const product = availableProducts.find(p => p.id === pid)
      return sum + (product?.price || 0)
    }, 0)
    setCompareAtPrice(total > 0 ? String(total) : "")
  }, [selectedProductIds, availableProducts])

  const handleToggleProduct = (id: number) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    )
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
        altText: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      })
    })

    setMediaItems(prev => [...prev, ...newMediaItems])
    toast.success(`${files.length} photo(s) added!`)
  }

  const handleRemoveMedia = (mediaId: number) => {
    setMediaItems(prev => prev.filter(m => m.id !== mediaId))
  }

  const handleUpdateMediaAltText = (mediaId: number, altText: string) => {
    setMediaItems(prev => prev.map(m => m.id === mediaId ? { ...m, altText } : m))
  }

  const slug = slugInput
    ? slugInput.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    : title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  // Discount calculation
  const discountAmount = useMemo(() => {
    const bp = parseFloat(basePrice) || 0
    const cp = parseFloat(compareAtPrice) || 0
    if (cp > 0 && bp > 0 && cp > bp) return cp - bp
    return 0
  }, [basePrice, compareAtPrice])

  const discountPercent = useMemo(() => {
    const cp = parseFloat(compareAtPrice) || 0
    if (cp > 0 && discountAmount > 0) return Math.round((discountAmount / cp) * 100)
    return 0
  }, [compareAtPrice, discountAmount])

  const selectedProductsTotal = useMemo(() => {
    return selectedProductIds.reduce((sum, pid) => {
      const product = availableProducts.find(p => p.id === pid)
      return sum + (product?.price || 0)
    }, 0)
  }, [selectedProductIds, availableProducts])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      code: giftCardCode || null,
      title,
      description,
      status,
      base_price: parseFloat(basePrice) || 0,
      compare_at_price: parseFloat(compareAtPrice) || 0,
      seo_title: pageTitle,
      seo_description: metaDescription,
      meta_description: metaDescription,
      url_handle: slug || null,
      product_ids: selectedProductIds.join(","),
      images: mediaItems.map((m, idx) => ({
        url: m.url,
        alt_text: m.altText,
        position: idx,
      })),
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/catalog/gift-card-products/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(`Gift card product "${title}" saved to database successfully!`)
        setTimeout(() => {
          router.push("/products/gift-cards")
        }, 400)
      } else {
        const errData = await res.json().catch(() => null)
        toast.error(`Database Save Error: ${errData?.detail || "Failed to save gift card product"}`)
      }
    } catch (err) {
      console.error("Save gift card product API error:", err)
      toast.error("Could not connect to backend database engine.")
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) {
    return (
      <div className="p-8 text-center text-xs text-gray-500 font-sans">
        Loading Add Gift Card Product Workspace...
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

      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/products/gift-cards"
            className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Gift Card Product</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products/gift-cards"
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
            <span>{saving ? "Saving..." : "Save Gift Card Product"}</span>
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Main Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* CARD 1: GIFT CARD PRODUCT DETAILS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900">Gift Card Product Details</h2>
            </div>

            {/* Gift Card Code */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Gift Card Code</label>
              <input
                type="text"
                value={giftCardCode}
                onChange={(e) => setGiftCardCode(e.target.value)}
                placeholder="e.g. GC-2026-ELIGO"
                className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 text-sm font-bold text-gray-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
              />
              <p className="text-[10px] text-gray-400">Optional unique code for this gift card product.</p>
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Slug / URL Handle</label>
              <div className="flex items-center gap-0">
                {STORE_URL && <span className="h-11 px-3 bg-gray-100 border border-gray-300 border-r-0 rounded-l-xl text-[11px] text-gray-500 font-mono flex items-center shrink-0">{STORE_URL.replace(/\/$/, "")}/</span>}
                <input
                  type="text"
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  placeholder={title ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : "gift-card-slug"}
                  className={`${STORE_URL ? "rounded-r-xl" : "rounded-xl"} flex-1 h-11 px-4 bg-gray-50 border border-gray-300 font-mono text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/40`}
                />
              </div>
              <p className="text-[10px] text-gray-400">Leave blank to auto-generate from title. Preview: <span className="font-mono text-gray-600">{STORE_URL ? `${STORE_URL.replace(/\/$/, "")}/` : "/"}{slug || "..."}</span></p>
            </div>

            {/* Title Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Gift Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Eligo Leather Gift Card"
                className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 text-sm font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
              />
            </div>

            {/* Description Editor */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Gift Description
              </label>
              <LexicalEditor
                value={description}
                onChange={setDescription}
                minHeight="140px"
              />
            </div>
          </div>

          {/* CARD 2: PRODUCT PHOTOS & MEDIA */}
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

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide">Alt Text (Fallback Text):</label>
                      <input
                        type="text"
                        value={item.altText}
                        onChange={(e) => handleUpdateMediaAltText(item.id, e.target.value)}
                        placeholder="e.g. Gift Card Design"
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

          {/* CARD 3: PRODUCT SELECTION (Checkboxes) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  Product Selection ({selectedProductIds.length} selected)
                </h2>
                <p className="text-[11px] text-gray-500 mt-1">Select products associated with this gift card. Compare-at price auto-syncs with selected product totals.</p>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">{availableProducts.length} total products</span>
            </div>

            {availableProducts.length > 0 ? (
              <div className="space-y-1.5 max-h-96 overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-200">
                {availableProducts.map((product) => {
                  const isSelected = selectedProductIds.includes(product.id)
                  return (
                    <div
                      key={product.id}
                      onClick={() => handleToggleProduct(product.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer text-xs font-bold transition-colors ${
                        isSelected ? "bg-amber-100 text-amber-950 border border-amber-300" : "bg-white text-gray-700 hover:bg-gray-100 border border-transparent"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.title}
                            width={40}
                            height={40}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Gift className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="block text-xs font-bold text-gray-900 truncate">{product.title}</span>
                        <span className="block text-[10px] text-gray-500">
                          {product.category} &bull; {product.status}
                          {product.price ? ` \u2022 Rs. ${product.price.toLocaleString()}` : ""}
                        </span>
                      </div>

                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 accent-amber-800 rounded shrink-0"
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-500 font-semibold">
                Loading products from database...
              </div>
            )}
          </div>

          {/* CARD 4: SEARCH ENGINE LISTING & SEO */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900">
                Search Engine Optimization
              </h2>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                Search Engine Listing Preview
              </h3>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="text-[10px] text-gray-500 font-sans block">Eligo Leather</span>
                <span className="text-[11px] text-emerald-800 font-mono block">https://eligoleather.com &rsaquo; products &rsaquo; {slug || "your-url-handle"}</span>
                <span className="text-sm font-bold text-blue-700 hover:underline block">{pageTitle || "Page Title"}</span>
                <span className="text-xs text-gray-600 block line-clamp-2">{(metaDescription || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#\d+;/g, "").trim() || "Meta description will appear here..."}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">META TITLE</label>
                    <CharCounter value={pageTitle} limit={60} />
                  </div>
                  <input
                    type="text"
                    maxLength={60}
                    value={pageTitle}
                    onChange={(e) => setPageTitle(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 font-semibold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">META DESCRIPTION</label>
                    <CharCounter value={metaDescription} limit={160} />
                  </div>
                  <LexicalEditor value={metaDescription} onChange={setMetaDescription} minHeight="80px" />
                </div>

                <div className="pt-2">
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">URL HANDLE</label>
                  <div className="flex items-center gap-0">
                    {STORE_URL && <span className="h-10 px-3 bg-gray-100 border border-gray-300 border-r-0 rounded-l-xl text-[11px] text-gray-500 font-mono flex items-center">{STORE_URL.replace(/\/$/, "")}/</span>}
                    <input
                      type="text"
                      value={slugInput}
                      onChange={(e) => setSlugInput(e.target.value)}
                      placeholder={title ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : "gift-card-slug"}
                      className={`${STORE_URL ? "rounded-r-xl" : "rounded-xl"} flex-1 h-10 px-3 bg-gray-50 border border-gray-300 font-mono text-xs text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-amber-800`}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Mirrors the slug field above. The preview updates in real-time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6 text-xs">
          {/* Status */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <label className="block font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900">
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* Pricing Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-5">
            <h2 className="font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 text-xs">Pricing</h2>

            {/* Base Price */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-gray-700 uppercase tracking-wide text-[11px]">Base Price (PKR Rs)</label>
              <input
                type="text"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="e.g. 3800"
                className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
              />
              <p className="text-[10px] text-gray-400">The price the customer pays for this gift card.</p>
            </div>

            {/* Compare-at Price (auto-synced from selected products) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-gray-700 uppercase tracking-wide text-[11px]">Compare-at Price</label>
                {selectedProductIds.length > 0 && (
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Auto-synced from {selectedProductIds.length} product{selectedProductIds.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  placeholder="e.g. 4500"
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
                />
                {parseFloat(compareAtPrice) > 0 && parseFloat(basePrice) > 0 && parseFloat(compareAtPrice) > parseFloat(basePrice) && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                    Rs. {discountAmount.toLocaleString()} OFF
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400">Total value of selected products. Auto-calculated when products are checked above.</p>
            </div>

            {/* Discount Summary */}
            {discountPercent > 0 && (
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Store Discount</span>
                  <span className="text-lg font-extrabold text-emerald-700">{discountPercent}% OFF</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-gray-500">You pay:</span>
                  <span className="font-extrabold text-amber-900">Rs. {(parseFloat(basePrice) || 0).toLocaleString()}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">Worth:</span>
                  <span className="font-bold text-gray-400 line-through">Rs. {(parseFloat(compareAtPrice) || 0).toLocaleString()}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">Save:</span>
                  <span className="font-extrabold text-emerald-700">Rs. {discountAmount.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all"
                    style={{ width: `${discountPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Summary Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Summary</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Products Selected</span>
                <span className="font-bold text-amber-900">{selectedProductIds.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Products Total</span>
                <span className="font-bold text-gray-900">Rs. {selectedProductsTotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Media Items</span>
                <span className="font-bold text-amber-900">{mediaItems.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">URL Handle</span>
                <span className="font-mono text-[10px] text-gray-500 truncate max-w-[120px]">{STORE_URL ? `${STORE_URL.replace(/\/$/, "")}/` : "/"}{slug || "auto"}</span>
              </div>
              {giftCardCode && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Code</span>
                  <span className="font-mono text-[10px] text-amber-800 font-bold">{giftCardCode}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
