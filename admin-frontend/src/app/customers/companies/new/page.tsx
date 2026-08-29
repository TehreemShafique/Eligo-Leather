"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Building, Plus, MagnifyingGlass } from "@phosphor-icons/react"
import { toast } from "sonner"
import { useFormDirty } from "@/components/unsaved-changes"

export default function AdminNewCompanyPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState("Eligo Corporate Retailers Ltd")
  const [companyId, setCompanyId] = useState("B2B-EL-001")
  const [mainContact, setMainContact] = useState("Muhammad Usama Shakeel")
  const [locationId, setLocationId] = useState("LOC-ISB-01")
  const [shippingAddress, setStreetAddress] = useState("Street 14, Main Boulevard, Gulberg Greens, Islamabad")
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true)
  const [market, setMarket] = useState("Pakistan")
  const [paymentTerms, setPaymentTerms] = useState("Net 30")
  const [allowOneTimeAddress, setAllowOneTimeAddress] = useState(true)
  const [orderSubmission, setOrderSubmission] = useState("Automatically submit orders")
  const [taxId, setTaxId] = useState("NTN-9876543-2")
  const [taxSetting, setTaxSetting] = useState("Collect tax unless exemptions apply")

  const { reset } = useFormDirty({
    companyName,
    companyId,
    mainContact,
    locationId,
    shippingAddress,
    billingSameAsShipping,
    market,
    paymentTerms,
    allowOneTimeAddress,
    orderSubmission,
    taxId,
    taxSetting,
  })

  const paymentTermsList = [
    "No payment terms",
    "Due on fulfillment",
    "Net 7",
    "Net 15",
    "Net 30",
    "Net 45",
    "Net 60",
    "Net 90",
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(`B2B Company "${companyName}" created successfully!`)
    reset()
    setTimeout(() => {
      router.push("/customers/companies")
    }, 400)
  }

  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/customers/companies"
            className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Company</h1>
            <p className="text-xs text-gray-500 mt-1">Configure B2B corporate account, locations, catalogs, and credit terms.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/customers/companies"
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors border border-gray-300"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Submit
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Company Identification Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
            Company Identification
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Company name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Eligo Corporate Retailers Ltd"
                className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 text-sm font-bold text-gray-900"
              />
              <p className="text-[11px] text-gray-500 mt-1">This will appear in customer accounts and at checkout.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Company ID</label>
                <input
                  type="text"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  placeholder="Add an existing external ID or create a unique ID"
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-mono text-gray-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Main contact</label>
                <input
                  type="text"
                  value={mainContact}
                  onChange={(e) => setMainContact(e.target.value)}
                  placeholder="Customer search..."
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Location & Shipping Address Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
            Location & Shipping Address
          </h2>

          <p className="text-gray-500">
            Add a location to this company. This is where you&apos;ll ship products to. Each location can have custom catalogs, checkout settings, and more. You can add more locations later.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Shipping address</label>
              <input
                type="text"
                value={shippingAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={billingSameAsShipping}
                onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                className="rounded border-gray-300 text-amber-800"
              />
              <span className="font-semibold text-gray-800">Billing address same as shipping address</span>
            </label>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Location ID</label>
              <input
                type="text"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                placeholder="Add an existing external ID or create a unique ID"
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-mono text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Markets, Catalogs & Payment Terms */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
            Markets, Catalogs & B2B Terms
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Markets</label>
              <input
                type="text"
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Catalogs</label>
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 font-medium">
                No catalogs available. Go to Markets to add market catalogs.
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Payment terms</label>
            <select
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-amber-800"
            >
              {paymentTermsList.map((term) => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Checkout & Order Submission Rules */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
            Checkout Configurations
          </h2>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allowOneTimeAddress}
              onChange={(e) => setAllowOneTimeAddress(e.target.checked)}
              className="rounded border-gray-300 text-amber-800"
            />
            <span className="font-semibold text-gray-800">Allow customers to ship to any one-time address</span>
          </label>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <span className="font-bold text-gray-900 uppercase tracking-wide block">Order submission</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="orderSubmission"
                checked={orderSubmission === "Automatically submit orders"}
                onChange={() => setOrderSubmission("Automatically submit orders")}
              />
              <span className="font-semibold text-gray-800">Automatically submit orders</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="orderSubmission"
                checked={orderSubmission === "Orders without shipping addresses will be submitted as draft orders"}
                onChange={() => setOrderSubmission("Orders without shipping addresses will be submitted as draft orders")}
              />
              <span className="font-semibold text-gray-800">Orders without shipping addresses will be submitted as draft orders</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="orderSubmission"
                checked={orderSubmission === "Submit all orders as drafts for review"}
                onChange={() => setOrderSubmission("Submit all orders as drafts for review")}
              />
              <span className="font-semibold text-gray-800">Submit all orders as drafts for review</span>
            </label>
          </div>
        </div>

        {/* Tax Details */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
            Tax Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Tax ID</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="e.g. NTN-9876543-2"
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-mono text-gray-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Tax settings</label>
              <select
                value={taxSetting}
                onChange={(e) => setTaxSetting(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
              >
                <option value="Collect tax">Collect tax</option>
                <option value="Collect tax unless exemptions apply">Collect tax unless exemptions apply</option>
                <option value="Don't collect tax">Don&apos;t collect tax</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-8 py-3 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl shadow-md transition-colors"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  )
}
