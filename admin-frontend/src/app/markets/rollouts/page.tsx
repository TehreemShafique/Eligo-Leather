"use client"

import Link from "next/link"
import { Sparkle, Plus } from "@phosphor-icons/react"

export default function AdminRolloutsPage() {
  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
            <span>Shopify Store Rollouts & Scheduled Changes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Rollouts
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Schedule a set of changes for upcoming sales, test theme designs, or preview checkout updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/markets/rollouts/new"
            className="px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create rollout</span>
          </Link>
        </div>
      </div>

      {/* Landing Presentation Card (Matching image_19513d.png) */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-2xs text-center max-w-3xl mx-auto space-y-4">
        <div className="w-16 h-16 bg-amber-800/10 text-amber-800 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <Sparkle className="w-8 h-8 text-amber-800" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Test and time your launches</h2>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Schedule a set of changes for an upcoming sale, or try different designs to see which performs best.
        </p>
        <div className="pt-2">
          <Link
            href="/markets/rollouts/new"
            className="px-6 py-3 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-xl shadow-md transition-colors inline-block"
          >
            Create rollout
          </Link>
        </div>
      </div>
    </div>
  )
}
