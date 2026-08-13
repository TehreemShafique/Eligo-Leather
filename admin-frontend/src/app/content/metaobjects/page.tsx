"use client"

import { useState } from "react"
import Link from "next/link"
import { Browsers, Plus, Gear, ArrowRight, Palette, CheckCircle } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminMetaobjectsPage() {
  const recentEntries = [
    { name: "Maroon Tan Leather", hex: "#7A1C1C", definition: "Color", status: "Active" },
    { name: "Vintage Dark Brown", hex: "#3E2723", definition: "Color", status: "Active" },
    { name: "Midnight Onyx Black", hex: "#1A1A1A", definition: "Color", status: "Active" },
    { name: "Cognac Honey Brown", hex: "#9E5A2B", definition: "Color", status: "Active" },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Metaobjects"
        icon={<Browsers className="w-5 h-5" />}
        actions={
          <>
            <button
              onClick={() => toast.info("Opening Metaobject Definitions manager...")}
              className="eligo-btn-secondary"
            >
              <Gear className="w-4 h-4 text-amber-800" />
              <span>Manage</span>
            </button>
            <button
              onClick={() => toast.success("Add definition drawer opened!")}
              className="eligo-btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Add definition</span>
            </button>
          </>
        }
      />

      {/* Interactive Summary Cards (Clicking any card redirects to Unified Entries Page /content/metaobjects/entries) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/content/metaobjects/entries?filter=storefront"
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:border-amber-800 transition-all group"
        >
          <span className="text-xs text-amber-800 font-semibold uppercase group-hover:underline">
            Available on Storefront &rarr;
          </span>
          <div className="text-2xl font-bold text-gray-900 mt-1">38 entries</div>
          <span className="text-[11px] text-emerald-600 font-medium">Color swatches & custom schemas</span>
        </Link>

        <Link
          href="/content/metaobjects/entries?filter=webpages"
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:border-amber-800 transition-all group"
        >
          <span className="text-xs text-gray-500 font-semibold uppercase group-hover:underline">
            Web Pages &rarr;
          </span>
          <div className="text-2xl font-bold text-gray-900 mt-1">0 entries</div>
          <span className="text-[11px] text-gray-400 font-medium">Custom landing pages</span>
        </Link>

        <Link
          href="/content/metaobjects/entries?filter=active"
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:border-amber-800 transition-all group"
        >
          <span className="text-xs text-gray-500 font-semibold uppercase group-hover:underline">
            Active Entries &rarr;
          </span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">38 active</div>
          <span className="text-[11px] text-emerald-600 font-medium">100% published</span>
        </Link>

        <Link
          href="/content/metaobjects/entries?filter=draft"
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:border-amber-800 transition-all group"
        >
          <span className="text-xs text-gray-500 font-semibold uppercase group-hover:underline">
            Draft Entries &rarr;
          </span>
          <div className="text-2xl font-bold text-gray-900 mt-1">0 drafts</div>
          <span className="text-[11px] text-gray-400 font-medium">No pending drafts</span>
        </Link>
      </div>

      {/* Recent Entries Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Recent Metaobject Entries</h2>
          <Link
            href="/content/metaobjects/entries"
            className="text-xs font-bold text-amber-800 hover:underline inline-flex items-center gap-1"
          >
            <span>View all 38 entries</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th">Display Name</th>
                <th className="eligo-th">Swatch Hex</th>
                <th className="eligo-th">Definition Name</th>
                <th className="eligo-th text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentEntries.map((color, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{color.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full border border-gray-300 shadow-2xs inline-block"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="font-mono text-gray-600">{color.hex}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700">{color.definition}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      {color.status}
                    </span>
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
