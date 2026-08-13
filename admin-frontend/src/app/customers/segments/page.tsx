"use client"

import { useState } from "react"
import Link from "next/link"
import { Users, Plus, MagnifyingGlass } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminSegmentsPage() {
  const segments = [
    {
      name: "Customers added to companies",
      ratio: "0%",
      lastActivity: "Created on 9 Apr 2026",
      createdBy: "Shopify System",
    },
    {
      name: "Customers not added to companies",
      ratio: "100%",
      lastActivity: "Created on 9 Apr 2026",
      createdBy: "Shopify System",
    },
    {
      name: "Customers who have purchased at least once",
      ratio: "67%",
      lastActivity: "Created on 9 Apr 2026",
      createdBy: "Shopify System",
    },
    {
      name: "Email subscribers",
      ratio: "14%",
      lastActivity: "Created on 9 Apr 2026",
      createdBy: "Shopify System",
    },
    {
      name: "Abandoned checkouts in the last 30 days",
      ratio: "1%",
      lastActivity: "Edited on 5 Nov 2024",
      createdBy: "Shopify System",
    },
    {
      name: "Customers who have purchased more than once",
      ratio: "3%",
      lastActivity: "Created on 9 Apr 2026",
      createdBy: "Shopify System",
    },
    {
      name: "Customers who haven't purchased",
      ratio: "33%",
      lastActivity: "Created on 9 Apr 2026",
      createdBy: "Shopify System",
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Segments"
        icon={<Users className="w-5 h-5" />}
        actions={
          <button
            onClick={() => toast.success("Create segment editor opened!")}
            className="eligo-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Create segment</span>
          </button>
        }
      />

      {/* Segments Table */}
      <div className="eligo-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search segments..."
              className="eligo-input pl-9"
            />
          </div>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th">Segment Name</th>
                <th className="eligo-th w-[18%]">% of Customers</th>
                <th className="eligo-th w-[28%]">Last Activity</th>
                <th className="eligo-th w-[20%] text-right">Created By</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((seg, idx) => (
                <tr key={idx} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td font-bold text-amber-800 cursor-pointer">{seg.name}</td>
                  <td className="eligo-td font-bold text-gray-900">{seg.ratio}</td>
                  <td className="eligo-td text-gray-500">{seg.lastActivity}</td>
                  <td className="eligo-td text-right font-semibold text-gray-700">{seg.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
