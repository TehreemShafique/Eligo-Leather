"use client"

import { useState } from "react"
import { Gift, Plus, CheckCircle } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminGiftCardsPage() {
  const giftCards = [
    {
      id: 1,
      code: "•••• •••• •••• 9842",
      customer: "Bilal Hussain Abbasi",
      balance: "Rs. 5,000",
      initialValue: "Rs. 5,000",
      status: "Active",
      created: "Feb 8, 2026",
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gift Cards"
        icon={<Gift className="w-5 h-5" />}
        actions={
          <>
            <button
              onClick={() => toast.info("Add gift card product dialog opened...")}
              className="eligo-btn-secondary"
            >
              <Gift className="w-4 h-4 text-amber-800" />
              <span>Add gift card product</span>
            </button>
            <button
              onClick={() => toast.success("Issue gift card drawer opened!")}
              className="eligo-btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Issue gift card</span>
            </button>
          </>
        }
      />

      {/* Gift Cards Table */}
      <div className="eligo-card overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Issued Store Gift Cards ({giftCards.length})</h2>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th">Gift Card Code</th>
                <th className="eligo-th">Customer Name</th>
                <th className="eligo-th w-[12%]">Status</th>
                <th className="eligo-th w-[16%]">Initial Value</th>
                <th className="eligo-th w-[18%] text-right">Remaining Balance</th>
              </tr>
            </thead>
            <tbody>
              {giftCards.map((card) => (
                <tr key={card.id} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td font-mono font-bold text-amber-800">{card.code}</td>
                  <td className="eligo-td font-semibold text-gray-900">{card.customer}</td>
                  <td className="eligo-td">
                    <span className="eligo-badge bg-emerald-100 text-emerald-800 border-emerald-200">
                      {card.status}
                    </span>
                  </td>
                  <td className="eligo-td font-semibold text-gray-700">{card.initialValue}</td>
                  <td className="eligo-td text-right font-bold text-gray-900">{card.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
