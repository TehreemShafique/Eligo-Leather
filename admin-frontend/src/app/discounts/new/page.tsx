"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Ticket, Percent, CheckCircle, Sliders } from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminNewDiscountPage() {
  const router = useRouter()
  const [method, setMethod] = useState<"Code" | "Automatic">("Code")
  const [code, setCode] = useState("")
  const [title, setTitle] = useState("")
  const [discountType, setDiscountType] = useState<"Percentage" | "Fixed amount" | "Free shipping">("Percentage")
  const [discountValue, setDiscountValue] = useState("15")
  const [eligibility, setEligibility] = useState("All customers")
  const [combineProduct, setCombineProduct] = useState(true)
  const [combineShipping, setCombineShipping] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(`Discount code "${code || 'NEW-PROMO'}" created successfully!`)
    setTimeout(() => {
      router.push("/discounts")
    }, 500)
  }

  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-3 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <Link
          href="/discounts"
          className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Discount</h1>
          <p className="text-xs text-gray-500 mt-1">Configure promo codes, customer eligibility, and combination rules.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Method Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
            Discount Method
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMethod("Code")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                method === "Code"
                  ? "border-amber-800 bg-amber-50/50 ring-2 ring-amber-800/20"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="font-bold text-sm text-gray-900">Discount Code</div>
              <div className="text-xs text-gray-500 mt-1">Customers enter code at checkout.</div>
            </button>

            <button
              type="button"
              onClick={() => setMethod("Automatic")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                method === "Automatic"
                  ? "border-amber-800 bg-amber-50/50 ring-2 ring-amber-800/20"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="font-bold text-sm text-gray-900">Automatic Discount</div>
              <div className="text-xs text-gray-500 mt-1">Applies automatically in cart.</div>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
              Discount Code / Title
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setTitle(`${e.target.value.toUpperCase()} - Promo Discount`)
              }}
              placeholder="e.g. SUMMER15"
              className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 text-sm font-bold text-amber-800 uppercase tracking-wider focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
            />
          </div>
        </div>

        {/* Value Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
            Discount Value & Type
          </h2>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <label className={`p-3 rounded-xl border cursor-pointer font-semibold ${discountType === "Percentage" ? "border-amber-800 bg-amber-50" : "border-gray-200"}`}>
              <input type="radio" name="type" checked={discountType === "Percentage"} onChange={() => setDiscountType("Percentage")} className="mr-2" />
              Percentage (%)
            </label>
            <label className={`p-3 rounded-xl border cursor-pointer font-semibold ${discountType === "Fixed amount" ? "border-amber-800 bg-amber-50" : "border-gray-200"}`}>
              <input type="radio" name="type" checked={discountType === "Fixed amount"} onChange={() => setDiscountType("Fixed amount")} className="mr-2" />
              Fixed Amount (PKR)
            </label>
            <label className={`p-3 rounded-xl border cursor-pointer font-semibold ${discountType === "Free shipping" ? "border-amber-800 bg-amber-50" : "border-gray-200"}`}>
              <input type="radio" name="type" checked={discountType === "Free shipping"} onChange={() => setDiscountType("Free shipping")} className="mr-2" />
              Free Shipping
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
              Discount Amount
            </label>
            <input
              type="text"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder="15"
              className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 text-sm font-bold text-gray-900"
            />
          </div>
        </div>

        {/* Combinations Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
            Combinations
          </h2>

          <div className="space-y-2 text-xs text-gray-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={combineProduct}
                onChange={(e) => setCombineProduct(e.target.checked)}
                className="rounded border-gray-300 text-amber-800"
              />
              <span>Can combine with Product discounts</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={combineShipping}
                onChange={(e) => setCombineShipping(e.target.checked)}
                className="rounded border-gray-300 text-amber-800"
              />
              <span>Can combine with Shipping discounts</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/discounts"
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors border border-gray-300"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Save Discount
          </button>
        </div>
      </form>
    </div>
  )
}
