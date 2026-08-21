"use client"

import { useState } from "react"
import Link from "next/link"
import { Truck, Star, ArrowRight } from "@phosphor-icons/react"

export default function AdminSettingsAppsPage() {
  const [appsList] = useState([
    {
      code: "leopards_shipping",
      name: "Leopards Courier",
      category: "Shipping & Fulfillment",
      status: "Active",
      description: "Leopards API integration. Automated COD shipment booking, tracking, and manual order dispatch portal.",
      icon: Truck,
      color: "text-amber-950 bg-amber-400 border-amber-300",
      actions: ["create_shipment", "track_shipment"],
      portalUrl: "/settings/apps/leopards-courier",
    },
    {
      code: "supabase_reviews",
      name: "Supabase Customer Reviews",
      category: "Reviews & Ratings",
      status: "Active",
      description: "Supabase database engine for customer product reviews, ratings, photo uploads, and admin approval moderation.",
      icon: Star,
      color: "text-emerald-800 bg-emerald-50 border-emerald-200",
      actions: ["fetch_reviews", "post_review", "update_review_status"],
      portalUrl: "/settings/apps/supabase",
    },
  ])

  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
            <span>Custom Plugin Extensions Vault</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Apps &amp; Integrations</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your integrated backend third-party service adapters and courier booking engines.
          </p>
        </div>
      </div>

      {/* Integrated Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {appsList.map((app) => {
          const AppIcon = app.icon
          return (
            <div
              key={app.code}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between space-y-4 hover:border-amber-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${app.color}`}>
                      <AppIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm">{app.name}</h2>
                      <span className="text-[11px] text-gray-500">{app.category}</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {app.status}
                  </span>
                </div>

                <p className="text-gray-600 text-xs leading-relaxed">{app.description}</p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <Link
                  href={app.portalUrl}
                  className="w-full py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold text-xs shadow-2xs transition-colors flex items-center justify-center gap-2"
                >
                  <span>Open {app.name} Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
