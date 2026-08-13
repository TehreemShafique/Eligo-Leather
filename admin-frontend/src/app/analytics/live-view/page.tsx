"use client"

import { useState } from "react"
import { Globe, Eye, ShoppingCart, ShoppingBagOpen, CheckCircle, Pulse } from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminLiveViewPage() {
  const [activeVisitors, setActiveVisitors] = useState(4)
  const [activeCarts, setActiveCarts] = useState(2)
  const [activeCheckouts, setActiveCheckouts] = useState(1)

  const liveActivityLog = [
    { time: "Just now", event: "Order #1336 completed for Rs. 30,990", location: "Islamabad, PK", type: "order" },
    { time: "1 min ago", event: "Visitor added ARDOR Card Holder to cart", location: "Lahore, PK", type: "cart" },
    { time: "2 mins ago", event: "Visitor viewed Mens Wallet Collection", location: "Karachi, PK", type: "view" },
    { time: "4 mins ago", event: "Visitor from Iowa, USA entered Storefront", location: "Iowa, US", type: "view" },
  ]

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 text-white p-6 rounded-2xl border border-stone-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Live View</h1>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Stream Active
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">Real-time geospatial visitor tracking, active carts, and streaming store sales.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.info("Live stream parameters updated.")}
            className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold rounded-xl border border-stone-700 transition-colors"
          >
            Stream Controls
          </button>
        </div>
      </div>

      {/* Active Ticker Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>Active Visitors</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{activeVisitors}</div>
          <span className="text-[11px] text-emerald-600 font-semibold">Browsing storefront right now</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
            <ShoppingCart className="w-4 h-4 text-amber-800" />
            <span>Active Carts</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{activeCarts}</div>
          <span className="text-[11px] text-amber-800 font-semibold">Building cart items</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
            <ShoppingBagOpen className="w-4 h-4 text-blue-600" />
            <span>Active Checkouts</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{activeCheckouts}</div>
          <span className="text-[11px] text-blue-600 font-semibold">In checkout funnel</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Completed Orders</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">Rs 30,990</div>
          <span className="text-[11px] text-emerald-600 font-semibold">1 order placed last minute</span>
        </div>
      </div>

      {/* Live Geospatial Map & Live Stream Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* World / Pakistan Map Canvas */}
        <div className="lg:col-span-8 bg-stone-950 p-6 rounded-2xl border border-stone-800 shadow-xl flex flex-col justify-between relative min-h-[350px]">
          <div className="flex items-center justify-between text-xs text-stone-300 font-semibold border-b border-stone-800 pb-3">
            <span>Geospatial Visitor Map</span>
            <span>Markets: Pakistan &amp; International</span>
          </div>

          {/* Interactive World Map Simulation */}
          <div className="flex-1 flex items-center justify-center relative my-8">
            <div className="w-64 h-64 rounded-full border border-emerald-500/20 bg-emerald-950/10 flex items-center justify-center relative">
              <div className="w-40 h-40 rounded-full border border-emerald-500/30 bg-emerald-900/20 flex items-center justify-center">
                <Globe className="w-20 h-20 text-emerald-500/40" />
              </div>

              {/* Pulsing Hotspots */}
              <div className="absolute top-12 right-16 w-3 h-3 rounded-full bg-emerald-400 shadow-lg animate-ping" />
              <div className="absolute bottom-16 left-20 w-3 h-3 rounded-full bg-amber-400 shadow-lg animate-ping" />
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-stone-400">
            <span>Live sessions in Lahore, Islamabad, Bahawalpur, Iowa US</span>
            <span className="font-mono text-emerald-400">30 fps stream</span>
          </div>
        </div>

        {/* Live Activity Feed Stream */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="font-bold text-gray-900 uppercase tracking-wide">Live Activity Log</h2>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">Streaming</span>
          </div>

          <div className="space-y-3">
            {liveActivityLog.map((log, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <div className="flex justify-between items-center text-[11px] text-gray-500 font-semibold">
                  <span>{log.location}</span>
                  <span className="font-mono text-amber-800">{log.time}</span>
                </div>
                <div className="font-bold text-gray-900">{log.event}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
