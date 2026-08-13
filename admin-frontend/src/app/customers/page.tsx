"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Users,
  Plus,
  DownloadSimple,
  UploadSimple,
  MagnifyingGlass,
  Sliders,
  Sparkle,
  Eye,
  EyeSlash,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminCustomersPage() {
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false)

  // Toggleable columns state
  const [columns, setColumns] = useState({
    email: true,
    location: true,
    subscription: true,
    orders: true,
    amountSpent: true,
    phone: false,
    postalCode: false,
    language: false,
    taxExempt: false,
  })

  const customers = [
    {
      id: 1,
      name: "Sajid Watto",
      email: "sajidwatto155@gmail.com",
      phone: "+92 300 1234567",
      location: "Lahore, Pakistan",
      subscription: "Subscribed",
      ordersCount: 1,
      amountSpent: "Rs. 2,799.00",
    },
    {
      id: 2,
      name: "Muhammad Usama Shakeel",
      email: "usama.shakeel@example.com",
      phone: "+92 321 9876543",
      location: "Islamabad, Pakistan",
      subscription: "Subscribed",
      ordersCount: 3,
      amountSpent: "Rs. 30,990.00",
    },
    {
      id: 3,
      name: "Eligo Leather Corporate",
      email: "b2b@eligoleather.com",
      phone: "+92 51 5551234",
      location: "Pakistan",
      subscription: "Not subscribed",
      ordersCount: 0,
      amountSpent: "Rs. 0.00",
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        icon={<Users className="w-5 h-5" />}
        actions={
          <>
            <button
              onClick={() => toast.info("Exporting customer list...")}
              className="eligo-btn-secondary"
            >
              <DownloadSimple className="w-4 h-4 text-gray-600" />
              <span>Export</span>
            </button>
            <button
              onClick={() => toast.info("Importing customers CSV...")}
              className="eligo-btn-secondary"
            >
              <UploadSimple className="w-4 h-4 text-gray-600" />
              <span>Import</span>
            </button>
            <Link
              href="/customers/new"
              className="eligo-btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Add customer</span>
            </Link>
          </>
        }
      />

      {/* AI Segmentation Quick Filter Bar */}
      <div className="eligo-card bg-amber-50/70 border-amber-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-slide-up delay-75">
        <div className="flex items-center gap-2 font-bold text-amber-900 shrink-0">
          <Sparkle className="w-4 h-4 text-amber-800" />
          <span>Describe your segment with AI:</span>
        </div>
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="e.g. Customers in Pakistan who spent more than Rs 10,000 in the last 30 days..."
            className="eligo-input bg-white border-amber-300"
          />
        </div>
        <button
          onClick={() => toast.success("AI Segment created!")}
          className="eligo-btn-primary shrink-0"
        >
          Apply AI Filter
        </button>
      </div>

      {/* Data Table */}
      <div className="eligo-card overflow-hidden animate-slide-up delay-150">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customers..."
              className="eligo-input pl-9"
            />
          </div>

          {/* Table Column Configurator */}
          <div className="relative">
            <button
              onClick={() => setColumnsDropdownOpen(!columnsDropdownOpen)}
              className="eligo-btn-secondary"
            >
              <Sliders className="w-4 h-4 text-gray-500" />
              <span>Customize Columns</span>
            </button>

            {columnsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-3 space-y-2 text-xs animate-scale-in">
                <span className="font-bold text-gray-900 uppercase tracking-wide text-[10px] block border-b border-gray-100 pb-1">
                  Toggle Columns
                </span>
                <div className="space-y-1">
                  {Object.entries(columns).map(([colKey, isVisible]) => (
                    <label key={colKey} className="flex items-center justify-between p-1 hover:bg-gray-50 rounded cursor-pointer">
                      <span className="capitalize font-semibold text-gray-700">{colKey.replace(/([A-Z])/g, " $1")}</span>
                      <button
                        type="button"
                        onClick={() => setColumns({ ...columns, [colKey]: !isVisible })}
                        className="p-1 text-gray-500 hover:text-amber-800"
                      >
                        {isVisible ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeSlash className="w-4 h-4 text-gray-400" />}
                      </button>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th">Customer Name & Email</th>
                {columns.subscription && <th className="eligo-th w-[18%]">Email Subscription</th>}
                {columns.location && <th className="eligo-th w-[18%]">Location</th>}
                {columns.orders && <th className="eligo-th w-[10%]">Orders</th>}
                {columns.amountSpent && <th className="eligo-th w-[15%] text-right">Amount Spent</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td">
                    <Link href={`/customers/${c.id}`} className="font-bold text-amber-900 hover:underline block">
                      {c.name}
                    </Link>
                    <span className="text-[11px] text-gray-500 truncate block">{c.email}</span>
                  </td>
                  {columns.subscription && (
                    <td className="eligo-td">
                      <span
                        className={`eligo-badge ${
                          c.subscription === "Subscribed" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {c.subscription}
                      </span>
                    </td>
                  )}
                  {columns.location && <td className="eligo-td font-semibold text-gray-900">{c.location}</td>}
                  {columns.orders && <td className="eligo-td font-semibold text-gray-900">{c.ordersCount} orders</td>}
                  {columns.amountSpent && <td className="eligo-td text-right font-bold text-gray-900">{c.amountSpent}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
