"use client"

import { Target, Plus, CurrencyCircleDollar, CheckCircle, Clock } from "@phosphor-icons/react"
import { toast } from "sonner"
import { MOCK_CAMPAIGNS } from "@/modules/growth/api"

export default function AdminCampaignsPage() {
  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Campaigns</h1>
          <p className="text-xs text-gray-500 mt-1">Manage online and offline promotional campaigns, track budgets, ad spend, and revenue generation.</p>
        </div>
        <button
          onClick={() => toast.success("New campaign setup drawer opened!")}
          className="px-4 py-2.5 bg-amber-800 text-white text-xs font-semibold rounded-xl hover:bg-amber-900 transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Campaign</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_CAMPAIGNS.map((camp) => (
          <div key={camp.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  camp.status === "Active"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {camp.status}
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                {camp.touchpoints_count} Touchpoints
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-snug">{camp.title}</h2>
              <p className="text-xs text-gray-500 mt-1">Created on {camp.created_at}</p>
            </div>

            <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs text-gray-700">
              <div className="flex justify-between">
                <span>Budget Spent:</span>
                <span className="font-bold text-gray-900">Rs. {(camp.spent ?? 0).toLocaleString()} / Rs. {(camp.budget ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Revenue Generated:</span>
                <span className="font-bold text-emerald-700">Rs. {(camp.revenue_generated ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Target Conversion:</span>
                <span className="font-semibold text-gray-900">{camp.target_conversion_rate}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
