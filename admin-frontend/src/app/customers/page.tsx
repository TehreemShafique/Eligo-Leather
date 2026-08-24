"use client"

import { API_BASE } from "@/lib/api"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  MagnifyingGlass,
  Sliders,
  Plus,
  DownloadSimple,
  UploadSimple,
  CaretLeft,
  CaretRight,
  Trash,
} from "@phosphor-icons/react"
import { toast } from "sonner"

interface CustomerRow {
  id: number
  displayName: string
  email: string | null
  name: string | null
  subscriptionStatus: "subscribed" | "not_subscribed" | null
  location: string
  ordersCount: number
  amountSpent: string
}

export default function AdminCustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(false)

  // Safe backend fetch with try/catch to prevent React overlay error
  useEffect(() => {
    let isMounted = true
    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/customers/`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data)) {
            const mapped: CustomerRow[] = data.map((c: any) => {
              const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ")
              const hasEmail = Boolean(c.email && c.email.trim().length > 0)
              
              // Rule: If customer gave email, display email in Customer name column.
              // If customer didn't give email, display name (or fallback) in Customer name column.
              const dispName = hasEmail ? c.email : (fullName || `Guest Customer #${c.id}`)

              let subStatus: "subscribed" | "not_subscribed" | null = null
              if (c.email_subscription === true) {
                subStatus = "subscribed"
              } else if (c.email_subscription === false && hasEmail) {
                subStatus = "not_subscribed"
              }

              return {
                id: c.id,
                displayName: dispName,
                name: fullName || null,
                email: c.email || null,
                subscriptionStatus: subStatus,
                location: c.location || (c.default_address?.city ? `${c.default_address.city}, Pakistan` : "Pakistan"),
                ordersCount: c.total_orders || 0,
                amountSpent: c.amount_spent ? `Rs ${Number(c.amount_spent).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Rs 0.00",
              }
            })

            setCustomers(mapped)
          }
        }
      } catch (err) {
        console.log("Backend offline, rendering empty customer catalog.")
      }
    }

    fetchCustomers()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredCustomers.map((c) => c.id))
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

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      c.displayName.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q))
    )
  })

  const handleExportCSV = () => {
    const headers = ["Customer name", "Email", "Email subscription", "Location", "Orders", "Amount spent"]
    const rows = filteredCustomers.map((c) => [
      `"${c.displayName}"`,
      `"${c.email || ''}"`,
      `"${c.subscriptionStatus || ''}"`,
      `"${c.location}"`,
      c.ordersCount,
      `"${c.amountSpent}"`,
    ])
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `customers_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filteredCustomers.length} customers CSV!`)
  }

  return (
    <div className="space-y-4 font-sans text-gray-900">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Customers</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage customer directory, email subscriptions, and order activity.</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="eligo-btn-secondary">
            <DownloadSimple className="w-4 h-4 text-gray-600" />
            <span>Export</span>
          </button>
          <Link href="/customers/new" className="eligo-btn-primary">
            <Plus className="w-4 h-4" />
            <span>Add customer</span>
          </Link>
        </div>
      </div>

      {/* Main Customers Card - Styled Exactly like Uploaded Picture */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Search Header Bar */}
        <div className="p-3.5 border-b border-gray-200 flex items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers"
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-white border border-gray-300 text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
            />
          </div>

          <button
            onClick={() => toast.info("Filter parameters updated")}
            className="p-2 text-gray-500 hover:text-black rounded-lg border border-gray-300 bg-white shadow-2xs hover:bg-gray-50 transition-colors"
            title="Filter Columns"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>

        {/* Customer Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredCustomers.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-amber-800 focus:ring-amber-800 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-semibold text-gray-600">Customer name</th>
                <th className="py-3 px-4 font-semibold text-gray-600 w-[20%]">Email subscription</th>
                <th className="py-3 px-4 font-semibold text-gray-600 w-[22%]">
                  <span className="border-b border-dashed border-gray-400 pb-0.5">Location</span>
                </th>
                <th className="py-3 px-4 font-semibold text-gray-600 w-[12%] text-center">Orders</th>
                <th className="py-3 px-4 font-semibold text-gray-600 w-[16%] text-right">Amount spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c, idx) => {
                  const isSelected = selectedIds.includes(c.id)
                  return (
                    <tr
                      key={c.id ? `cust-${c.id}-${idx}` : `cust-${idx}`}
                      className={`hover:bg-[#faf8f5] transition-colors ${
                        isSelected ? "bg-amber-50/50" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(c.id)}
                          className="w-4 h-4 rounded border-gray-300 text-amber-800 focus:ring-amber-800 cursor-pointer"
                        />
                      </td>

                      {/* Customer Name Column (Exact logic: Email if email provided, Name if no email) */}
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        <Link href={`/customers/${c.id}`} className="hover:underline">
                          {c.displayName}
                        </Link>
                      </td>

                      {/* Email Subscription Badge */}
                      <td className="py-3.5 px-4">
                        {c.subscriptionStatus === "subscribed" && (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#d1fae5] text-[#065f46]">
                            Subscribed
                          </span>
                        )}
                        {c.subscriptionStatus === "not_subscribed" && (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#f3f4f6] text-[#374151]">
                            Not subscribed
                          </span>
                        )}
                        {c.subscriptionStatus === null && <span className="text-gray-400">&mdash;</span>}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 font-medium text-gray-800">{c.location}</td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-4 text-center font-medium text-gray-900">{c.ordersCount}</td>

                      {/* Amount Spent */}
                      <td className="py-3.5 px-4 text-right font-medium text-gray-900">{c.amountSpent}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-gray-500 font-medium">
                    No matching customer records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination Bar */}
        <div className="p-3.5 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between text-xs text-gray-600 font-medium">
          <div className="flex items-center gap-1">
            <button className="p-1 rounded hover:bg-gray-200 disabled:opacity-30" disabled>
              <CaretLeft className="w-4 h-4" />
            </button>
            <button className="p-1 rounded hover:bg-gray-200">
              <CaretRight className="w-4 h-4" />
            </button>
          </div>
          <div>1-50</div>
        </div>
      </div>
    </div>
  )
}
