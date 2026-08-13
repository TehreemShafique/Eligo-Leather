"use client"

import { useState } from "react"
import Link from "next/link"
import { Globe, Plus, MagnifyingGlass, ChartLine, X, CheckCircle, CurrencyCircleDollar, Sliders } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminMarketsPage() {
  const [banners, setBanners] = useState({ us: true, uk: true })

  const markets = [
    {
      id: 1,
      name: "Pakistan (Primary)",
      flag: "🇵🇰",
      status: "Active",
      includes: "Pakistan",
      customizations: "Store currency (PKR Rs), Local Shipping, Tax included",
    },
    {
      id: 2,
      name: "International (Rest of World)",
      flag: "🌐",
      status: "Active",
      includes: "235 countries & regions",
      customizations: "Dynamic USD Currency, International DHL Express",
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Markets"
        icon={<Globe className="w-5 h-5" />}
        actions={
          <>
            <button
              onClick={() => toast.info("Graph view toggled.")}
              className="eligo-btn-secondary"
            >
              <ChartLine className="w-4 h-4 text-amber-800" />
              <span>Graph view</span>
            </button>
            <button
              onClick={() => toast.success("Create market drawer opened!")}
              className="eligo-btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Create market</span>
            </button>
          </>
        }
      />

      {/* Suggested Quick-Add Banners */}
      <div className="space-y-3 animate-slide-up delay-75">
        {banners.us && (
          <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-lg shrink-0">🇺🇸</span>
              <div className="min-w-0">
                <span className="font-bold block">Expand to United States Market</span>
                <span className="truncate block">Set custom USD pricing, duty pre-collection, and local payment methods.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toast.success("United States market created!")}
                className="px-3 py-1.5 bg-amber-800 text-white font-semibold rounded-lg hover:bg-amber-900 transition-colors"
              >
                Create United States Market +
              </button>
              <button
                onClick={() => setBanners({ ...banners, us: false })}
                className="p-1.5 text-gray-500 hover:text-black rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {banners.uk && (
          <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs text-blue-900 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-lg shrink-0">🇬🇧</span>
              <div className="min-w-0">
                <span className="font-bold block">Expand to United Kingdom Market</span>
                <span className="truncate block">Set GBP pricing, VAT compliance, and localized shipping rates.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toast.success("United Kingdom market created!")}
                className="px-3 py-1.5 bg-blue-800 text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors"
              >
                Create United Kingdom Market +
              </button>
              <button
                onClick={() => setBanners({ ...banners, uk: false })}
                className="p-1.5 text-gray-500 hover:text-black rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Markets Table */}
      <div className="eligo-card overflow-hidden animate-slide-up delay-150">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search in all markets..."
              className="eligo-input pl-9"
            />
          </div>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th">Market</th>
                <th className="eligo-th w-[12%]">Status</th>
                <th className="eligo-th w-[20%]">Includes</th>
                <th className="eligo-th">Customizations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {markets.map((m) => (
                <tr key={m.id} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td font-bold text-gray-900">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{m.flag}</span>
                      <span>{m.name}</span>
                    </div>
                  </td>
                  <td className="eligo-td">
                    <span className="eligo-badge bg-emerald-100 text-emerald-800 border-emerald-200">
                      <CheckCircle className="w-3 h-3" />
                      {m.status}
                    </span>
                  </td>
                  <td className="eligo-td font-semibold text-gray-700">{m.includes}</td>
                  <td className="eligo-td text-gray-500 text-[11px]">{m.customizations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
