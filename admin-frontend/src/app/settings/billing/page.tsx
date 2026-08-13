"use client"

import { CreditCard, DownloadSimple, Receipt } from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminSettingsBillingPage() {
  return (
    <div className="space-y-6 font-sans max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
              <span>Financial Statements &amp; Payment Methods</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
            <p className="text-xs text-gray-500 mt-1">View payment methods, statements, and transaction history.</p>
          </div>
          <button
            onClick={() => toast.info("Payment method modal opened.")}
            className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl text-xs shadow-2xs"
          >
            Add payment method
          </button>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-amber-800" />
            <div>
              <span className="font-bold text-gray-900 block">Primary Payment Method</span>
              <span className="text-gray-500">Visa ending in 4242 &bull; Expires 12/28</span>
            </div>
          </div>
          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[11px]">
            Active
          </span>
        </div>
      </div>
    </div>
  )
}
