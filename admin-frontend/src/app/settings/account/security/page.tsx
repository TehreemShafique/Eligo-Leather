"use client"

import { useState } from "react"
import Link from "next/link"
import {
  User,
  ShieldCheck,
  Key,
  LockKey,
  EnvelopeSimple,
  DeviceMobile,
  Desktop,
  CheckCircle,
  X,
  Trash,
  Sparkle,
  Fingerprint,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { getStoredUser } from "@/lib/api"

export default function AdminPersonalAccountSecurityPage() {
  const user = getStoredUser() as { email?: string; full_name?: string | null } | null
  const displayName = user?.full_name || user?.email || "Admin"
  const displayEmail = user?.email || ""
  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "AD"
  const [secondaryEmail, setSecondaryEmail] = useState("bilal.talib25@gmail.com")
  const [is2faOn, setIs2faOn] = useState(true)

  // Active Sessions Ledger List
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 1,
      device: "Chrome on Windows",
      location: "Islamabad (Islamabad), Pakistan",
      timestamp: "Jul 24, 3:48 pm",
      isCurrent: true,
    },
    {
      id: 2,
      device: "Chrome on Windows",
      location: "Rawalpindi (Punjab), Pakistan",
      timestamp: "Jun 6, 1:17 pm",
      isCurrent: false,
    },
    {
      id: 3,
      device: "Chrome on Windows",
      location: "Rawalpindi (Punjab), Pakistan",
      timestamp: "Jun 30, 5:17 pm",
      isCurrent: false,
    },
    {
      id: 4,
      device: "Chrome on Windows",
      location: "Islamabad (Islamabad), Pakistan",
      timestamp: "Jul 24, 3:44 pm",
      isCurrent: false,
    },
  ])

  const handleLogOutSession = (id: number) => {
    setActiveSessions(activeSessions.filter((s) => s.id !== id))
    toast.success("Remote session logged out successfully!")
  }

  const handleTurnOff2FA = () => {
    setIs2faOn(false)
    toast.warning("Two-step authentication turned off.")
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header & Sub-Tabs Navigation */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-400 text-sky-950 font-bold text-lg flex items-center justify-center shadow-2xs">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
              <span className="text-xs text-gray-500">{displayEmail} &bull; Store Administrator</span>
            </div>
          </div>

          {/* Sub-Tabs: General vs Security */}
          <div className="flex border-b border-gray-200 gap-6 text-xs font-bold pt-2">
            <Link
              href="/settings/account/personal"
              className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>General</span>
            </Link>

            <Link
              href="/settings/account/security"
              className="pb-3 border-b-2 border-amber-800 text-amber-800 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Security</span>
            </Link>
          </div>
        </div>

        <div className="space-y-6 text-xs">
          {/* 1. Passkeys Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Fingerprint className="w-6 h-6 text-amber-800 shrink-0" />
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Passkeys</h2>
                  <p className="text-xs text-gray-500">Fast, passwordless login using your device biometrics (fingerprint, face, or screen lock). Takes under 1 minute to set up.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toast.success("Passkey biometric prompt initialized!")}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl shadow-2xs"
              >
                Turn on passkey
              </button>
            </div>
          </div>

          {/* 2. Password Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LockKey className="w-6 h-6 text-amber-800 shrink-0" />
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Password</h2>
                  <p className="text-xs text-gray-500">You last changed your password about 1 year ago.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toast.info("Change password modal opened.")}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 font-bold text-gray-800 rounded-xl shadow-2xs"
              >
                Change password
              </button>
            </div>
          </div>

          {/* 3. Secondary Email Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <EnvelopeSimple className="w-6 h-6 text-amber-800 shrink-0" />
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Secondary Email</h2>
                  <p className="text-xs text-gray-500">Backup recovery address for password resets and security notices.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toast.info("Add secondary email modal opened.")}
                className="text-amber-800 font-bold hover:underline"
              >
                Add email
              </button>
            </div>

            {secondaryEmail && (
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-gray-900">{secondaryEmail}</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => toast.info("Edit secondary email modal.")} className="text-amber-800 font-bold hover:underline">
                    Edit
                  </button>
                  <button type="button" onClick={() => { setSecondaryEmail(""); toast.info("Secondary email removed."); }} className="text-rose-600 font-bold hover:underline">
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Two-Step Authentication (2FA) Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <Key className="w-6 h-6 text-amber-800 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-gray-900">Two-Step Authentication (2FA)</h2>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${is2faOn ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"}`}>
                      {is2faOn ? "On" : "Off"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Adds an extra layer of protection when logging into your admin profile.</p>
                </div>
              </div>
            </div>

            {is2faOn && (
              <div className="space-y-3 pt-1">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900 block">Primary Method: Authenticator App</span>
                    <span className="text-[11px] text-gray-500">Google Authenticator or 1Password TOTP tokens.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleTurnOff2FA}
                    className="text-rose-600 font-bold hover:underline text-xs"
                  >
                    Remove
                  </button>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900 block">Backup Recovery Codes</span>
                    <span className="text-[11px] text-gray-500">You last generated your recovery codes almost 2 years ago.</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toast.success("New 10-digit recovery codes generated!")}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-gray-800 font-bold hover:bg-gray-50"
                  >
                    Generate Codes
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5. Active Devices Session Ledger Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-900">Active Devices Session Ledger</h2>
              <p className="text-xs text-gray-500">If you don't recognize a device, log out to keep your admin account secure.</p>
            </div>

            <div className="eligo-table-wrap">
              <table className="eligo-table">
                <thead>
                  <tr>
                    <th className="eligo-th">Device &amp; Browser</th>
                    <th className="eligo-th">Location</th>
                    <th className="eligo-th">Last Active</th>
                    <th className="eligo-th text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Desktop className="w-5 h-5 text-amber-800 shrink-0" />
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-2">
                              <span>{session.device}</span>
                              {session.isCurrent && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">This Device</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">{session.location}</td>
                      <td className="px-6 py-4 text-gray-500">{session.timestamp}</td>
                      <td className="px-6 py-4 text-right">
                        {!session.isCurrent ? (
                          <button
                            onClick={() => handleLogOutSession(session.id)}
                            className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold transition-colors"
                          >
                            Log Out
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold text-[11px]">Active Now</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
