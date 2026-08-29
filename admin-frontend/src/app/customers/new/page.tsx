"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, MapPin, X, Check } from "@phosphor-icons/react"
import { toast } from "sonner"
import { useFormDirty } from "@/components/unsaved-changes"

export default function AdminNewCustomerPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("Sajid")
  const [lastName, setLastName] = useState("Watto")
  const [email, setEmail] = useState("sajidwatto155@gmail.com")
  const [phone, setPhone] = useState("+92 300 1234567")
  const [language, setLanguage] = useState("English [Default]")
  const [agreeEmail, setAgreeEmail] = useState(true)
  const [agreeSms, setAgreeSms] = useState(false)
  const [agreeWhatsapp, setAgreeWhatsapp] = useState(true)
  const [notes, setNotes] = useState("VIP customer requesting custom maroon leather embossing.")
  const [tags, setTags] = useState("VIP, Repeat-Buyer")
  const [taxSetting, setTaxSetting] = useState("Collect tax")

  // Default Address State
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [savedAddress, setSavedAddress] = useState<any>(null)
  const [country, setCountry] = useState("Pakistan")
  const [company, setCompany] = useState("Watto Enterprises")
  const [streetAddress, setStreetAddress] = useState("Street 14, Main Boulevard, Gulberg III")
  const [apartment, setApartment] = useState("Suite 2B")
  const [city, setCity] = useState("Lahore")
  const [postalCode, setPostalCode] = useState("54000")

  const { reset } = useFormDirty(
    {
      firstName,
      lastName,
      email,
      phone,
      language,
      agreeEmail,
      agreeSms,
      agreeWhatsapp,
      notes,
      tags,
      taxSetting,
      country,
      company,
      streetAddress,
      apartment,
      city,
      postalCode,
      savedAddress,
    }
  )

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(`Customer "${firstName} ${lastName}" created successfully!`)
    setTimeout(() => {
      reset()
      router.push("/customers")
    }, 400)
  }

  const handleSaveAddress = () => {
    setSavedAddress({
      country,
      company,
      streetAddress,
      apartment,
      city,
      postalCode,
    })
    setAddressModalOpen(false)
    toast.success("Default address saved!")
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Customer</h1>
            <p className="text-xs text-gray-500 mt-1">Configure customer profile, consent compliance, and default shipping address.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors border border-gray-300"
          >
            Cancel
          </Link>
          <button
            onClick={handleSaveCustomer}
            className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Save Customer
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveCustomer} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6 text-xs">
          {/* Customer Overview Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
              Customer Overview
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">First name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Last name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Phone number (PK +92)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
              >
                <option value="English [Default]">English [Default]</option>
                <option value="Urdu">Urdu</option>
              </select>
            </div>
          </div>

          {/* Marketing Consent Compliance Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3 text-xs">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
              Marketing Consent Compliance
            </h2>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeEmail}
                  onChange={(e) => setAgreeEmail(e.target.checked)}
                  className="rounded border-gray-300 text-amber-800"
                />
                <span className="font-semibold text-gray-800">Customer agreed to receive marketing emails.</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeSms}
                  onChange={(e) => setAgreeSms(e.target.checked)}
                  className="rounded border-gray-300 text-amber-800"
                />
                <span className="font-semibold text-gray-800">Customer agreed to receive SMS marketing text messages.</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeWhatsapp}
                  onChange={(e) => setAgreeWhatsapp(e.target.checked)}
                  className="rounded border-gray-300 text-amber-800"
                />
                <span className="font-semibold text-gray-800">Customer agreed to receive WhatsApp marketing messages.</span>
              </label>
            </div>

            <p className="text-[11px] text-gray-500 italic pt-1">
              You should ask your customers for permission before you subscribe them to your marketing emails, SMS, or WhatsApp messages.
            </p>
          </div>

          {/* Default Address Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Default Address</h2>
              <button
                type="button"
                onClick={() => setAddressModalOpen(true)}
                className="text-xs font-bold text-amber-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add address</span>
              </button>
            </div>

            {savedAddress ? (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="font-bold text-gray-900 block">{savedAddress.streetAddress}, {savedAddress.apartment}</span>
                <span className="text-gray-600 block">{savedAddress.city}, {savedAddress.postalCode}, {savedAddress.country}</span>
                {savedAddress.company && <span className="text-amber-800 font-semibold block">{savedAddress.company}</span>}
              </div>
            ) : (
              <p className="text-gray-500 italic">No default address configured. Click &quot;+ Add address&quot; above.</p>
            )}
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6 text-xs">
          {/* Notes Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <h2 className="font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Private Notes</h2>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes about this customer..."
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900"
            />
          </div>

          {/* Tags Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <h2 className="font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Tags</h2>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
            />
          </div>

          {/* Tax Settings */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <h2 className="font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Tax Settings</h2>
            <select
              value={taxSetting}
              onChange={(e) => setTaxSetting(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
            >
              <option value="Collect tax">Collect tax</option>
              <option value="Don't collect tax">Don&apos;t collect tax</option>
            </select>
          </div>
        </div>
      </form>

      {/* Default Address Modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Add Default Address</h3>
              <button onClick={() => setAddressModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Country/region</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900">
                  <option value="Pakistan">Pakistan</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Company</label>
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Address</label>
                <input type="text" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Apartment, suite</label>
                  <input type="text" value={apartment} onChange={(e) => setApartment(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">City</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Postal code</label>
                <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button onClick={() => setAddressModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold">
                Cancel
              </button>
              <button onClick={handleSaveAddress} className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900">
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
