"use client"

import { useState } from "react"
import { Crown, CheckCircle, ShieldCheck, Sparkle } from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminSettingsPlanPage() {
  return (
    <div className="space-y-6 font-sans max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
              <span>Subscription &amp; Store Capacity</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Plan</h1>
            <p className="text-xs text-gray-500 mt-1">Manage your store subscription plan, staff user limits, and feature unlocks.</p>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold rounded-full text-xs border border-amber-200">
            Custom Enterprise Plan
          </span>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-amber-800" />
              <div>
                <span className="font-bold text-gray-900 text-sm block">Eligo Custom Platform (PostgreSQL DB)</span>
                <span className="text-gray-500 block">Unlimited staff accounts &bull; Unlimited products &bull; Custom REST APIs</span>
              </div>
            </div>
            <button
              onClick={() => toast.info("Your custom platform is fully activated with unlimited resources.")}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-bold rounded-xl shadow-2xs"
            >
              Change plan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
