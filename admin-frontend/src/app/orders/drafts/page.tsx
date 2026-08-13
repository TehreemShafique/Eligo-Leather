"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, ShoppingBagOpen, Tag, Envelope, Phone, Globe, CheckCircle, Clock } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminDraftOrdersPage() {
  const [drafts, setDrafts] = useState([
    {
      id: 1,
      draft_number: "#D1001",
      customer_name: "Usman Tariq",
      customer_email: "usman.t@example.com",
      customer_phone: "+92 333 4567890",
      items: "Custom Engraved Leather Wallet x 1",
      subtotal: "2,000",
      discount: "100",
      shipping_cost: "299",
      tax: "0",
      total_price: "Rs. 2,199",
      currency: "PKR",
      market: "Pakistan (Domestic)",
      status: "open",
      shipping_address: "House 42, Street 8, F-7/2, Islamabad",
      note: "Customer requested custom laser initial engraving 'U.T.'",
      tags: "Custom Laser, Phone Order",
      created_at: "Feb 8, 2026, 11:30 AM",
    },
    {
      id: 2,
      draft_number: "#D1002",
      customer_name: "Ayesha Khan",
      customer_email: "ayesha.k@example.com",
      customer_phone: "+92 300 9876543",
      items: "Leather Belt + Key Organizer Gift Bundle",
      subtotal: "3,500",
      discount: "200",
      shipping_cost: "199",
      tax: "0",
      total_price: "Rs. 3,499",
      currency: "PKR",
      market: "Pakistan (Domestic)",
      status: "invoice_sent",
      shipping_address: "Flat 4B, Silver Heights, Gulberg III, Lahore",
      note: "Email invoice dispatched via Resend API",
      tags: "VIP Customer, Gift Box",
      created_at: "Feb 7, 2026, 04:15 PM",
    },
  ])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Draft Orders"
        icon={<ShoppingBagOpen className="w-5 h-5" />}
        actions={
          <Link
            href="/orders/drafts/new"
            className="eligo-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Create Draft Order</span>
          </Link>
        }
      />

      {/* Table Container */}
      <div className="eligo-card overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b border-gray-200 flex justify-between items-center text-xs">
          <span className="font-bold text-gray-900">{drafts.length} Active Draft Orders</span>
          <span className="font-mono text-gray-400">DB Model: `DraftOrder`</span>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th w-[12%]">Draft #</th>
                <th className="eligo-th">Customer &amp; Contact Info</th>
                <th className="eligo-th">Market &amp; Location</th>
                <th className="eligo-th w-[12%]">Status</th>
                <th className="eligo-th w-[18%]">Subtotal &amp; Discount</th>
                <th className="eligo-th w-[14%] text-right">Total Price</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((d) => (
                <tr key={d.id} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td font-bold text-amber-800">
                    <div>{d.draft_number}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{d.created_at}</div>
                  </td>
                  <td className="eligo-td">
                    <div className="font-bold text-gray-900 truncate">{d.customer_name}</div>
                    <div className="text-[11px] text-gray-500 font-mono truncate">{d.customer_email} &bull; {d.customer_phone}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">{d.items}</div>
                  </td>
                  <td className="eligo-td">
                    <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-800 text-[10px] font-semibold rounded-full inline-flex items-center gap-1">
                      <Globe className="w-3 h-3 text-amber-800" />
                      <span>{d.market}</span>
                    </span>
                    <div className="text-[10px] text-gray-400 truncate max-w-xs mt-0.5">{d.shipping_address}</div>
                  </td>
                  <td className="eligo-td">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{d.status}</span>
                    </span>
                  </td>
                  <td className="eligo-td text-gray-700">
                    <div>Subtotal: Rs. {d.subtotal}</div>
                    <div className="text-emerald-700 text-[11px]">Discount: -Rs. {d.discount}</div>
                  </td>
                  <td className="eligo-td font-bold text-gray-900 text-right">
                    {d.total_price}
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
