"use client"

import Link from "next/link"
import { ArrowsLeftRight, Plus, CheckCircle } from "@phosphor-icons/react"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminTransfersPage() {
  const transfers = [
    {
      id: "TR1001",
      origin: "Main Leather Tannery, Sialkot",
      destination: "Gulberg Empire, Islamabad",
      status: "In transit",
      linkedPO: "#PO4",
      itemsCount: "45 items",
      date: "28 July 2026",
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transfers"
        icon={<ArrowsLeftRight className="w-5 h-5" />}
        actions={
          <Link
            href="/products/transfers/new"
            className="eligo-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Create transfer</span>
          </Link>
        }
      />

      {/* Transfers Table */}
      <div className="eligo-card overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Active Inventory Transfers ({transfers.length})</h2>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th w-[10%]">Transfer Ref</th>
                <th className="eligo-th">Origin Location</th>
                <th className="eligo-th">Destination Warehouse</th>
                <th className="eligo-th w-[10%]">Linked PO</th>
                <th className="eligo-th w-[10%]">Status</th>
                <th className="eligo-th w-[18%] text-right">Items &amp; Date</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((tr) => (
                <tr key={tr.id} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td font-bold text-amber-800">
                    <Link href="/products/transfers/new" className="hover:underline">#{tr.id}</Link>
                  </td>
                  <td className="eligo-td font-semibold text-gray-900">{tr.origin}</td>
                  <td className="eligo-td text-gray-600">{tr.destination}</td>
                  <td className="eligo-td font-mono font-bold text-amber-800">{tr.linkedPO}</td>
                  <td className="eligo-td">
                    <span className="eligo-badge bg-blue-100 text-blue-800 border-blue-200">
                      {tr.status}
                    </span>
                  </td>
                  <td className="eligo-td text-right font-semibold text-gray-900">{tr.itemsCount} &bull; {tr.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
