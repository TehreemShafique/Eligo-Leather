"use client"

import { useState } from "react"
import { Receipt, Percent, Check } from "@phosphor-icons/react"
import { toast } from "sonner"
import { useFormDirty } from "@/components/unsaved-changes"

export default function AdminSettingsTaxesPage() {
  const [taxIncluded, setTaxIncluded] = useState(true)
  const [gstRate, setGstRate] = useState("18.00")

  useFormDirty({ taxIncluded, gstRate })

  return (
    <div className="space-y-6 font-sans max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
        <div className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
            <span>Regional Duties &amp; Value-Added Tax</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Taxes and duties</h1>
          <p className="text-xs text-gray-500 mt-1">Manage sales tax calculations, GST rates, and price inclusion settings.</p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-gray-900 text-sm block">Include sales tax in product prices</span>
              <span className="text-gray-500 block">All catalog product prices are shown inclusive of sales taxes at checkout.</span>
            </div>
            <input
              type="checkbox"
              checked={taxIncluded}
              onChange={(e) => {
                setTaxIncluded(e.target.checked)
                toast.success(e.target.checked ? "Taxes included in prices." : "Taxes excluded from prices.")
              }}
              className="w-5 h-5 text-amber-800 rounded border-gray-300 cursor-pointer"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <span className="font-bold text-gray-900 text-sm block">Pakistan Regional GST Rate Override</span>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                className="w-32 h-10 px-3 rounded-xl bg-white border border-gray-300 font-bold text-gray-900"
              />
              <span className="font-bold text-gray-700">% GST</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
