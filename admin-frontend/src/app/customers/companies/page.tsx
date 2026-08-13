"use client"

import Link from "next/link"
import { Building, Plus, WarningCircle } from "@phosphor-icons/react"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminCompaniesPage() {
  const companies = [
    {
      id: 1,
      name: "Eligo Corporate Retailers Ltd",
      companyId: "B2B-EL-001",
      mainContact: "Muhammad Usama Shakeel",
      location: "Gulberg Greens, Islamabad",
      paymentTerms: "Net 30",
      status: "Active",
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Companies"
        icon={<Building className="w-5 h-5" />}
        actions={
          <Link
            href="/customers/companies/new"
            className="eligo-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add company</span>
          </Link>
        }
      />

      {/* Informational Alert Banner */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center gap-2.5 font-bold">
          <WarningCircle className="w-5 h-5 text-amber-800 shrink-0" />
          <span>App behavior with B2B orders: Some apps may not attribute B2B orders correctly on your current plan settings.</span>
        </div>
      </div>

      {/* Hero Landing Presentation Card */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-2xs text-center max-w-3xl mx-auto space-y-4">
        <div className="w-16 h-16 bg-amber-800/10 text-amber-800 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <Building className="w-8 h-8 text-amber-800" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Bring the power of customization to your B2B business</h2>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Get started by adding a company and assigning custom pricing, net payment terms, and permissions for multiple locations and buyers.
        </p>
        <div className="pt-2">
          <Link
            href="/customers/companies/new"
            className="px-6 py-3 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-xl shadow-md transition-colors inline-block"
          >
            Add company
          </Link>
        </div>
      </div>

      {/* Active Companies Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Configured B2B Companies ({companies.length})</h2>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th">Company Name</th>
                <th className="eligo-th w-[16%]">Company ID</th>
                <th className="eligo-th">Main Contact</th>
                <th className="eligo-th">Location</th>
                <th className="eligo-th w-[14%] text-right">Payment Terms</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((comp) => (
                <tr key={comp.id} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td font-bold text-amber-800">
                    <Link href="/customers/companies/new" className="hover:underline">{comp.name}</Link>
                  </td>
                  <td className="eligo-td font-mono text-gray-500">{comp.companyId}</td>
                  <td className="eligo-td font-semibold text-gray-900">{comp.mainContact}</td>
                  <td className="eligo-td text-gray-600">{comp.location}</td>
                  <td className="eligo-td text-right font-bold text-gray-900">{comp.paymentTerms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
