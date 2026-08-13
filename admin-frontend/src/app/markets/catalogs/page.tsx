"use client"

import { useState } from "react"
import Link from "next/link"
import { Tag, Plus, DownloadSimple, UploadSimple, Sparkle } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminCatalogsPage() {
  const catalogs = [
    {
      id: 1,
      title: "Pakistan Standard Retail Catalog",
      status: "Active",
      market: "Pakistan (Primary)",
      adjustment: "Base Store Price (PKR Rs)",
      productsCount: 48,
    },
    {
      id: 2,
      title: "B2B Corporate VIP Catalog (15% Off)",
      status: "Active",
      market: "B2B Corporate Accounts",
      adjustment: "Decrease 15%",
      productsCount: 48,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Catalogs"
        icon={<Tag className="w-5 h-5" />}
        actions={
          <>
            <button
              onClick={() => toast.info("Exporting catalogs...")}
              className="eligo-btn-secondary"
            >
              <DownloadSimple className="w-4 h-4 text-gray-600" />
              <span>Export</span>
            </button>
            <button
              onClick={() => toast.info("Importing catalog CSV...")}
              className="eligo-btn-secondary"
            >
              <UploadSimple className="w-4 h-4 text-gray-600" />
              <span>Import</span>
            </button>
            <Link
              href="/markets/catalogs/new"
              className="eligo-btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Create catalog</span>
            </Link>
          </>
        }
      />

      {/* Landing State Hero Card (Matching image_195515.png) */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-2xs text-center max-w-3xl mx-auto space-y-4">
        <div className="w-16 h-16 bg-amber-800/10 text-amber-800 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <Tag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Personalize buying with catalogs</h2>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Create custom product and pricing offerings for your customers, B2B buyers, or specific markets with custom price adjustments.
        </p>
        <div className="pt-2">
          <Link
            href="/markets/catalogs/new"
            className="px-6 py-3 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-xl shadow-md transition-colors inline-block"
          >
            Create catalog
          </Link>
        </div>
      </div>

      {/* Active Catalogs Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Configured Catalogs ({catalogs.length})</h2>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th">Catalog Title</th>
                <th className="eligo-th w-[10%]">Status</th>
                <th className="eligo-th">Assigned Market</th>
                <th className="eligo-th">Price Adjustment</th>
                <th className="eligo-th w-[18%] text-right">Products Included</th>
              </tr>
            </thead>
            <tbody>
              {catalogs.map((cat) => (
                <tr key={cat.id} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td font-bold text-amber-800">
                    <Link href="/markets/catalogs/new" className="hover:underline">{cat.title}</Link>
                  </td>
                  <td className="eligo-td">
                    <span className="eligo-badge bg-emerald-100 text-emerald-800 border-emerald-200">
                      {cat.status}
                    </span>
                  </td>
                  <td className="eligo-td font-semibold text-gray-900">{cat.market}</td>
                  <td className="eligo-td font-bold text-gray-900">{cat.adjustment}</td>
                  <td className="eligo-td text-right font-semibold text-gray-900">{cat.productsCount} products</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
