"use client"

import { API_BASE } from "@/lib/api"

import { useState, useEffect, useCallback } from "react"
import { Key, ShieldCheck, DownloadSimple, ClockCounterClockwise, Trash, ArrowsClockwise } from "@phosphor-icons/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"

const API = `${API_BASE}/api/v1/settings/security`

interface ActivityLog {
  id: number
  event: string
  resource_type: string
  actor_user_id: number | null
  created_at: string
}

interface CollaboratorCode {
  id: number
  code: string
  is_active: boolean
  created_at: string
}

function formatTimestamp(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString("en-US", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "numeric", minute: "2-digit", hour12: true,
      timeZoneName: "short",
    })
  } catch {
    return iso
  }
}

export default function AdminSettingsSecurityPage() {
  const [activeTab, setActiveTab] = useState<"security" | "activity">("security")
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(false)

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [collaboratorCodes, setCollaboratorCodes] = useState<CollaboratorCode[]>([])

  const mostRecentLog = activityLogs.length > 0 ? activityLogs[0] : null

  const fetchSecurityData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/collaborator-codes`)
      if (res.ok) setCollaboratorCodes(await res.json())
    } catch {
      toast.error("Failed to load collaborator codes.")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    try {
      setLogsLoading(true)
      const res = await fetch(`${API}/activity-logs`)
      if (res.ok) setActivityLogs(await res.json())
    } catch {
      toast.error("Failed to load activity logs.")
    } finally {
      setLogsLoading(false)
    }
  }, [])

  useEffect(() => { fetchSecurityData() }, [fetchSecurityData])
  useEffect(() => { if (activeTab === "activity") fetchLogs() }, [activeTab, fetchLogs])

  const handleGenerateCode = async () => {
    try {
      const res = await fetch(`${API}/collaborator-codes`, { method: "POST" })
      if (!res.ok) {
        toast.error("Failed to generate collaborator code.")
        return
      }
      const newCode: CollaboratorCode = await res.json()
      setCollaboratorCodes((prev) => [newCode, ...prev])
      toast.success(`Generated new collaborator request code: ${newCode.code}`)
    } catch {
      toast.error("Network error while generating code.")
    }
  }

  const handleRevokeCode = async (codeId: number) => {
    try {
      const res = await fetch(`${API}/collaborator-codes/${codeId}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("Failed to revoke collaborator code.")
        return
      }
      setCollaboratorCodes((prev) => prev.filter((c) => c.id !== codeId))
      toast.success("Collaborator code revoked.")
    } catch {
      toast.error("Network error while revoking code.")
    }
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
                <span>
                  {mostRecentLog
                    ? <>Most recent event: &quot;{mostRecentLog.event}&quot;</>
                    : "No activity events recorded yet."
                  }
                </span>
              </div>
              {mostRecentLog && (
                <span className="text-[11px] text-gray-500 font-mono">{formatTimestamp(mostRecentLog.created_at)}</span>
              )}
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

            {loading ? (
              <div className="p-6 text-center text-xs text-gray-500">Loading collaborator codes…</div>
            ) : collaboratorCodes.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">
                <span>No active collaborator codes.</span>
                <div className="mt-3">
                  <button
                    onClick={handleGenerateCode}
                    className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl font-bold text-gray-800 inline-flex items-center gap-2"
                  >
                    <ArrowsClockwise className="w-4 h-4 text-amber-800" />
                    <span>Generate first code</span>
                  </button>
                </div>
              </div>
            ) : (
              collaboratorCodes.map((cc) => (
                <div key={cc.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-gray-900 uppercase tracking-wide block">Collaborator Request Code</span>
                    <span className="text-2xl font-mono font-bold text-amber-800 tracking-wider">{cc.code}</span>
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
                      onClick={() => handleRevokeCode(cc.id)}
                      className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl border border-rose-200"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Detailed User Activity Logs Audit Table */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center text-xs">
            <span className="font-bold text-gray-900">Audit Trail: Security &gt; User activity logs</span>
            <span className="text-gray-500">Total events: {activityLogs.length}</span>
          </div>

          <div className="eligo-table-wrap">
            {logsLoading ? (
              <div className="p-12 text-center text-xs text-gray-500">Loading activity logs…</div>
            ) : activityLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-500">No activity logs recorded yet.</div>
            ) : (
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
                  {activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{log.event}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800 border border-gray-200">
                          {log.resource_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-500">{formatTimestamp(log.created_at)}</td>
                      <td className="px-6 py-4 text-right font-bold text-amber-800">
                        {log.actor_user_id ? `User #${log.actor_user_id}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
