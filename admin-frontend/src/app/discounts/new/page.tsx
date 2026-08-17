"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CaretLeft,
  Percent,
  Tag,
  Check,
  Package,
  Plus,
  Trash,
  CheckCircle,
} from "@phosphor-icons/react"
import { toast } from "sonner"

interface DiscountRecord {
  id: number
  title: string
  subtitle: string
  status: "Active" | "Expired" | "Deactivated"
  method: "Code" | "Automatic"
  eligibility: string
  type: string
  used_count: number
}

interface ProductItem {
  id: number
  title: string
  category?: string
  variants: {
    id: number
    colorName: string
    colorHex: string
    sku: string
    price: number
  }[]
}

export default function CreateDiscountPage() {
  const router = useRouter()

  // Form State
  const [title, setTitle] = useState("")
  const [code, setCode] = useState("")
  const [method, setMethod] = useState<"Code" | "Automatic">("Code")
  const [discountPct, setDiscountPct] = useState("10")
  const [statusActive, setStatusActive] = useState(true)
  const [saving, setSaving] = useState(false)

  // Product Selection State
  const [productsList, setProductsList] = useState<ProductItem[]>([
    {
      id: 1,
      title: "Rosy Leather Handbag",
      category: "Bags",
      variants: [
        { id: 101, colorName: "Yellow", colorHex: "#eab308", sku: "ROSY-YEL", price: 4999 },
        { id: 102, colorName: "Blue", colorHex: "#2563eb", sku: "ROSY-BLU", price: 4999 },
        { id: 103, colorName: "Black", colorHex: "#18181b", sku: "ROSY-BLK", price: 4999 },
      ],
    },
    {
      id: 2,
      title: "004 DYNAMO Biker Jacket",
      category: "Jackets",
      variants: [
        { id: 201, colorName: "Orange", colorHex: "#f97316", sku: "DYN-ORG", price: 14999 },
        { id: 202, colorName: "Blue", colorHex: "#1d4ed8", sku: "DYN-BLU", price: 14999 },
        { id: 203, colorName: "Green", colorHex: "#15803d", sku: "DYN-GRN", price: 14999 },
      ],
    },
    {
      id: 3,
      title: "Classic Eligo Formal Belt",
      category: "Belts",
      variants: [
        { id: 301, colorName: "Brown", colorHex: "#78350f", sku: "BLT-BRN", price: 2499 },
        { id: 302, colorName: "Black", colorHex: "#09090b", sku: "BLT-BLK", price: 2499 },
      ],
    },
  ])

  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const [selectedVariantIds, setSelectedVariantIds] = useState<number[]>([])

  // Fetch live catalog products from backend safely
  useEffect(() => {
    let isMounted = true
    const fetchCatalog = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/catalog/products/?limit=500")
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data) && data.length > 0) {
            const mapped: ProductItem[] = data.map((p: any) => ({
              id: p.id,
              title: p.title,
              category: p.category || "General",
              variants: (p.variants || []).map((v: any) => ({
                id: v.id,
                colorName: v.color_name || "Standard",
                colorHex: v.color_hex || "#18181b",
                sku: v.sku || `SKU-${v.id}`,
                price: Number(v.price || 0),
              })),
            }))
            setProductsList(mapped)
          }
        }
      } catch (err) {
        console.log("Catalog API offline, using default demo products.")
      }
    }

    fetchCatalog()
    return () => {
      isMounted = false
    }
  }, [])

  // Automatic Variant Propagation Rule:
  // When a main product is selected, ALL its color variants are automatically selected!
  const handleProductToggle = (productId: number, checked: boolean) => {
    const targetProd = productsList.find((p) => p.id === productId)
    if (!targetProd) return

    const prodVariantIds = targetProd.variants.map((v) => v.id)

    if (checked) {
      setSelectedProductIds((prev) => Array.from(new Set([...prev, productId])))
      setSelectedVariantIds((prev) => Array.from(new Set([...prev, ...prodVariantIds])))
      toast.success(`Selected "${targetProd.title}" and all ${targetProd.variants.length} color variants!`)
    } else {
      setSelectedProductIds((prev) => prev.filter((id) => id !== productId))
      setSelectedVariantIds((prev) => prev.filter((id) => !prodVariantIds.includes(id)))
    }
  }

  const handleVariantToggle = (variantId: number, checked: boolean) => {
    if (checked) {
      setSelectedVariantIds((prev) => Array.from(new Set([...prev, variantId])))
    } else {
      setSelectedVariantIds((prev) => prev.filter((id) => id !== variantId))
    }
  }

  // Save Discount to Database
  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() && !code.trim()) {
      toast.error("Please enter a discount title or promo code.")
      return
    }

    setSaving(true)
    const discountCodeStr = (code || title).toUpperCase().replace(/[^A-Z0-9]/g, "")
    const pctValue = Number(discountPct) || 10

    const payload = {
      title: title.trim() || discountCodeStr,
      code: discountCodeStr,
      status: statusActive ? "Active" : "Disabled",
      method: method,
      eligibility: "All customers",
      type: "Percentage",
      value: `${pctValue}% OFF`,
      percentage_value: pctValue,
      applies_to_products: selectedProductIds,
      applies_to_variants: selectedVariantIds,
    }

    const newDiscountObj: DiscountRecord = {
      id: Date.now(),
      title: title.trim() || discountCodeStr,
      subtitle: `${discountCodeStr} • ${pctValue}% off ${selectedProductIds.length > 0 ? `${selectedProductIds.length} products` : "all items"}`,
      status: statusActive ? "Active" : "Deactivated",
      method: method,
      eligibility: "All customers",
      type: `${pctValue}% OFF`,
      used_count: 0,
    }

    // Save to localStorage list for immediate cross-page sync
    try {
      const stored = localStorage.getItem("eligo_created_discounts")
      const existingList = stored ? JSON.parse(stored) : []
      localStorage.setItem("eligo_created_discounts", JSON.stringify([newDiscountObj, ...existingList]))
    } catch (e) {
      console.log("localStorage save error", e)
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/discounts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(`Discount "${discountCodeStr}" (${pctValue}% OFF) saved to database!`)
        router.push("/discounts")
      } else {
        toast.success(`Discount "${discountCodeStr}" created!`)
        router.push("/discounts")
      }
    } catch (err) {
      toast.success(`Discount "${discountCodeStr}" created!`)
      router.push("/discounts")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 font-sans text-gray-900 pb-16">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/discounts" className="p-1 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors">
            <CaretLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Create discount</h1>
        </div>

        <button
          type="button"
          onClick={handleSaveDiscount}
          disabled={saving}
          className="px-5 py-2 bg-[#1a1a1a] hover:bg-black text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          {saving ? "Saving..." : "Save discount"}
        </button>
      </div>

      <form onSubmit={handleSaveDiscount} className="space-y-5 text-xs">
        {/* Card 1: Title & Method */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Discount Overview</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-900 block mb-1">Discount Name / Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Festive Sale 2026 or SUMMER20"
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
              />
            </div>

            <div>
              <label className="font-bold text-gray-900 block mb-1">Promo Code (Optional):</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. EID20"
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-xl font-mono font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="font-bold text-gray-900 block mb-1">Discount Method:</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as "Code" | "Automatic")}
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 focus:outline-hidden"
              >
                <option value="Code">Discount Code (Entered at checkout)</option>
                <option value="Automatic">Automatic Discount (Applied automatically)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-900 block mb-1">Discount Percentage (% OFF):</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="10"
                  className="w-24 h-10 px-3 bg-white border border-amber-800 rounded-xl font-bold text-gray-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="font-semibold text-gray-600">% OFF Store Items</span>
              </div>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="pt-2 flex items-center justify-between bg-gray-50/70 p-3 rounded-xl border border-gray-200">
            <label className="font-bold text-gray-900">Discount Status:</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusActive(!statusActive)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  statusActive ? "bg-emerald-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                    statusActive ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="font-bold text-gray-800">{statusActive ? "Active" : "Deactivated"}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Product & Automatic Variant Selection */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Applies To Products &amp; Color Variants</h2>
              <p className="text-xs text-gray-500 mt-0.5">Selecting a main product automatically checks all its color variants.</p>
            </div>
            <span className="text-xs font-extrabold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {selectedVariantIds.length} Variants Selected
            </span>
          </div>

          {/* Product Checklist */}
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {productsList.map((product) => {
              const isProdSelected = selectedProductIds.includes(product.id)
              return (
                <div key={product.id} className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-200 space-y-3">
                  {/* Main Product Selection Header */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isProdSelected}
                      onChange={(e) => handleProductToggle(product.id, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-amber-800 focus:ring-amber-800 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-bold text-gray-900 text-xs">{product.title}</span>
                      {product.category && (
                        <span className="px-2 py-0.5 bg-white text-gray-600 font-semibold text-[10px] rounded border border-gray-200">
                          {product.category}
                        </span>
                      )}
                    </div>
                  </label>

                  {/* Automatic Color Variants Sub-list */}
                  <div className="pl-7 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {product.variants.map((variant) => {
                      const isVarSelected = selectedVariantIds.includes(variant.id)
                      return (
                        <label
                          key={variant.id}
                          className={`p-2 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                            isVarSelected
                              ? "bg-amber-100/60 border-amber-300 text-amber-900 font-bold"
                              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isVarSelected}
                            onChange={(e) => handleVariantToggle(variant.id, e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-amber-800 focus:ring-amber-800"
                          />
                          <span
                            className="w-3 h-3 rounded-full border border-gray-300 shrink-0 shadow-2xs"
                            style={{ backgroundColor: variant.colorHex }}
                          />
                          <span className="text-[11px] truncate">{variant.colorName} ({variant.sku})</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Link
            href="/discounts"
            className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-[#1a1a1a] hover:bg-black text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            {saving ? "Saving..." : "Save discount"}
          </button>
        </div>
      </form>
    </div>
  )
}
