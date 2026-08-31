"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Storefront, PencilSimple, Eye, Plus, CheckCircle, Sparkle } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminOnlineStoreThemesPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Themes"
        icon={<Storefront className="w-5 h-5" />}
        actions={
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="eligo-btn-secondary"
          >
            <Eye className="w-4 h-4 text-amber-800" />
            <span>View Live Store</span>
          </a>
        }
      />

      {/* Main Theme Card */}
      <div className="eligo-card p-6 sm:p-8 space-y-6 animate-slide-up delay-75">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="eligo-badge bg-emerald-100 text-emerald-800 border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" />
              Current Main Theme
            </span>
          </div>
          <button
            onClick={() => toast.success("Theme editor launched!")}
            className="eligo-btn-primary"
          >
            <PencilSimple className="w-4 h-4" />
            <span>Customize</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-5 relative h-56 w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-xs">
            <Image
              src="https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800"
              alt="Thunder Optimized Dawn Theme"
              fill
              className="object-cover"
            />
          </div>

          <div className="md:col-span-7 space-y-3">
            <h2 className="text-xl font-bold text-gray-900">Thunder Optimized Dawn</h2>
            <p className="text-xs text-gray-500 font-mono">Dawn Version 15.1.0 &bull; Last saved Today, 2:40 PM</p>
            <p className="text-xs text-gray-700 leading-relaxed">
              High-performance, mobile-first luxury leather storefront theme tailored for fast load speeds, rich product media galleries, and conversion optimization.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
