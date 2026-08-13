"use client"

import { useState } from "react"
import Link from "next/link"
import { Key, ShieldCheck, DownloadSimple, ClockCounterClockwise, Trash, ArrowsClockwise } from "@phosphor-icons/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"

export default function AdminSettingsSecurityPage() {
  const [collaboratorCode, setCollaboratorCode] = useState("0025")
  const [activeTab, setActiveTab] = useState<"security" | "activity">("security")

  const securityAuditLogs = [
    {
      id: 1,
      event: "Adnan Khan was deleted.",
      resource: "User",
      date: "08/05/2025, 12:16 pm GMT+5",
      user: "Bilal Hussain Abbasi",
    },
    {
      id: 2,
      event: "Sales associate was created.",
      resource: "Role",
      date: "08/05/2025, 11:45 am GMT+5",
      user: "Bilal Hussain Abbasi",
    },
    {
      id: 3,
      event: "Cashier was created.",
      resource: "Role",
      date: "08/04/2025, 3:20 pm GMT+5",
      user: "Bilal Hussain Abbasi",
    },
    {
      id: 4,
      event: "User login from IP 192.168.18.176",
      resource: "User",
      date: "08/08/2026, 6:45 pm GMT+5",
      user: "Bilal Hussain Abbasi",
    },
  ]

  const handleGenerateCode = () => {
    const newCode = Math.floor(1000 + Math.random() * 9000).toString()
    setCollaboratorCode(newCode)
    toast.success(`Generated new collaborator request code: ${newCode}`)
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      <PageHeader
        title="Security & User Activity Logs"
        icon={<Key className="w-5 h-5" />}
        actions={
          <>
            <button
              onClick={() => setActiveTab(activeTab === "security" ? "activity" : "security")}
              className="eligo-btn-secondary"
            >
              {activeTab === "security" ? "View Activity Logs" : "View Security Dashboard"}
            </button>
            <button
              onClick={() => toast.info("Exporting security activity logs...")}
              className="eligo-btn-primary"
            >
              <DownloadSimple className="w-4 h-4" />
              <span>Export</span>
            </button>
          </>
        }
      />

      {activeTab === "security" ? (
        <div className="space-y-6 text-xs">
          {/* User Activity Logs Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">User Activity Logs</h2>
                <p className="text-xs text-gray-500">Track all security events, user additions, role mutations, and deletion history.</p>
              </div>

              <button
                onClick={() => setActiveTab("activity")}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl shadow-2xs cursor-pointer"
              >
                View
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3 font-semibold text-gray-800">
                <ClockCounterClockwise className="w-5 h-5 text-amber-800" />
                <span>Most recent event: &quot;Adnan Khan was deleted.&quot;</span>
              </div>
              <span className="text-[11px] text-gray-500 font-mono">08/05/2025, 12:16 pm GMT+5</span>
            </div>
          </div>

          {/* Collaborators Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Collaborator Access</h2>
                <p className="text-xs text-gray-500">Allow external developers or agency partners to request access to your store using a 4-digit code.</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="font-bold text-gray-900 uppercase tracking-wide block">Collaborator Request Code</span>
                <span className="text-2xl font-mono font-bold text-amber-800 tracking-wider">{collaboratorCode}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerateCode}
                  className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl font-bold text-gray-800 inline-flex items-center gap-2"
                >
                  <ArrowsClockwise className="w-4 h-4 text-amber-800" />
                  <span>Generate new code</span>
                </button>
                <button
                  onClick={() => {
                    setCollaboratorCode("Disabled")
                    toast.info("Collaborator code deleted.")
                  }}
                  className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl border border-rose-200"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Detailed User Activity Logs Audit Table */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center text-xs">
            <span className="font-bold text-gray-900">Audit Trail: Security &gt; User activity logs</span>
            <span className="text-gray-500">Total events: {securityAuditLogs.length}</span>
          </div>

          <div className="eligo-table-wrap">
            <table className="eligo-table">
              <thead>
                <tr>
                  <th className="eligo-th">Event</th>
                  <th className="eligo-th">Resource</th>
                  <th className="eligo-th">Date &amp; Time</th>
                  <th className="eligo-th text-right">Initiated By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {securityAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{log.event}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800 border border-gray-200">
                        {log.resource}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-500">{log.date}</td>
                    <td className="px-6 py-4 text-right font-bold text-amber-800">{log.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
