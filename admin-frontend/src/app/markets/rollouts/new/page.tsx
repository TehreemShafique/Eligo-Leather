"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sparkle, Plus, Storefront, ShoppingBagOpen, PencilSimple, ArrowRight } from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminNewRolloutPage() {
  const router = useRouter()
  const [name, setName] = useState("Valentine's 2026 Theme & Checkout Update")
  const [selectedChangeType, setSelectedChangeType] = useState<"theme" | "checkout" | null>(null)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(`Rollout "${name}" scheduled successfully!`)
    setTimeout(() => {
      router.push("/markets/rollouts")
    }, 400)
  }

  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/markets/rollouts"
            className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">New Rollout</h1>
              <span className="px-2.5 py-0.5 bg-gray-100 text-gray-800 text-xs font-bold rounded-full border border-gray-300">
                Draft
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Schedule, test, and launch theme or checkout updates.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/markets/rollouts"
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors border border-gray-300"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Save Rollout
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Name Input */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Rollout Name</label>
            <span className="text-[11px] text-gray-400 font-mono">{name.length}/255</span>
          </div>

          <input
            type="text"
            required
            maxLength={255}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Valentine's 2026 Store Theme Update"
            className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 text-sm font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
          />
        </div>

        {/* Change Selection Block */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
            Schedule, test, and launch store updates
          </h2>

          <p className="text-xs text-gray-600">Add any change to launch a new theme, update your checkout, or schedule changes for a sale.</p>

          {/* Change Type Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => setSelectedChangeType("theme")}
              className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedChangeType === "theme"
                  ? "border-amber-800 bg-amber-50/50 ring-2 ring-amber-800/20"
                  : "border-gray-200 bg-gray-50/50 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-800 text-white rounded-xl">
                  <Storefront className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Online Store Theme</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Test new theme design or layout changes.</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedChangeType("checkout")}
              className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedChangeType === "checkout"
                  ? "border-amber-800 bg-amber-50/50 ring-2 ring-amber-800/20"
                  : "border-gray-200 bg-gray-50/50 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-800 text-white rounded-xl">
                  <ShoppingBagOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Checkout & Accounts</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Customize payment options or checkout branding.</p>
                </div>
              </div>
            </button>
          </div>

          {/* Selected Theme Details Workflow */}
          {selectedChangeType === "theme" && (
            <div className="p-5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Thunder Optimized Dawn (Dawn v15.1.0)</h4>
                  <p className="text-xs text-gray-600">Main active storefront theme selected for rollout.</p>
                </div>
                <Link
                  href="/online-store/themes"
                  className="px-3.5 py-1.5 bg-amber-800 text-white text-xs font-semibold rounded-lg hover:bg-amber-900 transition-colors inline-flex items-center gap-1"
                >
                  <PencilSimple className="w-3.5 h-3.5" />
                  <span>Edit Theme</span>
                </Link>
              </div>

              <div className="pt-2 border-t border-amber-200 flex justify-end">
                <Link
                  href="/online-store/themes"
                  className="text-xs font-bold text-amber-800 hover:underline inline-flex items-center gap-1"
                >
                  <span>Explore more themes in Sales Channels</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
