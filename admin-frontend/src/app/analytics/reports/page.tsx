"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, Plus, MagnifyingGlass, Funnel, CaretDown, Check } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)

  const categories = [
    "All Categories",
    "Acquisition",
    "Behavior",
    "Customers",
    "Finances",
    "Fraud",
    "Inventory",
    "Marketing",
    "Orders",
    "Performance",
    "Profit Margin",
    "Retail Sales",
    "Sales",
    "Store",
  ]

  const reportsList = [
    {
      name: "Items ordered over time",
      category: "Orders",
      lastViewed: "Today, 2:15 PM",
      createdBy: "Shopify System",
    },
    {
      name: "Orders over time",
      category: "Orders",
      lastViewed: "Yesterday, 4:30 PM",
      createdBy: "Shopify System",
    },
    {
      name: "Sessions over time",
      category: "Behavior",
      lastViewed: "Today, 11:00 AM",
      createdBy: "Shopify System",
    },
    {
      name: "Total sales by vendor",
      category: "Sales",
      lastViewed: "Feb 5, 2026",
      createdBy: "Bilal Hussain Abbasi",
    },
    {
      name: "Month-end inventory snapshot",
      category: "Inventory",
      lastViewed: "Jan 31, 2026",
      createdBy: "Shopify System",
    },
    {
      name: "Products by days of inventory remaining",
      category: "Inventory",
      lastViewed: "Feb 2, 2026",
      createdBy: "Shopify System",
    },
    {
      name: "Net sales by order",
      category: "Finances",
      lastViewed: "Feb 4, 2026",
      createdBy: "Bilal Hussain Abbasi",
    },
    {
      name: "Cost of goods sold by order",
      category: "Profit Margin",
      lastViewed: "Jan 28, 2026",
      createdBy: "Bilal Hussain Abbasi",
    },
  ]

  const filteredReports = selectedCategory === "All Categories"
    ? reportsList
    : reportsList.filter((r) => r.category === selectedCategory)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        icon={<FileText className="w-5 h-5" />}
        actions={
          <button
            onClick={() => toast.success("New custom exploration report created!")}
            className="eligo-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>New exploration</span>
          </button>
        }
      />

      {/* Search & Category Filter Bar */}
      <div className="eligo-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up delay-75">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Category Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="eligo-btn-secondary"
            >
              <Funnel className="w-4 h-4 text-amber-800" />
              <span>Category: {selectedCategory}</span>
              <CaretDown className="w-3.5 h-3.5 text-gray-500 ml-1" />
            </button>

            {categoryDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-2 space-y-1 text-xs animate-scale-in">
                <span className="font-bold text-gray-900 uppercase tracking-wide text-[10px] block border-b border-gray-100 pb-1">
                  13 Business Domains
                </span>
                <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat)
                        setCategoryDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 font-semibold hover:bg-amber-50 hover:text-amber-800 transition-colors flex items-center justify-between ${
                        selectedCategory === cat ? "text-amber-800 font-bold bg-amber-50/60" : "text-gray-700"
                      }`}
                    >
                      <span>{cat}</span>
                      {selectedCategory === cat && <Check className="w-3.5 h-3.5 text-amber-800" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative flex-1 sm:w-72">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reports by title or domain..."
              className="eligo-input pl-9"
            />
          </div>
        </div>
      </div>

      {/* Main Reports Data Table */}
      <div className="eligo-card overflow-hidden animate-slide-up delay-150">
        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th">Report Name</th>
                <th className="eligo-th w-[15%]">Category</th>
                <th className="eligo-th w-[20%]">Last Viewed</th>
                <th className="eligo-th w-[22%] text-right">Created By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReports.map((rep, idx) => (
                <tr key={idx} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td font-bold text-amber-900 hover:underline cursor-pointer truncate">{rep.name}</td>
                  <td className="eligo-td">
                    <span className="eligo-badge bg-amber-100 text-amber-900 border-amber-200">
                      {rep.category}
                    </span>
                  </td>
                  <td className="eligo-td text-gray-500">{rep.lastViewed}</td>
                  <td className="eligo-td text-right font-semibold text-gray-900">{rep.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
