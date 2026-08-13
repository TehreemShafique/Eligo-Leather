"use client"

import { useState } from "react"
import Link from "next/link"
import {
  TrendUp,
  DownloadSimple,
  Target,
  Globe,
  InstagramLogo,
  Robot,
  Eye,
  Megaphone,
  ArrowRight,
  Sparkle,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { MOCK_GROWTH_SUMMARY, MOCK_ATTRIBUTIONS, MOCK_CAMPAIGNS } from "@/modules/growth/api"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminGrowthPage() {
  const [dateRange, setDateRange] = useState("30d")
  const summary = MOCK_GROWTH_SUMMARY

  return (
    <div className="space-y-5">
      <PageHeader
        title="Growth Dashboard"
        icon={<TrendUp className="w-5 h-5" />}
        actions={
          <>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="eligo-btn-secondary !py-2"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Link
              href="/growth/campaigns"
              className="eligo-btn-secondary"
            >
              <Target className="w-4 h-4 text-amber-800" />
              <span>Campaigns</span>
            </Link>
            <button
              onClick={() => toast.success("Exported Growth Summary Report!")}
              className="eligo-btn-primary"
            >
              <DownloadSimple className="w-4 h-4" />
              <span>Export Analytics</span>
            </button>
          </>
        }
      />

      {/* Overview Aggregated Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Marketing Attributed Sales */}
        <div className="eligo-card eligo-card-hover p-5 flex flex-col justify-between animate-slide-up delay-75">
          <span className="text-xs text-gray-500 font-semibold uppercase">Marketing Attributed Sales</span>
          <div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              Rs. {summary.sales_attributed_to_marketing.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-700 font-bold">
              {summary.marketing_sales_percentage}% of total store sales (Rs. {summary.total_store_sales.toLocaleString()})
            </span>
          </div>
        </div>

        {/* Card 2: Total Sessions & Traffic Breakdown */}
        <div className="eligo-card eligo-card-hover p-5 flex flex-col justify-between animate-slide-up delay-150">
          <span className="text-xs text-amber-800 font-semibold uppercase">Sessions by Traffic Type</span>
          <div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {summary.total_sessions.toLocaleString()}
            </div>
            <div className="text-[11px] text-gray-500 font-medium flex items-center gap-2 mt-1">
              <span className="text-emerald-700 font-bold">Organic: 14.2k</span> &bull; 
              <span className="text-amber-800 font-bold">Social: 18.4k</span> &bull; 
              <span className="text-blue-700 font-bold">Direct: 8.9k</span>
            </div>
          </div>
        </div>

        {/* Card 3: ROAS Multiplier */}
        <div className="eligo-card eligo-card-hover p-5 flex flex-col justify-between animate-slide-up delay-225">
          <span className="text-xs text-gray-500 font-semibold uppercase">Average ROAS</span>
          <div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {summary.average_roas}x
            </div>
            <span className="text-[11px] text-gray-500 font-medium">
              Total Ad Spend: Rs. {summary.total_ad_cost.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 4: CPA */}
        <div className="eligo-card eligo-card-hover p-5 flex flex-col justify-between animate-slide-up delay-300">
          <span className="text-xs text-gray-500 font-semibold uppercase">Average CPA</span>
          <div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              Rs. {summary.average_cpa}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">
              {summary.total_orders_attributed} orders generated
            </span>
          </div>
        </div>
      </div>

      {/* Attribution Table Section */}
      <div className="eligo-card overflow-hidden animate-slide-up">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Attribution Channel Metrics</h2>
          </div>
          <Link
            href="/growth/attribution"
            className="text-xs font-bold text-amber-800 hover:text-amber-900 hover:underline"
          >
            View Full Referrer URLs &rarr;
          </Link>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th">Channel</th>
                <th className="eligo-th w-[9%]">Type</th>
                <th className="eligo-th w-[10%] text-right">Sessions</th>
                <th className="eligo-th w-[9%] text-right">Orders</th>
                <th className="eligo-th w-[14%] text-right">New / Returning</th>
                <th className="eligo-th w-[10%] text-right">Conv. Rate</th>
                <th className="eligo-th w-[8%] text-right">ROAS</th>
                <th className="eligo-th w-[12%] text-right">Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_ATTRIBUTIONS.map((attr) => (
                <tr key={attr.id} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td font-bold text-gray-900">
                    <div className="flex items-center gap-2">
                      {attr.type === "Social" ? (
                        <InstagramLogo className="w-4 h-4 text-amber-800" />
                      ) : attr.type === "Referral" ? (
                        <Robot className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Globe className="w-4 h-4 text-blue-600" />
                      )}
                      <span>{attr.channel}</span>
                    </div>
                  </td>
                  <td className="eligo-td">
                    <span className="eligo-badge bg-gray-100 text-gray-800 border-gray-200">
                      {attr.type}
                    </span>
                  </td>
                  <td className="eligo-td text-right font-medium">{attr.sessions.toLocaleString()}</td>
                  <td className="eligo-td text-right font-bold text-gray-900">{attr.orders}</td>
                  <td className="eligo-td text-right text-gray-600">
                    <span className="text-emerald-700 font-bold">{attr.orders_from_new_customers} new</span> / {attr.orders_from_returning_customers} ret
                  </td>
                  <td className="eligo-td text-right font-bold text-emerald-700">{attr.conversion_rate}%</td>
                  <td className="eligo-td text-right font-bold text-amber-800">
                    {attr.roas > 0 ? `${attr.roas}x` : "—"}
                  </td>
                  <td className="eligo-td text-right font-bold text-gray-900">
                    Rs. {attr.sales.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaigns Overview Section */}
      <div className="eligo-card p-6 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-800" />
            <h2 className="text-base font-bold text-gray-900">Active Campaigns</h2>
          </div>
          <Link href="/growth/campaigns" className="text-xs font-bold text-amber-800 hover:text-amber-900 hover:underline">
            Manage All Campaigns &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MOCK_CAMPAIGNS.map((c) => (
            <div key={c.id} className="eligo-card eligo-card-hover p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="eligo-badge bg-emerald-100 text-emerald-800 border-emerald-200">
                  {c.status}
                </span>
                <span className="text-[11px] text-gray-400 font-mono">
                  {c.unassigned_activities_count} Unassigned
                </span>
              </div>
              <h3 className="font-bold text-sm text-gray-900">{c.campaign_name}</h3>
              <p className="text-xs text-gray-500 font-medium truncate">Target: {c.target_metrics}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
