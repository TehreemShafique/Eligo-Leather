"use client"

import { API_BASE } from "@/lib/api"

import { useState, useEffect, useCallback } from "react"
import { ShieldCheck } from "@phosphor-icons/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"
import PermissionGuard from "@/components/auth/permission-guard"

const API = `${API_BASE}/api/v1/settings/roles/list-roles`

interface RoleRecord {
  id: number
  name: string
  domain: string
  description: string | null
  is_system: boolean
  user_count: number
}

const DOMAIN_STYLES: Record<string, string> = {
  organization: "bg-purple-100 text-purple-800 border border-purple-200",
  store: "bg-blue-100 text-blue-800 border border-blue-200",
  point_of_sale: "bg-emerald-100 text-emerald-800 border border-emerald-200",
}

const DOMAIN_LABELS: Record<string, string> = {
  organization: "Organization",
  store: "Store",
  point_of_sale: "Point of Sale",
}

export default function AdminSettingsRolesPage() {
  const [rolesList, setRolesList] = useState<RoleRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(API)
      if (!res.ok) {
        toast.error("Failed to load roles from backend.")
        return
      }
      setRolesList(await res.json())
    } catch {
      toast.error("Network error while loading roles.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRoles() }, [fetchRoles])

  return (
    <PermissionGuard feature="users">
      <div className="space-y-6 font-sans max-w-5xl mx-auto">
        <PageHeader
          title="Roles"
          icon={<ShieldCheck className="w-5 h-5" />}
        />

      {/* Roles Directory Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="eligo-table-wrap">
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-500">Loading roles…</div>
          ) : rolesList.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500">No roles found. Seed system roles from the backend.</div>
          ) : (
            <table className="eligo-table">
              <thead>
                <tr>
                  <th className="eligo-th">Role Name</th>
                  <th className="eligo-th">System Domain</th>
                  <th className="eligo-th text-right">Assigned Users</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rolesList.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-amber-800">{r.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${DOMAIN_STYLES[r.domain] ?? "bg-gray-100 text-gray-800 border border-gray-200"}`}>
                        {DOMAIN_LABELS[r.domain] ?? r.domain}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      {r.user_count} {r.user_count === 1 ? "user" : "users"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
    </PermissionGuard>
  )
}
