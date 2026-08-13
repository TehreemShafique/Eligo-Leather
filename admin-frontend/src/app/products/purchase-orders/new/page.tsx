"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, MagnifyingGlass, Plus, PencilSimple, X } from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminNewPurchaseOrderPage() {
  const router = useRouter()
  const [supplier, setSupplier] = useState("Sialkot Tannery Leather Supplies")
  const [destination, setDestination] = useState("Off # 407, 4th floor, Gulberg Empire, Executive Block, Gulberg Greens, Islamabad")
  const [referenceNumber, setReferenceNumber] = useState("PO4")
  const [noteToSupplier, setNoteToSupplier] = useState("Please package in dry protective moisture-barrier lining.")
  const [paymentTerm, setPaymentTerm] = useState("Net 30")
  const [currency, setCurrency] = useState("PKR (Rs)")
  const [tags, setTags] = useState("Leather-Supply, Raw-Hides")
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [newTagInput, setNewTagInput] = useState("")

  const paymentTermsList = [
    "None",
    "Net 7",
    "Net 15",
    "Net 30",
    "Net 45",
    "Net 60",
    "Cash on delivery",
    "Payment on receipt",
    "Payment in advance",
  ]

  const worldCurrencies = [
    "PKR (Rs)",
    "USD ($)",
    "EUR (€)",
    "GBP (£)",
    "AED (د.إ)",
    "CAD ($)",
    "AUD ($)",
    "SAR (﷼)",
  ]

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(`Purchase order #${referenceNumber} created successfully!`)
    setTimeout(() => {
      router.push("/products/purchase-orders")
    }, 400)
  }

  const handleAddTag = () => {
    if (newTagInput.trim()) {
      setTags(tags ? `${tags}, ${newTagInput.trim()}` : newTagInput.trim())
      setNewTagInput("")
      setTagModalOpen(false)
      toast.success("Tag added!")
    }
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/products/purchase-orders"
            className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
            <p className="text-xs text-gray-500 mt-1">Configure supplier details, payment terms, and incoming inventory variants.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products/purchase-orders"
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors border border-gray-300"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Save Purchase Order
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Supplier & Destination Selectors */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
              Purchasing Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Select Supplier</label>
                <select
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                >
                  <option value="Sialkot Tannery Leather Supplies">Sialkot Tannery Leather Supplies</option>
                  <option value="Lahore Hardware & Brass Fittings">Lahore Hardware & Brass Fittings</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Select Destination Address</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
                >
                  <option value="Off # 407, 4th floor, Gulberg Empire, Executive Block, Gulberg Greens, Islamabad">
                    Gulberg Empire, Islamabad
                  </option>
                </select>
              </div>
            </div>

            {/* Product Search Input */}
            <div className="pt-2">
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Search products to add</label>
              <div className="relative">
                <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Search products to add to purchase order..."
                  className="w-full h-11 pl-9 pr-4 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Purchase Order Details Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
              Purchase Order Details
            </h2>

            <div>
              <div className="flex justify-between font-semibold text-gray-700 uppercase tracking-wide mb-1">
                <span>Reference number</span>
                <span className="font-mono text-gray-400">{referenceNumber.length}/255</span>
              </div>
              <input
                type="text"
                maxLength={255}
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-gray-700 uppercase tracking-wide mb-1">
                <span>Note to supplier</span>
                <span className="font-mono text-gray-400">{noteToSupplier.length}/5000</span>
              </div>
              <textarea
                rows={3}
                maxLength={5000}
                value={noteToSupplier}
                onChange={(e) => setNoteToSupplier(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900"
              />
            </div>

            {/* Payment Terms Selector */}
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-2">Payment terms</label>
              <div className="flex flex-wrap gap-2">
                {paymentTermsList.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setPaymentTerm(term)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      paymentTerm === term ? "bg-amber-800 text-white border-amber-800 shadow-2xs" : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Supplier Currency Selector */}
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Supplier currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-amber-800"
              >
                {worldCurrencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6 text-xs">
          {/* Tags Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="font-bold text-gray-900 uppercase tracking-wide">Tags</h2>
              <button
                type="button"
                onClick={() => setTagModalOpen(true)}
                className="p-1 text-gray-500 hover:text-amber-800 rounded-lg hover:bg-gray-100"
              >
                <PencilSimple className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {tags.split(",").map((t, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg text-[11px]">
                  {t.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </form>

      {/* Pop-up Modal to Add Tag */}
      {tagModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Add tag</h3>
              <button onClick={() => setTagModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Tag Name</label>
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="e.g. Raw-Leather"
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button onClick={() => setTagModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold">
                Cancel
              </button>
              <button onClick={handleAddTag} className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900">
                Add Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
