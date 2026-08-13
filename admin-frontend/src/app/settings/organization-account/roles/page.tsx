"use client"

import { useState } from "react"
import Link from "next/link"
import { ShieldCheck, Plus, MagnifyingGlass } from "@phosphor-icons/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"

export default function AdminSettingsRolesPage() {
  const rolesList = [
    { name: "App developer", domain: "Organization", userCount: "0 users" },
    { name: "Cashier", domain: "Point of Sale", userCount: "1 user" },
    { name: "Customer support", domain: "Store", userCount: "0 users" },
    { name: "Marketer", domain: "Store", userCount: "0 users" },
    { name: "Merchandiser", domain: "Store", userCount: "0 users" },
    { name: "Online store editor", domain: "Store", userCount: "0 users" },
    { name: "Administrator", domain: "Organization", userCount: "2 users" },
    { name: "POS administrator", domain: "Organization", userCount: "0 users" },
    { name: "POS full permissions", domain: "Point of Sale", userCount: "0 users" },
    { name: "POS device setup", domain: "Point of Sale", userCount: "0 users" },
    { name: "POS user administrator", domain: "Point of Sale", userCount: "0 users" },
    { name: "Sales associate", domain: "Point of Sale", userCount: "0 users" },
    { name: "Store manager", domain: "Point of Sale", userCount: "0 users" },
  ]

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      <PageHeader
        title="Roles"
        icon={<ShieldCheck className="w-5 h-5" />}
        actions={
          <button
            onClick={() => toast.success("Create custom role editor opened!")}
            className="eligo-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Create role</span>
          </button>
        }
      />

      {/* Roles Directory Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th">Role Name</th>
                <th className="eligo-th">System Domain</th>
                <th className="eligo-th text-right">Assigned Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rolesList.map((r, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-amber-800 hover:underline cursor-pointer">{r.name}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        r.domain === "Organization"
                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                          : r.domain === "Store"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {r.domain}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">{r.userCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
