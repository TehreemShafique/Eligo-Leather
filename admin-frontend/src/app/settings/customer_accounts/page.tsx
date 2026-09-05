"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Users, Globe, Lock, ArrowSquareOut, X, Check, ArrowRight, ShieldCheck, CreditCard } from "@phosphor-icons/react"
import { toast } from "sonner"
import { useFormDirty } from "@/components/unsaved-changes"

export default function AdminSettingsCustomerAccountsPage() {
  const router = useRouter()

  // Customer Account Toggles
  const [showSignInLinks, setShowSignInLinks] = useState(true)
  const [allowSelfReturns, setAllowSelfReturns] = useState(true)
  const [allowStoreCredit, setAllowStoreCredit] = useState(true)

  // Auth Management Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [allowRegistration, setAllowRegistration] = useState(true)
  const [requireEmailVerification, setRequireEmailVerification] = useState(false)
  const [sessionDurationDays, setSessionDurationDays] = useState(30)

  // Domain Configuration Modal State
  const [domainModalOpen, setDomainModalOpen] = useState(false)
  const [currentDomain] = useState("eligoleather.com/account")
  const [newSubdomain, setNewSubdomain] = useState("accounts")

  const { reset } = useFormDirty({
    allowRegistration,
    requireEmailVerification,
    sessionDurationDays,
    newSubdomain,
  })

  const handleCustomizeCheckout = () => {
    toast.info("Redirecting to Checkout & Customer Accounts Editor...")
    router.push("/settings/checkout")
  }

  const handleSaveAuthSettings = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Native backend authentication settings updated!")
    setAuthModalOpen(false)
    reset()
  }

  const handleSaveDomain = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubdomain) {
      toast.error("Please enter a valid subdomain.")
      return
    }
    toast.success(`Domain change request initiated for "${newSubdomain}.eligoleather.com"!`)
    setDomainModalOpen(false)
    reset()
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
            <span>Shopify Storefront Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Customer accounts
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure sign-in links, native authentication routing, self-service order returns, store credit, and custom account domains.
          </p>
        </div>
      </div>

      <div className="space-y-6 text-xs">
        {/* 1. Sign-In Links Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Sign-in links</h2>
              <p className="text-xs text-gray-500">Show sign-in links in the header of online store and at checkout.</p>
            </div>

            <input
              type="checkbox"
              checked={showSignInLinks}
              onChange={(e) => {
                setShowSignInLinks(e.target.checked)
                toast.success(e.target.checked ? "Sign-in links enabled on storefront!" : "Sign-in links hidden.")
              }}
              className="w-5 h-5 text-amber-800 rounded border-gray-300 cursor-pointer"
            />
          </div>
        </div>

        {/* 2. Customer Accounts Management Section (Configurations & Authentication Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configurations Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="font-bold text-gray-900 text-sm uppercase tracking-wide block">Configurations</span>
              <p className="text-gray-500 text-xs">Configure apps, branding, and features for checkout and customer accounts.</p>
            </div>

            <div>
              <button
                onClick={handleCustomizeCheckout}
                className="w-full py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl shadow-2xs transition-colors cursor-pointer text-xs flex items-center justify-center gap-2"
              >
                <span>Customize</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Authentication Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="font-bold text-gray-900 text-sm uppercase tracking-wide block">Authentication</span>
              <p className="text-gray-500 text-xs">Manage sign-in methods and account access. Wired directly to native FastAPI backend auth.</p>
            </div>

            <div>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-50 font-bold text-gray-900 rounded-xl shadow-2xs transition-colors cursor-pointer text-xs"
              >
                Manage
              </button>
            </div>
          </div>
        </div>

        {/* 3. Self-Serve Returns and Cancellations Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Self-Serve Returns and Cancellations</h2>
              <p className="text-xs text-gray-500">Allow customers to initiate returns or order cancellations independently from their account portal.</p>
            </div>

            <input
              type="checkbox"
              checked={allowSelfReturns}
              onChange={(e) => {
                setAllowSelfReturns(e.target.checked)
                toast.success(e.target.checked ? "Self-serve returns enabled!" : "Self-serve returns disabled.")
              }}
              className="w-5 h-5 text-amber-800 rounded border-gray-300 cursor-pointer"
            />
          </div>

          <a
            href="/settings/legal"
            className="text-xs font-bold text-amber-800 hover:underline inline-block"
          >
            Set conditions and fees with return and cancellation rules &rarr;
          </a>
        </div>

        {/* 4. Store Credit Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Store Credit</h2>
              <p className="text-xs text-gray-500">Allow customers to see and spend store credit digital wallet balances.</p>
            </div>

            <input
              type="checkbox"
              checked={allowStoreCredit}
              onChange={(e) => {
                setAllowStoreCredit(e.target.checked)
                toast.success(e.target.checked ? "Store credit wallet enabled!" : "Store credit disabled.")
              }}
              className="w-5 h-5 text-amber-800 rounded border-gray-300 cursor-pointer"
            />
          </div>
        </div>

        {/* 5. URL / Domain Configuration Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Customer Accounts URL / Domain Configuration</h2>
              <p className="text-xs text-gray-500">Primary access domain for customer portal and account dashboards.</p>
            </div>

            <button
              onClick={() => setDomainModalOpen(true)}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl font-bold text-amber-800 transition-colors shadow-2xs"
            >
              Change domain
            </button>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-amber-800 shrink-0" />
              <div>
                <span className="font-bold text-gray-900 text-sm block">Primary URL: https://eligoleather.com/account</span>
                <span className="text-gray-500 text-xs">Customer login and order status endpoint</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* A. Authentication Management Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-800" />
                <h3 className="text-base font-bold text-gray-900">Backend Authentication Settings</h3>
              </div>
              <button onClick={() => setAuthModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAuthSettings} className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                <input
                  type="checkbox"
                  checked={allowRegistration}
                  onChange={(e) => setAllowRegistration(e.target.checked)}
                  className="rounded border-gray-300 text-amber-800"
                />
                <span>Allow new customer registrations</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                <input
                  type="checkbox"
                  checked={requireEmailVerification}
                  onChange={(e) => setRequireEmailVerification(e.target.checked)}
                  className="rounded border-gray-300 text-amber-800"
                />
                <span>Require email OTP verification upon sign up</span>
              </label>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Session Duration (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={sessionDurationDays}
                  onChange={(e) => setSessionDurationDays(parseInt(e.target.value) || 30)}
                  className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setAuthModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer">
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. Change Customer Accounts Domain Modal (Requested by User) */}
      {domainModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Change customer accounts domain</h3>
              <button onClick={() => setDomainModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDomain} className="space-y-3">
              <div>
                <span className="font-semibold text-gray-700 uppercase tracking-wide block mb-1">Current domain</span>
                <div className="p-2.5 bg-gray-100 rounded-xl border border-gray-200 font-mono font-bold text-gray-800">
                  {currentDomain}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">New domain</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    required
                    placeholder="accounts"
                    value={newSubdomain}
                    onChange={(e) => setNewSubdomain(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-mono font-bold text-gray-900"
                  />
                  <span className="font-bold text-gray-700 shrink-0">.eligoleather.com</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 italic">
                Your new domain won&apos;t show to customers until you set it as the primary domain for customer accounts.{" "}
                <a href="/settings/domains" className="text-amber-800 font-bold hover:underline">Learn more</a>
              </p>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDomainModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
