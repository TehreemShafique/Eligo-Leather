"use client"

import { Globe, TrendUp, ArrowRight } from "@phosphor-icons/react"
import { MOCK_CHANNELS } from "@/modules/growth/api"

export default function AdminAttributionPage() {
  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <h1 className="text-2xl font-bold text-gray-900">Traffic & Referrer Attribution</h1>
        <p className="text-xs text-gray-500 mt-1">Detailed breakdown of referring domains, search keywords, organic vs paid sessions, and customer LTV.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs text-gray-700">
          <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-200">
            <tr>
              <th className="px-6 py-3.5">Channel / Referrer</th>
              <th className="px-6 py-3.5">Traffic Source URL</th>
              <th className="px-6 py-3.5 text-right">Impressions</th>
              <th className="px-6 py-3.5 text-right">Clicks</th>
              <th className="px-6 py-3.5 text-right">CTR (%)</th>
              <th className="px-6 py-3.5 text-right">New Customers</th>
              <th className="px-6 py-3.5 text-right">Returning Customers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_CHANNELS.map((ch) => (
              <tr key={ch.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900">{ch.channel_name}</td>
                <td className="px-6 py-4 font-mono text-gray-500">{ch.referring_url}</td>
                <td className="px-6 py-4 text-right font-medium">{ch.impressions.toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-medium">{ch.clicks.toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-bold text-amber-800">{ch.ctr}%</td>
                <td className="px-6 py-4 text-right font-bold text-emerald-800">{ch.new_customer_orders}</td>
                <td className="px-6 py-4 text-right font-bold text-blue-800">{ch.returning_customer_orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
