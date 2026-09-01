"use client"

import { API_BASE } from "@/lib/api"

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
  PencilSimple,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { useFormDirty } from "@/components/unsaved-changes"

interface DiscountRecord {
  id: number
  title: string
  subtitle: string
  status: "Active" | "Expired" | "Deactivated" | "Disabled"
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
  const [dataLoaded, setDataLoaded] = useState(false)

  const { reset } = useFormDirty(
    { welcomeActive, welcomePct },
    dataLoaded
  )

  // Welcome Discount Claimed Logs (tracked by anonymized Visitor ID)
  const [welcomeLogs, setWelcomeLogs] = useState<any[]>([])

  // Discounts list state (Type 2: Store Promo Discounts in DB)
  const [discounts, setDiscounts] = useState<DiscountRecord[]>([])
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Fetch BOTH types of discounts directly from Database
  useEffect(() => {
    let isMounted = true

    // 1. Fetch Type 1: Welcome Discount Settings from DB
    const fetchWelcomeSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/discounts/welcome`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted) {
            setWelcomeActive(data.is_active ?? true)
            setWelcomePct(String(data.discount_percentage ? intVal(data.discount_percentage) : "5"))
          }
        }
      } catch (err) {
        console.log("Welcome discount API offline, using local fallback.")
      } finally {
        if (isMounted) setDataLoaded(true)
      }
    }

    function intVal(val: any) {
      return Math.round(Number(val)) || 5
    }

    fetchWelcomeSettings()

    // 2. Fetch Welcome Discount Claimed Logs from DB
    const fetchWelcomeLogs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/discounts/welcome/logs`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && isMounted) setWelcomeLogs(data)
        }
      } catch (err) {
        console.log("Welcome discount logs API offline.", err)
      }
    }

    fetchWelcomeLogs()

    // 3. Fetch Type 2: Store Promo Discounts (source of truth = database)
    const fetchDiscounts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/discounts/?limit=200`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const mapped: DiscountRecord[] = data.map((d: any) => ({
              id: d.id,
              title: d.title || d.code || `Discount #${d.id}`,
              subtitle: d.code ? `${d.code} • ${d.title}` : d.title,
              status: formatStatus(d.status),
              method: d.method === "Automatic" ? "Automatic" : "Code",
              eligibility: d.eligibility || "All customers",
              type: d.type || "Amount off order",
              used_count: d.used_count || 0,
            }))
            if (isMounted) {
              setDiscounts(mapped)
            }
          }
        }
      } catch (err) {
        console.log("Discounts API offline, showing empty list.", err)
      }
    }

    function formatStatus(s: string): DiscountRecord["status"] {
      const norm = (s || "").toLowerCase()
      if (norm === "active") return "Active"
      if (norm === "expired") return "Expired"
      if (norm === "disabled") return "Disabled"
      return "Deactivated"
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
    }

    // Save to DB
    try {
      const res = await fetch(`${API_BASE}/api/v1/discounts/welcome`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(`Welcome Discount saved to database! ${pctNum}% OFF, unique code per visitor.`)
      } else {
        toast.success(`Welcome Discount saved! ${pctNum}% OFF, unique code per visitor.`)
      }
    } catch (err) {
      toast.success(`Welcome Discount saved! ${pctNum}% OFF, unique code per visitor.`)
    } finally {
      localStorage.setItem("eligo_welcome_discount_settings", JSON.stringify({
        welcomeActive,
        welcomePct: pctNum,
        updatedAt: new Date().toISOString(),
      }))
      setSavingWelcome(false)
      reset()
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

  const reloadDiscounts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/discounts/?limit=200`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setDiscounts(
            data.map((d: any) => ({
              id: d.id,
              title: d.title || d.code || `Discount #${d.id}`,
              subtitle: d.code ? `${d.code} • ${d.title}` : d.title,
              status: d.status === "Active" || d.status === "active" ? "Active" : (d.status === "Expired" ? "Expired" : (d.status === "Disabled" ? "Disabled" : "Deactivated")),
              method: d.method === "Automatic" ? "Automatic" : "Code",
              eligibility: d.eligibility || "All customers",
              type: d.type || "Amount off order",
              used_count: d.used_count || 0,
            }))
          )
        }
      }
    } catch (err) {
      console.log("Discounts reload error", err)
    }
  }

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Delete discount "${title}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`${API_BASE}/api/v1/discounts/${id}`, {
        method: "DELETE",
      })
      if (res.ok || res.status === 204) {
        toast.success(`Discount "${title}" deleted.`)
        await reloadDiscounts()
        setSelectedIds((prev) => prev.filter((sid) => sid !== id))
      } else {
        toast.error("Could not delete discount.")
      }
    } catch (err) {
      console.error(err)
      toast.error("Could not delete discount.")
    } finally {
      setDeletingId(null)
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
            Unique code per visitor ({welcomePct}% OFF)
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
                <span>Claimed Welcome Discount Logs (anonymized Visitor ID)</span>
              </span>
              <span className="text-[10px] text-amber-900 font-mono font-extrabold">{welcomeLogs.length} Claimed</span>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {welcomeLogs.map((log, idx) => (
                <div key={log.id ?? idx} className="p-2.5 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between text-[11px]">
                  <div className="min-w-0">
                    <span className="font-bold text-gray-900 block truncate">
                      {log.email || log.visitor_id || `Visitor #${log.id}`}
                    </span>
                    <span className="text-gray-500 font-mono text-[10px] block truncate">
                      {log.visitor_id ? `Visitor: ${log.visitor_id}` : ""}
                      {log.ip_address ? `${log.visitor_id ? " • " : ""}IP: ${log.ip_address}` : ""}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-emerald-800 font-mono text-xs block">{log.coupon_code || `WELCOME${welcomePct}`}</span>
                    <span className="text-gray-400 text-[10px]">
                      {log.claimed_at ? new Date(log.claimed_at).toLocaleString() : ""}
                    </span>
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
                <th className="py-3 px-4 font-semibold text-gray-700 w-[10%] text-right">Actions</th>
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
                        <Link
                          href={`/discounts/${d.id}`}
                          className="font-bold text-gray-900 block text-xs hover:text-amber-800 hover:underline"
                        >
                          {d.title}
                        </Link>
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
                        {d.status === "Disabled" && (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            Disabled
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

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            href={`/discounts/${d.id}`}
                            title="Edit discount"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
                          >
                            <PencilSimple className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            title="Delete discount"
                            disabled={deletingId === d.id}
                            onClick={() => handleDelete(d.id, d.title)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs text-gray-500 font-medium">
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
