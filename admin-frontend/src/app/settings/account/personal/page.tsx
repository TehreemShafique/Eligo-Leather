"use client"

import { useState } from "react"
import Link from "next/link"
import {
  User,
  ShieldCheck,
  CheckCircle,
  PencilSimple,
  Globe,
  Clock,
  Storefront,
  Question,
  GoogleLogo,
  AppleLogo,
  UploadSimple,
  X,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { useFormDirty } from "@/components/unsaved-changes"
import { getStoredUser } from "@/lib/api"

export default function AdminPersonalAccountGeneralPage() {
  const user = getStoredUser() as { email?: string; full_name?: string | null } | null
  const nameParts = (user?.full_name || "Admin").split(" ")
  const defaultFirst = nameParts[0] || ""
  const defaultLast = nameParts.slice(1).join(" ") || ""
  const [firstName, setFirstName] = useState(defaultFirst)
  const [lastName, setLastName] = useState(defaultLast)
  const [email, setEmail] = useState(user?.email || "")
  const [phone, setPhone] = useState("+923366662345")
  const [isEmailVerified, setIsEmailVerified] = useState(true)

  // Language & Regional Format
  const [preferredLang, setPreferredLang] = useState("English")
  const [regionalFormat, setRegionalFormat] = useState("English (Pakistan)")
  const [accountTimezone, setAccountTimezone] = useState("(GMT+05:00) Islamabad, Karachi")

  // Modals State
  const [updateEmailModalOpen, setUpdateEmailModalOpen] = useState(false)
  const [newEmail, setNewEmail] = useState("")

  const { reset } = useFormDirty({
    firstName,
    lastName,
    phone,
    preferredLang,
    accountTimezone,
    newEmail,
  })

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Personal account details updated successfully!")
    reset()
  }

  const handleUpdateEmail = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail) return
    setEmail(newEmail)
    setUpdateEmailModalOpen(false)
    setNewEmail("")
    toast.success("Verification email sent to " + newEmail + "! Please verify to update your primary login.")
    reset()
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header & Sub-Tabs Navigation */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-400 text-sky-950 font-bold text-lg flex items-center justify-center shadow-2xs">
              {firstName.charAt(0).toUpperCase()}{lastName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{firstName} {lastName}</h1>
              <span className="text-xs text-gray-500">{email} &bull; Store Administrator</span>
            </div>
          </div>

          {/* Sub-Tabs: General vs Security */}
          <div className="flex border-b border-gray-200 gap-6 text-xs font-bold pt-2">
            <Link
              href="/settings/account/personal"
              className="pb-3 border-b-2 border-amber-800 text-amber-800 flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>General</span>
            </Link>

            <Link
              href="/settings/account/security"
              className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Security</span>
            </Link>
          </div>
        </div>

        <form onSubmit={handleSaveDetails} className="space-y-6 text-xs">
          {/* 1. Details Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900">Details</h2>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-400 text-teal-950 font-bold text-xs flex items-center justify-center">
                  BH
                </div>
                <button
                  type="button"
                  onClick={() => toast.info("Select photo from device to upload avatar.")}
                  className="px-3.5 py-1.5 bg-white border border-gray-300 font-semibold rounded-xl text-gray-800 hover:bg-gray-50 shadow-2xs"
                >
                  Upload photo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-500">Use your first and last name as they appear on your government-issued ID.</p>

            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-700 uppercase tracking-wide block mb-1">Email</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{email}</span>
                    {isEmailVerified && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setUpdateEmailModalOpen(true)}
                  className="text-amber-800 font-bold hover:underline"
                >
                  Update
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <span className="font-semibold text-gray-700 uppercase tracking-wide block mb-1">Phone Number (optional)</span>
                  <span className="font-bold text-gray-900">{phone}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => toast.info("Phone update modal opened.")} className="text-amber-800 font-bold hover:underline">
                    Update
                  </button>
                  <button type="button" onClick={() => { setPhone(""); toast.info("Phone removed."); }} className="text-rose-600 font-bold hover:underline">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Login Service Card (SSO) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Login service</h2>
            <p className="text-gray-500">Connect an external login service to log into your account easily with Single Sign-On (SSO).</p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => toast.success("Google Account SSO bound successfully!")}
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl font-bold text-gray-800 flex items-center gap-2"
              >
                <GoogleLogo className="w-4 h-4 text-rose-500" />
                <span>Connect to Google</span>
              </button>

              <button
                type="button"
                onClick={() => toast.success("Apple ID SSO bound successfully!")}
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl font-bold text-gray-800 flex items-center gap-2"
              >
                <AppleLogo className="w-4 h-4 text-black" />
                <span>Connect to Apple</span>
              </button>
            </div>
          </div>

          {/* 3. Stores Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Stores</h2>
                <p className="text-xs text-gray-500">View and switch between all store accounts bound to your administrative profile.</p>
              </div>

              <button
                type="button"
                onClick={() => toast.info("Showing 1 active store: Eligo Leather (eligoleather.com)")}
                className="text-amber-800 font-bold hover:underline"
              >
                View all stores
              </button>
            </div>
          </div>

          {/* 4. Programs and Resources Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Programs and resources</h2>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://help.shopify.com"
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-gray-50 hover:bg-amber-50 rounded-xl border border-gray-200 flex items-center gap-3 font-bold text-gray-800"
              >
                <Question className="w-5 h-5 text-amber-800" />
                <span>Platform Documentation &amp; Help Center</span>
              </a>

              <Link
                href="/settings/apps"
                className="p-3 bg-gray-50 hover:bg-amber-50 rounded-xl border border-gray-200 flex items-center gap-3 font-bold text-gray-800"
              >
                <Storefront className="w-5 h-5 text-amber-800" />
                <span>App &amp; Extension Store</span>
              </Link>
            </div>
          </div>

          {/* 5. Preferred Language & Regional Format */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Preferred language &amp; Regional format</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Language</label>
                <select
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                >
                  <option value="English">English</option>
                  <option value="Urdu">Urdu (اردو)</option>
                  <option value="Arabic">Arabic (العربية)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Regional format</label>
                <div className="flex items-center justify-between h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900">
                  <span>{regionalFormat}</span>
                  <button type="button" onClick={() => toast.info("Regional format editor opened.")} className="text-amber-800 text-[11px] font-bold hover:underline">
                    Change regional format
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 6. Timezone Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Timezone</h2>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Account Timezone</label>
              <select
                value={accountTimezone}
                onChange={(e) => setAccountTimezone(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
              >
                <option value="(GMT+05:00) Islamabad, Karachi">(GMT+05:00) Islamabad, Karachi</option>
                <option value="(GMT+00:00) London">(GMT+00:00) London</option>
                <option value="(GMT-05:00) Eastern Time (US & Canada)">(GMT-05:00) Eastern Time (US &amp; Canada)</option>
              </select>
              <p className="text-[11px] text-gray-500 mt-1">
                Sets the timezone for your personal administrative account. Store-level overrides are managed under main General settings.
              </p>
            </div>
          </div>

          {/* Save Bar */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* Update Email Modal */}
      {updateEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Update Primary Email</h3>
              <button onClick={() => setUpdateEmailModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">New Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. bilal@eligoleather.com"
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setUpdateEmailModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900">
                  Send Verification Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
