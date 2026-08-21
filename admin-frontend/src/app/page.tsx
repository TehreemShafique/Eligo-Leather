"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Hourglass,
  TrendUp,
  Truck,
} from "@phosphor-icons/react"
import { PageHeader } from "@/components/layout/page-header"

interface OrderItem {
  product_name: string
  quantity: number
  variant_title: string | null
}

interface Order {
  id: number
  order_number: string
  customer_id: number | null
  customer_name: string | null
  total_price: number
  payment_status: string
  fulfillment_status: string
  delivery_status: string
  created_at: string
  items: OrderItem[]
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffSec = Math.floor((now - then) / 1000)
  if (diffSec < 60) return "Just now"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function AdminHomePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("eligo_admin_token")
        const res = await fetch("http://localhost:8000/api/v1/orders/?limit=10&skip=0", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error("Failed to fetch orders")
        const data = await res.json()
        setOrders(data)
        setError(null)
      } catch {
        setError("Could not load recent orders")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const getOrderItems = (items: OrderItem[]) =>
    items.map((i) => `${i.product_name}${i.variant_title ? ` (${i.variant_title})` : ""} × ${i.quantity}`).join(", ") || "—"

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
        return <span className="eligo-badge bg-gray-100 text-gray-700 border-gray-200"><Hourglass className="w-3 h-3" />Unfulfilled</span>
      case "partial":
        return <span className="eligo-badge bg-purple-100 text-purple-800 border-purple-200">Partial</span>
      default:
        return <span className="eligo-badge bg-gray-100 text-gray-700 border-gray-200">{status}</span>
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Welcome to Eligo Leather"
        icon={<TrendUp className="w-5 h-5" />}
      />

      <div className="eligo-card overflow-hidden animate-slide-up">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Latest Orders</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Real-time orders from your store
            </p>
          </div>
          <Link
            href="/orders"
            className="text-xs font-bold text-amber-800 hover:text-amber-900 hover:underline inline-flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-amber-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <span className="text-xs text-gray-500 font-semibold">{error}</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <span className="text-xs text-gray-500 font-semibold">No orders yet</span>
          </div>
        ) : (
          <div className="eligo-table-wrap">
            <table className="eligo-table">
              <thead>
                <tr>
                  <th className="eligo-th w-[10%]">Order</th>
                  <th className="eligo-th w-[18%]">Customer</th>
                  <th className="eligo-th">Items</th>
                  <th className="eligo-th w-[10%]">Total</th>
                  <th className="eligo-th w-[12%]">Payment</th>
                  <th className="eligo-th w-[13%]">Fulfillment</th>
                  <th className="eligo-th w-[10%]">When</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#faf9f7] transition-colors cursor-pointer">
                    <td className="eligo-td font-bold text-amber-800">{order.order_number}</td>
                    <td className="eligo-td font-semibold text-gray-900">{order.customer_name || "Guest"}</td>
                    <td className="eligo-td text-gray-600 truncate max-w-[200px]" title={getOrderItems(order.items)}>
                      {getOrderItems(order.items)}
                    </td>
                    <td className="eligo-td font-bold text-gray-900">Rs. {Number(order.total_price).toLocaleString()}</td>
                    <td className="eligo-td">{getPaymentBadge(order.payment_status)}</td>
                    <td className="eligo-td">{getFulfillmentBadge(order.fulfillment_status)}</td>
                    <td className="eligo-td text-gray-500 text-[11px]">{timeAgo(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
