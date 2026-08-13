"use client"

import Link from "next/link"
import { ClipboardText, Plus, CheckCircle } from "@phosphor-icons/react"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminPurchaseOrdersPage() {
  const purchaseOrders = [
    {
      id: "PO4",
      supplier: "Sialkot Tannery Leather Supplies",
      destination: "Gulberg Empire, Islamabad",
      status: "Draft",
      paymentTerms: "Net 30",
      total: "Rs. 185,000",
      date: "Feb 8, 2026",
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Purchase Orders"
        icon={<ClipboardText className="w-5 h-5" />}
        actions={
          <Link
            href="/products/purchase-orders/new"
            className="eligo-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Create purchase order</span>
          </Link>
        }
      />

      {/* PO Table */}
      <div className="eligo-card overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Active Purchase Orders ({purchaseOrders.length})</h2>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th w-[10%]">PO Ref</th>
                <th className="eligo-th">Supplier</th>
                <th className="eligo-th">Destination</th>
                <th className="eligo-th w-[14%]">Payment Terms</th>
                <th className="eligo-th w-[10%]">Status</th>
                <th className="eligo-th w-[16%] text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td font-bold text-amber-800">
                    <Link href="/products/purchase-orders/new" className="hover:underline">#{po.id}</Link>
                  </td>
                  <td className="eligo-td font-semibold text-gray-900">{po.supplier}</td>
                  <td className="eligo-td text-gray-600">{po.destination}</td>
                  <td className="eligo-td text-gray-700 font-medium">{po.paymentTerms}</td>
                  <td className="eligo-td">
                    <span className="eligo-badge bg-amber-100 text-amber-800 border-amber-300">
                      {po.status}
                    </span>
                  </td>
                  <td className="eligo-td text-right font-bold text-gray-900">{po.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
