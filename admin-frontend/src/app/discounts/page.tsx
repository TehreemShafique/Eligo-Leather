"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Percent,
  Plus,
  MagnifyingGlass,
  CheckCircle,
  Clock,
  DownloadSimple,
  Ticket,
  ShieldCheck,
  Sliders,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { MOCK_DISCOUNTS } from "@/modules/discounts/api"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminDiscountsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "scheduled" | "expired">("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Welcome Discount Settings State (Dynamic with localStorage fallback)
  const [welcomeActive, setWelcomeActive] = useState(true)
  const [welcomePct, setWelcomePct] = useState("5")
  const [savingWelcome, setSavingWelcome] = useState(false)

  // Load from localStorage or fallback to default
  useEffect(() => {
    try {
      const stored = localStorage.getItem("eligo_welcome_discount_settings")
      if (stored) {
        const parsed = JSON.parse(stored)
        setWelcomeActive(parsed.welcomeActive ?? true)
        setWelcomePct(String(parsed.welcomePct ?? "5"))
      }
    } catch (e) {
      // fallback defaults remain intact
    }
  }, [])

  // Welcome Discount Claimed Logs (tracked by Email / IP)
  const [welcomeLogs] = useState([
    { id: 1, email: "m.ali@example.com", ip: "39.45.18.92", code: "WELCOME5", date: "Feb 11, 2026, 14:20" },
    { id: 2, email: "zainab.k@example.com", ip: "111.68.99.14", code: "WELCOME5", date: "Feb 11, 2026, 11:05" },
    { id: 3, email: "usman.l@example.com", ip: "182.180.44.201", code: "WELCOME5", date: "Feb 10, 2026, 19:40" },
  ])

  const handleSaveWelcomeSettings = (e: React.FormEvent) => {
    e.preventDefault()
    setSavingWelcome(true)

    const payload = {
      welcomeActive,
      welcomePct: Number(welcomePct),
      couponCode: `WELCOME${welcomePct}`,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem("eligo_welcome_discount_settings", JSON.stringify(payload))

    setTimeout(() => {
      setSavingWelcome(false)
      toast.success(`Welcome Discount saved! Storefront will use ${welcomePct}% OFF (${welcomeActive ? "Active" : "Disabled"}).`)
    }, 500)
  }

  const filteredDiscounts = MOCK_DISCOUNTS.filter((d) => {
    if (activeTab === "active" && d.status !== "Active") return false
    if (activeTab === "scheduled" && d.status !== "Scheduled") return false
    if (activeTab === "expired" && d.status !== "Expired") return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        d.code.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.eligibility.toLowerCase().includes(q)
      )
    }

    return true
  })

  return (
    <div className="space-y-5">
      <PageHeader
        title="Discounts"
        icon={<Percent className="w-5 h-5" />}
        actions={
          <Link
            href="/discounts/new"
            className="eligo-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promo Discount</span>
          </Link>
        }
      />

      {/* Welcome Scratch & Win Discount Config Card */}
      <div className="eligo-card p-6 space-y-5 animate-slide-up delay-75">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Welcome Discount Settings
            </h2>
          </div>

          <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-full border border-amber-300 self-start sm:self-auto">
            Code: WELCOME{welcomePct} ({welcomePct}% OFF)
          </span>
        </div>

        <form onSubmit={handleSaveWelcomeSettings} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start text-xs">
          {/* Settings Column */}
          <div className="md:col-span-6 space-y-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-900">Scratch &amp; Win Welcome Popup Status:</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWelcomeActive(!welcomeActive)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    welcomeActive ? "bg-emerald-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                      welcomeActive ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="font-bold text-gray-800">{welcomeActive ? "Active" : "Disabled"}</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-900 block mb-1">
                Welcome Discount Percentage (%):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={welcomePct}
                  onChange={e => setWelcomePct(e.target.value)}
                  className="w-24 h-10 px-3 bg-white border border-gray-300 rounded-xl font-bold text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800 transition-all"
                />
                <span className="text-gray-600 font-semibold">% OFF (e.g. 5% = Rs. 100 &rarr; Rs. 95)</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingWelcome}
                className="eligo-btn-primary disabled:opacity-50"
              >
                {savingWelcome ? "Saving..." : "Save Welcome Settings"}
              </button>
            </div>
          </div>

          {/* Email / IP Claimed Audit Log Column */}
          <div className="md:col-span-6 space-y-3 p-4 bg-amber-50/40 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-800" />
                <span>Claimed Welcome Discount Logs (Email / IP Tracked)</span>
              </span>
              <span className="text-[10px] text-amber-900 font-mono font-bold">{welcomeLogs.length} Claimed</span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {welcomeLogs.map(log => (
                <div key={log.id} className="p-2.5 bg-white rounded-xl border border-amber-200 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-bold text-gray-900 block">{log.email}</span>
                    <span className="text-gray-500 font-mono">IP: {log.ip}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-800 font-mono block">{log.code}</span>
                    <span className="text-gray-400 text-[10px]">{log.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Main Promo Code Discounts Table Container */}
      <div className="eligo-card overflow-hidden animate-slide-up delay-150">
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-gray-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === "all" ? "bg-amber-800 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            All Store Promo Codes
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search promo code or title..."
              className="eligo-input pl-9"
            />
          </div>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th">Title / Code</th>
                <th className="eligo-th w-[10%]">Status</th>
                <th className="eligo-th w-[10%]">Method</th>
                <th className="eligo-th w-[15%]">Type & Value</th>
                <th className="eligo-th">Eligibility</th>
                <th className="eligo-th w-[9%] text-right">Used Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {filteredDiscounts.map((discount) => (
                <tr key={discount.id} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5">
                      <Ticket className="w-4 h-4 text-amber-800 shrink-0" />
                      <span>{discount.code}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium mt-0.5 truncate">{discount.title}</div>
                  </td>
                  <td className="eligo-td">
                    <span className="eligo-badge bg-emerald-100 text-emerald-800 border-emerald-200">
                      <CheckCircle className="w-3 h-3" />
                      {discount.status}
                    </span>
                  </td>
                  <td className="eligo-td font-semibold text-gray-900">{discount.method}</td>
                  <td className="eligo-td">
                    <div className="font-bold text-gray-900">{discount.value}</div>
                    <div className="text-[11px] text-gray-500">{discount.type}</div>
                  </td>
                  <td className="eligo-td text-gray-700 font-medium truncate">{discount.eligibility}</td>
                  <td className="eligo-td text-right font-bold text-gray-900">
                    {discount.used_count} used
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
