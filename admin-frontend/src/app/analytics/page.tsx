"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChartBar,
  DotsThreeOutline,
  Target,
  Sparkle,
  Calendar,
  CurrencyCircleDollar,
  TrendUp,
  Desktop,
  DeviceMobile,
  Globe,
  MapPin,
  Funnel,
  Eye,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState("Today, 28 Jul 2026")
  const [compareDate, setCompareDate] = useState("vs 27 Jul 2026")

  const topMetrics = [
    { title: "Gross sales", value: "Rs 0", change: "0%", subtext: "No sales recorded today" },
    { title: "Returning customer rate", value: "0%", change: "0%", subtext: "0 returning buyers" },
    { title: "Orders fulfilled", value: "0", change: "0%", subtext: "0 shipments" },
    { title: "Orders", value: "0", change: "0%", subtext: "0 checkouts completed" },
  ]

  const salesBreakdown = [
    { label: "Gross sales", val: "Rs 0.00" },
    { label: "Discounts", val: "-Rs 0.00" },
    { label: "Sales reversals", val: "-Rs 0.00" },
    { label: "Net sales", val: "Rs 0.00" },
    { label: "Shipping charges", val: "+Rs 0.00" },
    { label: "Return fees", val: "+Rs 0.00" },
    { label: "Taxes", val: "+Rs 0.00" },
  ]

  const locations = [
    { location: "United States · Iowa · Council Bluffs", sessions: 12, ratio: "42.8%" },
    { location: "Pakistan · Islamabad · Islamabad", sessions: 9, ratio: "32.1%" },
    { location: "Pakistan · Punjab · Lahore", sessions: 7, ratio: "25.0%" },
  ]

  const landingPages = [
    { page: "Homepage (/)", sessions: 18 },
    { page: "/collections/mens-wallet", sessions: 6 },
    { page: "/products/ardor-leather-card-holder", sessions: 4 },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        icon={<ChartBar className="w-5 h-5" />}
        actions={
          <>
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 hover:border-amber-300 transition-colors">
              <Calendar className="w-4 h-4 text-amber-800" />
              <span>{dateRange}</span>
            </div>

            <button
              onClick={() => toast.info("Targets goal tracker opened!")}
              className="eligo-btn-secondary"
            >
              <Target className="w-4 h-4 text-amber-800" />
              <span>Try targets</span>
            </button>

            <button
              onClick={() => toast.success("New exploration query builder launched!")}
              className="eligo-btn-primary"
            >
              <Sparkle className="w-4 h-4" />
              <span>New exploration</span>
            </button>
          </>
        }
      />

      {/* Top Performance Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topMetrics.map((m, idx) => (
          <div key={idx} className="eligo-card eligo-card-hover p-5 space-y-1 animate-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
            <span className="text-xs text-gray-500 font-semibold uppercase">{m.title}</span>
            <div className="text-2xl font-bold text-gray-900">{m.value}</div>
            <span className="text-[11px] text-gray-400 font-medium block">{m.subtext}</span>
          </div>
        ))}
      </div>

      {/* Grid: Total Sales Line Chart & Breakdown Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-slide-up delay-75">
        {/* Total Sales Timeline */}
        <div className="lg:col-span-8 eligo-card p-6 space-y-4 hover:border-[#d4c9b4]">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Total sales over time</h2>
              <span className="text-xs text-gray-500">Gross sales minus discounts and returns</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Rs 0.00</span>
          </div>

          <div className="h-48 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-xs text-gray-400 italic">
            Sales line graph visualization timeline
          </div>
        </div>

        {/* Total Sales Breakdown Card */}
        <div className="lg:col-span-4 eligo-card p-6 space-y-3 text-xs hover:border-[#d4c9b4]">
          <h2 className="font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
            Total Sales Breakdown
          </h2>

          <div className="space-y-2">
            {salesBreakdown.map((sb, idx) => (
              <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="font-semibold text-gray-700">{sb.label}</span>
                <span className="font-mono font-bold text-gray-900">{sb.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Conversion Funnel & Sessions by Device */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-slide-up delay-150">
        {/* Sessions & Conversion Rate */}
        <div className="eligo-card p-6 space-y-4 text-xs hover:border-[#d4c9b4]">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Sessions over time</h2>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[11px]">
              28 ↑ 75%
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="font-semibold text-gray-700 uppercase tracking-wide text-[10px]">Conversion Funnel</div>
            <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
              <span>Sessions:</span>
              <span className="font-bold text-gray-900">28</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
              <span>Added to cart:</span>
              <span className="font-bold text-gray-900">4 (14.2%)</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
              <span>Reached checkout:</span>
              <span className="font-bold text-gray-900">2 (7.1%)</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
              <span>Completed order:</span>
              <span className="font-bold text-emerald-700">0 (0.0%)</span>
            </div>
          </div>
        </div>

        {/* Sessions by Device Type */}
        <div className="eligo-card p-6 space-y-4 text-xs hover:border-[#d4c9b4]">
          <h2 className="font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
            Sessions by Device Type
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 font-semibold text-gray-800">
                <Desktop className="w-4 h-4 text-amber-800" />
                <span>Desktop</span>
              </div>
              <span className="font-bold text-gray-900">18 sessions (64.2%)</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 font-semibold text-gray-800">
                <DeviceMobile className="w-4 h-4 text-amber-800" />
                <span>Mobile</span>
              </div>
              <span className="font-bold text-gray-900">10 sessions (35.8%)</span>
            </div>
          </div>
        </div>

        {/* Sessions by Location */}
        <div className="eligo-card p-6 space-y-4 text-xs hover:border-[#d4c9b4]">
          <h2 className="font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
            Sessions by Location
          </h2>

          <div className="space-y-2">
            {locations.map((loc, idx) => (
              <div key={idx} className="p-2.5 bg-gray-50 rounded-xl space-y-0.5">
                <div className="font-bold text-gray-900 flex justify-between">
                  <span>{loc.location}</span>
                  <span className="text-amber-800">{loc.sessions}</span>
                </div>
                <span className="text-[11px] text-gray-500">{loc.ratio} of total traffic</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
