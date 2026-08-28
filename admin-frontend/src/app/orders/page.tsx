"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ShoppingBagOpen,
  Plus,
  MagnifyingGlass,
  DownloadSimple,
  CheckCircle,
  Clock,
  Truck,
  X,
  Spinner,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import { apiFetch } from "@/lib/api"

interface OrderItem {
  id: number
  product_name: string
  quantity: number
  variant_title: string | null
  unit_price: number
  total_price: number
}

interface Order {
  id: number
  order_number: string
  customer_id: number | null
  customer_name: string | null
  channel: string
  total_price: number
  payment_status: string
  fulfillment_status: string
  delivery_status: string
  tags: string | null
  is_archived: boolean
  created_at: string
  items: OrderItem[]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

function escapeCsv(val: string | number | undefined | null) {
  const str = String(val ?? "").replace(/"/g, '""')
  return `"${str}"`
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "unfulfilled" | "fulfilled">("all")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchOrders = useCallback(async () => {
    try {
      const data = await apiFetch<Order[]>("/api/v1/orders/?limit=100&skip=0")
      setOrders(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Could not load orders from database")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "unfulfilled" && order.fulfillment_status === "fulfilled") return false
    if (activeTab === "fulfilled" && order.fulfillment_status !== "fulfilled") return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        order.order_number.toLowerCase().includes(q) ||
        (order.customer_name || "").toLowerCase().includes(q) ||
        order.items.some(i => i.product_name.toLowerCase().includes(q))
      )
    }
    return true
  })

  const handleExportCSV = () => {
    const listToExport = filteredOrders.length > 0 ? filteredOrders : orders
    if (listToExport.length === 0) {
      toast.error("No orders available to export.")
      return
    }

    const headers = [
      "Order Number",
      "Created At",
      "Customer Name",
      "Channel",
      "Payment Status",
      "Fulfillment Status",
      "Items",
      "Total (PKR)",
    ]

    const csvRows = [
      headers.join(","),
      ...listToExport.map((order) =>
        [
          escapeCsv(order.order_number),
          escapeCsv(formatDate(order.created_at)),
          escapeCsv(order.customer_name || "Guest"),
          escapeCsv(order.channel),
          escapeCsv(order.payment_status),
          escapeCsv(order.fulfillment_status),
          escapeCsv(order.items.map(i => `${i.product_name} x${i.quantity}`).join("; ")),
          escapeCsv(order.total_price),
        ].join(",")
      ),
    ]

    const csvString = "\uFEFF" + csvRows.join("\n")
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const today = new Date().toISOString().split("T")[0]
    link.href = url
    link.setAttribute("download", `eligo_orders_${today}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`Exported ${listToExport.length} order(s) to CSV!`)
  }

  const tabs = [
    { key: "all" as const, label: "All Orders", count: orders.length },
    { key: "unfulfilled" as const, label: "Unfulfilled", count: orders.filter(o => o.fulfillment_status !== "fulfilled").length },
    { key: "fulfilled" as const, label: "Fulfilled", count: orders.filter(o => o.fulfillment_status === "fulfilled").length },
  ]

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="eligo-badge bg-emerald-100 text-emerald-800 border-emerald-300"><CheckCircle className="w-3 h-3" />Paid</span>
      case "pending":
        return <span className="eligo-badge bg-amber-100 text-amber-900 border-amber-300"><Clock className="w-3 h-3" />Pending</span>
      case "refunded":
        return <span className="eligo-badge bg-rose-100 text-rose-700 border-rose-200">Refunded</span>
      case "partially_paid":
        return <span className="eligo-badge bg-orange-100 text-orange-800 border-orange-200">Partial</span>
      default:
        return <span className="eligo-badge bg-gray-100 text-gray-700 border-gray-200">{status}</span>
    }
  }

  const getFulfillmentBadge = (status: string) => {
    switch (status) {
      case "fulfilled":
        return <span className="eligo-badge bg-blue-100 text-blue-800 border-blue-200"><Truck className="w-3 h-3" />Fulfilled</span>
      case "unfulfilled":
        return <span className="eligo-badge bg-gray-100 text-gray-700 border-gray-200"><Clock className="w-3 h-3" />Unfulfilled</span>
      case "partial":
        return <span className="eligo-badge bg-purple-100 text-purple-800 border-purple-200">Partial</span>
      default:
        return <span className="eligo-badge bg-gray-100 text-gray-700 border-gray-200">{status}</span>
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customer Orders"
        icon={<ShoppingBagOpen className="w-5 h-5" />}
        actions={
          <>
            <button onClick={handleExportCSV} className="eligo-btn-secondary">
              <DownloadSimple className="w-4 h-4 text-amber-800" />
              <span>Export CSV</span>
            </button>
            <Link href="/orders/drafts/new" className="eligo-btn-primary">
              <Plus className="w-4 h-4" />
              <span>Create order</span>
            </Link>
          </>
        }
      />

      <div className="eligo-card overflow-hidden animate-slide-up">
        <div className="px-4 pt-3 pb-3 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === tab.key
                    ? "bg-amber-800 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative flex-1 lg:max-w-xs lg:ml-auto">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, customer, product..."
              className="eligo-input pl-9"
            />
          </div>
        </div>

        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="w-6 h-6 text-amber-800 animate-spin" />
          </div>
        ) : (
          <div className="eligo-table-wrap">
            <table className="eligo-table">
              <thead>
                <tr>
                  <th className="eligo-th w-[10%]">Order #</th>
                  <th className="eligo-th w-[18%]">Customer</th>
                  <th className="eligo-th">Items</th>
                  <th className="eligo-th w-[10%]">Total</th>
                  <th className="eligo-th w-[11%]">Payment</th>
                  <th className="eligo-th w-[12%]">Fulfillment</th>
                  <th className="eligo-th w-[12%]">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500 text-xs font-semibold">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#faf9f7] transition-colors">
                      <td className="eligo-td">
                        <Link href={`/orders/${encodeURIComponent(order.order_number)}`} className="font-bold text-amber-900 hover:underline">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="eligo-td font-semibold text-gray-900">{order.customer_name || "Guest"}</td>
                      <td className="eligo-td text-gray-600 truncate max-w-[200px]">
                        {order.items.map(i => `${i.product_name}${i.variant_title ? ` (${i.variant_title})` : ""} × ${i.quantity}`).join(", ") || "—"}
                      </td>
                      <td className="eligo-td font-bold text-gray-900">Rs. {Number(order.total_price).toLocaleString()}</td>
                      <td className="eligo-td">{getPaymentBadge(order.payment_status)}</td>
                      <td className="eligo-td">{getFulfillmentBadge(order.fulfillment_status)}</td>
                      <td className="eligo-td text-gray-500 text-[11px]">{formatDate(order.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
