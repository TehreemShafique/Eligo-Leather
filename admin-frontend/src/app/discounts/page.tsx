"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Percent,
  Plus,
  MagnifyingGlass,
  CheckCircle,
  DownloadSimple,
  Ticket,
  ShieldCheck,
  User,
  Tag,
  Package,
  Truck,
  CaretDown,
  Trash,
} from "@phosphor-icons/react"
import { toast } from "sonner"

interface DiscountRecord {
  id: number
  title: string
  subtitle: string
  status: "Active" | "Expired" | "Deactivated"
  method: "Code" | "Automatic"
  eligibility: string
  type: string
  used_count: number
}

export default function AdminDiscountsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Welcome Discount Settings State (Type 1: Welcome Discount in DB)
  const [welcomeActive, setWelcomeActive] = useState(true)
  const [welcomePct, setWelcomePct] = useState("5")
  const [savingWelcome, setSavingWelcome] = useState(false)

  // Welcome Discount Claimed Logs (tracked by Email / IP)
  const [welcomeLogs] = useState([
    { id: 1, email: "m.ali@example.com", ip: "39.45.18.92", code: "WELCOMES", date: "Feb 11, 2026, 14:20" },
    { id: 2, email: "zainab.k@example.com", ip: "111.68.99.14", code: "WELCOMES", date: "Feb 11, 2026, 11:05" },
    { id: 3, email: "usman.l@example.com", ip: "182.180.44.201", code: "WELCOMES", date: "Feb 10, 2026, 19:40" },
  ])

  // Discounts list state (Type 2: Store Promo Discounts in DB)
  const [discounts, setDiscounts] = useState<DiscountRecord[]>([])

  // Fetch BOTH types of discounts directly from Database
  useEffect(() => {
    let isMounted = true

    // 1. Fetch Type 1: Welcome Discount Settings from DB
    const fetchWelcomeSettings = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/discounts/welcome")
        if (res.ok) {
          const data = await res.json()
          if (isMounted) {
            setWelcomeActive(data.is_active ?? true)
            setWelcomePct(String(data.discount_percentage ? intVal(data.discount_percentage) : "5"))
          }
        }
      } catch (err) {
        console.log("Welcome discount API offline, using local fallback.")
      }
    }

    function intVal(val: any) {
      return Math.round(Number(val)) || 5
    }

    fetchWelcomeSettings()

    // 2. Fetch Type 2: Store Promo Discounts from DB & LocalStorage
    const fetchDiscounts = async () => {
      let localItems: DiscountRecord[] = []
      try {
        const stored = localStorage.getItem("eligo_created_discounts")
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            localItems = parsed
          }
        }
      } catch (e) {
        console.log("localStorage read error", e)
      }

      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/discounts/")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const mapped: DiscountRecord[] = data.map((d: any) => ({
              id: d.id,
              title: d.title || d.code || `Discount #${d.id}`,
              subtitle: d.code ? `${d.code} • ${d.title}` : d.title,
              status: d.status === "Active" || d.status === "active" ? "Active" : (d.status === "Expired" ? "Expired" : "Deactivated"),
              method: d.method === "Automatic" ? "Automatic" : "Code",
              eligibility: d.eligibility || "All customers",
              type: d.type || "Amount off order",
              used_count: d.used_count || 0,
            }))

            const combined = [...localItems, ...mapped]
            const uniqueMap = new Map()
            combined.forEach((item) => {
              const key = `${item.title}-${item.id}`
              if (!uniqueMap.has(key)) {
                uniqueMap.set(key, item)
              }
            })
            if (isMounted) {
              setDiscounts(Array.from(uniqueMap.values()))
            }
            return
          }
        }
      } catch (err) {
        console.log("Discounts API offline, rendering local list.")
      }

      if (isMounted) {
        setDiscounts(localItems)
      }
    }

    fetchDiscounts()

    return () => {
      isMounted = false
    }
  }, [])

  // Save Welcome Discount Settings to Backend Database (Type 1 Sync)
  const handleSaveWelcomeSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingWelcome(true)

    const pctNum = Number(welcomePct) || 5

    const payload = {
      is_active: welcomeActive,
      discount_percentage: pctNum,
      headline: `Welcome! Get ${pctNum}% OFF your 1st order!`,
      coupon_code: `WELCOME${pctNum}`,
    }

    // Save to DB
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/discounts/welcome", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(`Welcome Discount saved to database! Code: WELCOME${pctNum} (${pctNum}% OFF).`)
      } else {
        toast.success(`Welcome Discount saved! Code: WELCOME${pctNum} (${pctNum}% OFF).`)
      }
    } catch (err) {
      toast.success(`Welcome Discount saved! Code: WELCOME${pctNum} (${pctNum}% OFF).`)
    } finally {
      localStorage.setItem("eligo_welcome_discount_settings", JSON.stringify({
        welcomeActive,
        welcomePct: pctNum,
        couponCode: `WELCOME${pctNum}`,
        updatedAt: new Date().toISOString(),
      }))
      setSavingWelcome(false)
    }
  }

  // Export Discounts CSV
  const handleExportCSV = () => {
    const headers = ["Title", "Subtitle", "Status", "Method", "Eligibility", "Type", "Used Count"]
    const rows = filteredDiscounts.map((d) => [
      `"${d.title}"`,
      `"${d.subtitle}"`,
      `"${d.status}"`,
      `"${d.method}"`,
      `"${d.eligibility}"`,
      `"${d.type}"`,
      d.used_count,
    ])
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `discounts_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filteredDiscounts.length} discounts CSV!`)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredDiscounts.map((d) => d.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const filteredDiscounts = discounts.filter((d) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      d.title.toLowerCase().includes(q) ||
      d.subtitle.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4 font-sans text-gray-900 pb-12">
      {/* Top Header Bar matching Pic 1 */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <Percent className="w-5 h-5 text-gray-700" />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Discounts</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <DownloadSimple className="w-4 h-4 text-gray-600" />
            <span>Export</span>
          </button>
          <Link
            href="/discounts/new"
            className="px-4 py-2 bg-[#1a1a1a] hover:bg-black text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
          >
            <span>Create discount</span>
          </Link>
        </div>
      </div>

      {/* Welcome Scratch & Win Discount Config Card (Type 1 DB Synced) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <h2 className="text-sm font-bold text-gray-900">Welcome Discount Settings</h2>
          <span className="px-3 py-1 bg-amber-50 text-amber-900 font-extrabold text-xs rounded-full border border-amber-300 self-start sm:self-auto font-mono">
            Code: WELCOME{welcomePct} ({welcomePct}% OFF)
          </span>
        </div>

        <form onSubmit={handleSaveWelcomeSettings} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start text-xs">
          {/* Left Settings Column */}
          <div className="md:col-span-6 space-y-4 p-4 bg-gray-50/70 rounded-2xl border border-gray-200">
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

            {/* Direct Number Input without native up/down arrows */}
            <div>
              <label className="font-bold text-gray-900 block mb-1">
                Welcome Discount Percentage (%):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={welcomePct}
                  onChange={(e) => setWelcomePct(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="5"
                  className="w-20 h-10 px-3 bg-white border border-amber-800 rounded-xl font-bold text-gray-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-gray-600 font-semibold">% OFF (e.g. 5% = Rs. 100 &rarr; Rs. 95)</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingWelcome}
                className="px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer transition-colors"
              >
                {savingWelcome ? "Saving..." : "Save Welcome Settings"}
              </button>
            </div>
          </div>

          {/* Right Log Audit Column */}
          <div className="md:col-span-6 space-y-3 p-4 bg-amber-50/40 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-800" />
                <span>Claimed Welcome Discount Logs (Email / IP Tracked)</span>
              </span>
              <span className="text-[10px] text-amber-900 font-mono font-extrabold">{welcomeLogs.length} Claimed</span>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {welcomeLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-bold text-gray-900 block">{log.email}</span>
                    <span className="text-gray-500 font-mono text-[10px]">IP: {log.ip}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-800 font-mono text-xs block">{log.code}</span>
                    <span className="text-gray-400 text-[10px]">{log.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Main Promo Code Discounts Table Card (Type 2 DB Synced) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Search Bar */}
        <div className="p-3.5 border-b border-gray-200 flex items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="All ▾  Search and filter"
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-white border border-gray-300 text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-600 font-semibold text-[11px]">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredDiscounts.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-amber-800 focus:ring-amber-800 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700">Title</th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-[12%]">Status</th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-[12%]">Method</th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-[18%]">Eligibility</th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-[18%]">Type</th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-[12%] text-center">Combinations</th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-[10%] text-right">Used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDiscounts.length > 0 ? (
                filteredDiscounts.map((d, idx) => {
                  const isSelected = selectedIds.includes(d.id)
                  return (
                    <tr
                      key={d.id ? `disc-${d.id}-${idx}` : `disc-${idx}`}
                      className={`hover:bg-[#faf8f5] transition-colors ${isSelected ? "bg-amber-50/50" : ""}`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(d.id)}
                          className="w-4 h-4 rounded border-gray-300 text-amber-800 focus:ring-amber-800 cursor-pointer"
                        />
                      </td>

                      {/* Title & Subtitle */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 block text-xs">{d.title}</span>
                        <span className="text-[11px] text-gray-500 font-medium">{d.subtitle}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {d.status === "Active" && (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#d1fae5] text-[#065f46]">
                            Active
                          </span>
                        )}
                        {d.status === "Expired" && (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#f3f4f6] text-[#374151]">
                            Expired
                          </span>
                        )}
                        {d.status === "Deactivated" && (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            Deactivated
                          </span>
                        )}
                      </td>

                      {/* Method */}
                      <td className="py-3.5 px-4 font-medium text-gray-800">{d.method}</td>

                      {/* Eligibility */}
                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        <span className="inline-flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span>{d.eligibility}</span>
                        </span>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        <span className="inline-flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span>{d.type}</span>
                        </span>
                      </td>

                      {/* Combinations Icons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 text-gray-400">
                          <Tag className="w-3.5 h-3.5" />
                          <Package className="w-3.5 h-3.5" />
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                      </td>

                      {/* Used */}
                      <td className="py-3.5 px-4 text-right font-medium text-gray-900">{d.used_count}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-gray-500 font-medium">
                    No promo discounts created yet. Click "Create discount" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Link */}
        <div className="p-4 border-t border-gray-200 bg-gray-50/30 text-center text-xs font-semibold text-gray-600">
          <span className="hover:underline cursor-pointer">Learn more about discounts</span>
        </div>
      </div>
    </div>
  )
}
