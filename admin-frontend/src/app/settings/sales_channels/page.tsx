"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  InstagramLogo,
  ArrowsClockwise,
  Gear,
  ShieldCheck,
  X,
  CheckCircle,
  WarningCircle,
  Key,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { useFormDirty } from "@/components/unsaved-changes"

export default function AdminSettingsSalesChannelsPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [authModalOpen, setAuthModalOpen] = useState(false)

  // Meta Graph API Token Form State
  const [metaAppId, setMetaAppId] = useState("")
  const [metaAppSecret, setMetaAppSecret] = useState("")
  const [metaAccessToken, setMetaAccessToken] = useState("")
  const [pixelId, setPixelId] = useState("PX-99887766-META")
  const [catalogId, setCatalogId] = useState("CAT-ELIGOLEATHER-01")
  const [syncFrequency, setSyncFrequency] = useState("Real-time on stock update")

  const [channelData, setChannelData] = useState({
    code: "facebook_instagram",
    name: "Facebook & Instagram",
    status: "API Not Integrated Yet",
    description: "Meta Commerce API. Outbound catalog sync & inbound Instagram order webhook ingestion.",
    icon: InstagramLogo,
    color: "text-pink-800 bg-pink-50 border-pink-200",
    hasCredentials: false,
    lastSync: "Pending Meta API Key",
  })

  const { reset } = useFormDirty({
    metaAppId,
    metaAppSecret,
    metaAccessToken,
    pixelId,
    catalogId,
  })

  if (!mounted) return null

  const handleSaveOAuthTokens = (e: React.FormEvent) => {
    e.preventDefault()
    if (!metaAccessToken && !metaAppId) {
      toast.error("Please enter your Meta App credentials or Graph Access Token.")
      return
    }

    setChannelData({
      ...channelData,
      status: "Active & Connected",
      hasCredentials: true,
      lastSync: "Just now",
    })

    setAuthModalOpen(false)
    toast.success("Meta Graph API credentials saved! Outbound catalog sync activated for Facebook & Instagram.")
    reset()
  }

  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
            <span>Sales Channels Integration</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sales Channels — Facebook &amp; Instagram
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your Meta Commerce API integration to sync product catalogs and ingest orders directly from Facebook &amp; Instagram.
          </p>
        </div>
      </div>

      {/* API Pending Notice Banner */}
      {!channelData.hasCredentials && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
          <WarningCircle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm block">API Not Integrated Yet (Awaiting Meta App Credentials)</span>
            <p className="text-amber-800 leading-relaxed">
              Facebook &amp; Instagram Meta API approval is currently pending. When your Meta App ID, App Secret, and Graph Access Token are approved by Meta Developer Console, enter them below to enable live catalog sync.
            </p>
          </div>
        </div>
      )}

      {/* Main Channel Item Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-700">
              <InstagramLogo className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">{channelData.name}</h2>
              <span className="text-xs text-gray-500 font-mono">Last Sync: {channelData.lastSync}</span>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              channelData.hasCredentials
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            {channelData.status}
          </span>
        </div>

        <p className="text-gray-600 text-xs leading-relaxed">{channelData.description}</p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold text-xs shadow-2xs inline-flex items-center gap-2 cursor-pointer"
          >
            <Gear className="w-4 h-4" />
            <span>{channelData.hasCredentials ? "Manage Meta Credentials" : "Add Meta API Credentials"}</span>
          </button>
        </div>
      </div>

      {/* OAuth & Meta Graph API Token Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-800" />
                <h3 className="text-base font-bold text-gray-900">Meta Graph API Credentials</h3>
              </div>
              <button onClick={() => setAuthModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOAuthTokens} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Meta App ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 987654321012345"
                    value={metaAppId}
                    onChange={(e) => setMetaAppId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-mono text-gray-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Meta App Secret</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={metaAppSecret}
                    onChange={(e) => setMetaAppSecret(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-mono text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Meta Graph Access Token (OAuth)</label>
                <textarea
                  rows={3}
                  value={metaAccessToken}
                  onChange={(e) => setMetaAccessToken(e.target.value)}
                  placeholder="Paste Meta Graph Access Token (EAAG...)"
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-300 font-mono text-gray-900"
                />
                <p className="text-[11px] text-gray-500 mt-1">Obtain from Meta Developer Console &gt; Tools &gt; Graph API Explorer.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Meta Pixel ID</label>
                  <input
                    type="text"
                    value={pixelId}
                    onChange={(e) => setPixelId(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Commerce Catalog ID</label>
                  <input
                    type="text"
                    value={catalogId}
                    onChange={(e) => setCatalogId(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer"
                >
                  Save Meta Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
