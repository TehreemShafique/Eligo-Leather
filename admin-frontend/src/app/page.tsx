"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ShoppingBagOpen,
  Tag,
  Users,
  TrendUp,
  ArrowUpRight,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  CurrencyCircleDollar,
} from "@phosphor-icons/react"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminHomePage() {
  const [orders, setOrders] = useState([
    { id: "#1022", customer: "Muhammad Ali", items: "ARDOR Bifold Wallet × 1", total: "Rs. 1,699", status: "Paid", fulfillment: "Unfulfilled", date: "Today, 2:15 PM" },
    { id: "#1021", customer: "Usman Tariq", items: "SOVEREIGN Belt × 1", total: "Rs. 2,499", status: "Paid", fulfillment: "Fulfilled", date: "Today, 11:30 AM" },
    { id: "#1020", customer: "Hamza Sheikh", items: "HERALD Glasses Case × 2", total: "Rs. 2,998", status: "Pending", fulfillment: "Unfulfilled", date: "Yesterday" },
    { id: "#1019", customer: "Ayesha Khan", items: "MONARCH Key Organizer × 1", total: "Rs. 1,399", status: "Paid", fulfillment: "Fulfilled", date: "Feb 7, 2026" },
  ])

  const stats = [
    { name: "Total Sales", value: "Rs. 248,500", change: "+14.2%", icon: CurrencyCircleDollar, isPositive: true },
    { name: "Total Orders", value: "22", change: "+8 new today", icon: ShoppingBagOpen, isPositive: true },
    { name: "Active Customers", value: "1,420", change: "+5.4%", icon: Users, isPositive: true },
    { name: "Store Products", value: "48", change: "4 Categories", icon: Tag, isPositive: true },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Welcome back, Bilal"
        icon={<TrendUp className="w-5 h-5" />}
        actions={
          <>
            <Link href="/products/new" className="eligo-btn-primary">
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </Link>
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="eligo-btn-secondary"
            >
              <span>View Store</span>
              <ArrowUpRight className="w-4 h-4 text-gray-500" />
            </a>
          </>
        }
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="eligo-card eligo-card-hover animate-slide-up p-5 flex flex-col justify-between space-y-4"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  {stat.name}
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-800/10 text-amber-800 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <TrendUp className="w-3 h-3" />
                  <span>{stat.change}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="eligo-card overflow-hidden animate-slide-up delay-150">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Latest orders from your customers
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

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th w-[12%]">Order</th>
                <th className="eligo-th w-[20%]">Customer</th>
                <th className="eligo-th">Items</th>
                <th className="eligo-th w-[12%]">Total</th>
                <th className="eligo-th w-[12%]">Payment</th>
                <th className="eligo-th w-[13%]">Fulfillment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td font-bold text-amber-800">{order.id}</td>
                  <td className="eligo-td font-semibold text-gray-900">{order.customer}</td>
                  <td className="eligo-td text-gray-600 truncate">{order.items}</td>
                  <td className="eligo-td font-bold text-gray-900">{order.total}</td>
                  <td className="eligo-td">
                    <span
                      className={`eligo-badge ${
                        order.status === "Paid"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-amber-100 text-amber-900 border-amber-300"
                      }`}
                    >
                      {order.status === "Paid" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {order.status}
                    </span>
                  </td>
                  <td className="eligo-td">
                    <span
                      className={`eligo-badge ${
                        order.fulfillment === "Fulfilled"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {order.fulfillment}
                    </span>
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
