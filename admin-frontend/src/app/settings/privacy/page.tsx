"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ShieldCheck,
  Cookie,
  Eye,
  Sliders,
  Check,
  Globe,
  LockKey,
  Lightning,
  Sparkle,
  PaintBrush,
  MapPin,
  List,
} from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminSettingsPrivacyPage() {
  const [activeSubTab, setActiveSubTab] = useState<"privacy" | "policies">("privacy")

  // Privacy & Cookie Banner Form States
  const [cookieBannerEnabled, setCookieBannerEnabled] = useState(true)
  const [cookieBannerTheme, setCookieBannerTheme] = useState<"light" | "dark" | "custom">("light")
  const [cookieBannerPosition, setCookieBannerPosition] = useState<"center" | "bottom_center" | "bottom_left" | "bottom_right" | "bottom_full">("bottom_center")
  const [showInCheckout, setShowInCheckout] = useState(true)
  const [networkIntelligenceEnabled, setNetworkIntelligenceEnabled] = useState(true)
  const [optOutLinkEnabled, setOptOutLinkEnabled] = useState(true)
  const [optOutMenuTarget, setOptOutMenuTarget] = useState("Footer Menu")

  const handleSavePrivacySettings = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Customer privacy settings & cookie consent rules saved! Data Sharing Opt-Out link injected into " + optOutMenuTarget)
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Header & Unified Compliance Navigation */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
            <span>Shopify Unified Legal &amp; Privacy Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Customer privacy &amp; Legal Compliance
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage cookie consent banners, network tracking intelligence, data sharing opt-out links, and legal disclosure policies.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab("privacy")}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeSubTab === "privacy"
                ? "border-amber-800 text-amber-800"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Cookie className="w-4 h-4" />
            <span>Customer Privacy &amp; Cookie Consent</span>
          </button>

          <Link
            href="/settings/legal"
            className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Legal Disclosures &amp; Policies</span>
          </Link>
        </div>
      </div>

      {/* Main Privacy Form */}
      <form onSubmit={handleSavePrivacySettings} className="space-y-6 text-xs">
        {/* 1. Cookie Banner Settings Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Cookie Consent Banner</h2>
              <p className="text-xs text-gray-500">Displays GDPR/CCPA consent banners to storefront visitors from regulated regions.</p>
            </div>

            <input
              type="checkbox"
              checked={cookieBannerEnabled}
              onChange={(e) => setCookieBannerEnabled(e.target.checked)}
              className="w-5 h-5 text-amber-800 rounded border-gray-300 cursor-pointer"
            />
          </div>

          {cookieBannerEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Banner Theme</label>
                <select
                  value={cookieBannerTheme}
                  onChange={(e: any) => setCookieBannerTheme(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                >
                  <option value="light">Light Theme (Clean White)</option>
                  <option value="dark">Dark Theme (Midnight Slate)</option>
                  <option value="custom">Custom Brand Colors (Amber)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Banner Position</label>
                <select
                  value={cookieBannerPosition}
                  onChange={(e: any) => setCookieBannerPosition(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                >
                  <option value="bottom_center">Bottom Center (Overlay)</option>
                  <option value="bottom_full">Bottom Full Width Banner</option>
                  <option value="bottom_left">Bottom Left Floating Card</option>
                  <option value="bottom_right">Bottom Right Floating Card</option>
                  <option value="center">Screen Center Modal</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 2. Interactive Cookie Banner Live Preview */}
        {cookieBannerEnabled && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Live Storefront Cookie Banner Preview</h2>

            <div className="p-8 bg-gray-100 rounded-xl relative min-h-[160px] flex items-end justify-center border border-gray-200 overflow-hidden">
              <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800')" }} />

              {/* Simulated Cookie Overlay */}
              <div
                className={`z-10 w-full max-w-md p-4 rounded-xl shadow-xl border text-xs space-y-3 transition-all ${
                  cookieBannerTheme === "dark"
                    ? "bg-slate-900 text-white border-slate-800"
                    : cookieBannerTheme === "custom"
                    ? "bg-amber-900 text-white border-amber-800"
                    : "bg-white text-gray-900 border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Cookie className="w-4 h-4 text-amber-500" />
                  <span>We value your privacy</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  We use cookies and telemetry to personalize your leather shopping experience and analyze site traffic.
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => toast.info("Cookie preferences modal simulated.")} className="px-3 py-1 bg-gray-200/40 rounded-lg text-[11px] font-semibold">
                    Manage Preferences
                  </button>
                  <button type="button" onClick={() => toast.success("Cookies accepted!")} className="px-3.5 py-1 bg-amber-800 text-white rounded-lg text-[11px] font-bold">
                    Accept All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Network Intelligence & Checkout Opt-In */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Tracking Intelligence &amp; Checkout Compliance</h2>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900 text-sm block">Network Tracking Intelligence</span>
                <span className="text-gray-600 text-xs block">Automatically restricts ad pixels and tracking beacons when visitors opt out.</span>
              </div>
              <input
                type="checkbox"
                checked={networkIntelligenceEnabled}
                onChange={(e) => setNetworkIntelligenceEnabled(e.target.checked)}
                className="w-4 h-4 text-amber-800 rounded border-gray-300"
              />
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900 text-sm block">Checkout Privacy Agreement Checkbox</span>
                <span className="text-gray-600 text-xs block">Requires customers to accept Terms &amp; Privacy Policy before placing orders.</span>
              </div>
              <input
                type="checkbox"
                checked={showInCheckout}
                onChange={(e) => setShowInCheckout(e.target.checked)}
                className="w-4 h-4 text-amber-800 rounded border-gray-300"
              />
            </div>
          </div>
        </div>

        {/* 4. Automated Footer Menu Binding for Data Opt-Out */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Data Sharing Opt-Out Link Injection</h2>
              <p className="text-xs text-gray-500">Automatically injects the "Do Not Sell My Info" page link into your storefront navigation.</p>
            </div>

            <input
              type="checkbox"
              checked={optOutLinkEnabled}
              onChange={(e) => setOptOutLinkEnabled(e.target.checked)}
              className="w-5 h-5 text-amber-800 rounded border-gray-300 cursor-pointer"
            />
          </div>

          {optOutLinkEnabled && (
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Target Navigation Menu</label>
              <select
                value={optOutMenuTarget}
                onChange={(e) => setOptOutMenuTarget(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
              >
                <option value="Footer Menu">Footer Menu</option>
                <option value="Information Menu">Information Menu</option>
                <option value="Customer Support Menu">Customer Support Menu</option>
              </select>
              <p className="text-[11px] text-gray-500 mt-1">
                Injects <code className="bg-gray-100 px-1 rounded">{"{ title: 'Do Not Sell My Info', path: '/pages/opt-out' }"}</code> directly into {optOutMenuTarget}.
              </p>
            </div>
          )}
        </div>

        {/* Save Bar */}
        <div className="flex justify-end gap-3 pt-3">
          <button
            type="submit"
            className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Save Privacy Settings
          </button>
        </div>
      </form>
    </div>
  )
}
