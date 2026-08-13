"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, MagnifyingGlass, ArrowsLeftRight, Check, LinkBreak, Paperclip } from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminNewTransferPage() {
  const router = useRouter()
  const [origin, setOrigin] = useState("Main Leather Tannery, Sialkot")
  const [destination, setDestination] = useState("Off # 407, 4th floor, Gulberg Empire, Executive Block, Gulberg Greens, Islamabad")
  const [transferDate, setTransferDate] = useState("2026-07-28")
  const [referenceName, setReferenceName] = useState("TR1001 - Raw Hides Dispatch")
  const [note, setNote] = useState("Shipment includes 45 hides of full-grain cowhide leather.")
  const [tags, setTags] = useState("In-Transit, High-Priority")

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(`Transfer "${referenceName}" created and placed In Transit!`)
    setTimeout(() => {
      router.push("/products/transfers")
    }, 400)
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/products/transfers"
            className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Create Transfer</h1>
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                In transit
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Schedule and route inventory transfers across warehouse locations.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products/transfers"
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors border border-gray-300"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Save Transfer
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6 text-xs">
          {/* Origin & Destination Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
              Route & Fulfillment Locations
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Select Origin Location</label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                >
                  <option value="Main Leather Tannery, Sialkot">Main Leather Tannery, Sialkot</option>
                  <option value="Off # 407, Gulberg Empire, Islamabad">Gulberg Empire, Islamabad</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Select Destination Warehouse</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                >
                  <option value="Off # 407, 4th floor, Gulberg Empire, Executive Block, Gulberg Greens, Islamabad">
                    Gulberg Empire, Islamabad
                  </option>
                </select>
              </div>
            </div>

            {/* Product Search Bar */}
            <div className="pt-2">
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Search products to add</label>
              <div className="relative">
                <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Search products to add to transfer..."
                  className="w-full h-11 pl-9 pr-4 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Details & Schedule Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
              Transfer Details & Notes
            </h2>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Add reference name</label>
              <input
                type="text"
                value={referenceName}
                onChange={(e) => setReferenceName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Dispatch Date</label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-gray-700 uppercase tracking-wide mb-1">
                <span>Add note</span>
                <span className="font-mono text-gray-400">{note.length}/5000</span>
              </div>
              <textarea
                rows={3}
                maxLength={5000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900"
              />
            </div>
          </div>

          {/* Linked Purchase Order Integration Card (Matching Prompt) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
              Link Purchase Order Integration
            </h2>

            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 text-xs">Linked Purchase Order: #PO4</span>
                <span className="px-2 py-0.5 bg-amber-800 text-white font-bold rounded-md text-[10px]">Active Link</span>
              </div>
              <p className="text-gray-700 text-[11px] leading-snug">
                Off # 407, 4th floor, Gulberg Empire, Executive Block, Gulberg Greens, Islamabad &bull; Bill No 4365
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6 text-xs">
          {/* Tags */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <h2 className="font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Add Tags</h2>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
            />
          </div>
        </div>
      </form>
    </div>
  )
}
