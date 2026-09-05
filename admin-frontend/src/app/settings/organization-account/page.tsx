"use client"

import { API_BASE, apiFetch, getStoredUser } from "@/lib/api"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Users, Plus, DownloadSimple, UploadSimple, ShieldCheck, X, Check, Lock, UserCheck, Trash, PencilSimple } from "@phosphor-icons/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"
import { useFormDirty } from "@/components/unsaved-changes"

const API = `${API_BASE}/api/v1/settings`

interface UserRecord {
  id: number
  email: string
  full_name: string | null
  user_type: string
  role_id: number | null
  is_admin: boolean
  is_active: boolean
  created_at: string
}

interface RoleRecord {
  id: number
  name: string
  domain: string
  description: string | null
  is_system: boolean
  user_count: number
}

export default function AdminSettingsUsersPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [addUserModalOpen, setAddUserModalOpen] = useState(false)
  const [userType, setUserType] = useState<"admin" | "pos">("pos")
  const [emailInput, setEmailInput] = useState("")
  const [fullNameInput, setFullNameInput] = useState("")
  const [selectedRoleId, setSelectedRoleId] = useState<number | "">("")
  const [passwordInput, setPasswordInput] = useState("")
  const [requireSecureAuth, setRequireSecureAuth] = useState(true)
  const [editUserModalOpen, setEditUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const [isActiveInput, setIsActiveInput] = useState(true)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const { reset } = useFormDirty({
    userType,
    emailInput,
    fullNameInput,
    selectedRoleId,
    passwordInput,
    requireSecureAuth,
  })

  const [usersList, setUsersList] = useState<UserRecord[]>([])
  const [rolesList, setRolesList] = useState<RoleRecord[]>([])

  const roleMap = Object.fromEntries(rolesList.map((r) => [r.id, r.name]))

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [users, roles] = await Promise.all([
        apiFetch<UserRecord[]>(`${API}/users/`),
        apiFetch<RoleRecord[]>(`${API}/roles/list-roles`),
      ])
      setUsersList(users)
      setRolesList(roles)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users or roles from backend.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const currentUser = getStoredUser() as { is_admin?: boolean; email?: string } | null

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && currentUser && !currentUser.is_admin) {
      router.replace("/")
    }
  }, [mounted, currentUser, router])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const header = ["Email", "Full Name", "User Type", "Status", "Role"]
    const rows = usersList.map((u) => [
      u.email,
      u.full_name || "",
      u.user_type,
      u.is_active ? "Active" : "Inactive",
      roleMap[u.role_id ?? 0] ?? "",
    ])
    const escapeCsv = (val: string) => (/[",\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val)
    const csv = [header, ...rows].map((r) => r.map(escapeCsv).join(",")).join("\n")
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `eligo-staff-users-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Staff user list exported to CSV.")
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "")
      if (lines.length < 2) {
        toast.error("CSV must contain a header row and at least one data row.")
        return
      }
      const parseLine = (line: string) => {
        const out: string[] = []
        let current = ""
        let inQuotes = false
        for (let i = 0; i < line.length; i++) {
          const ch = line[i]
          if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') { current += '"'; i++ }
            else if (ch === '"') inQuotes = false
            else current += ch
          } else {
            if (ch === '"') inQuotes = true
            else if (ch === ",") { out.push(current); current = "" }
            else current += ch
          }
        }
        out.push(current)
        return out.map((c) => c.trim())
      }
      const rows = lines.slice(1).map(parseLine)
      const created: string[] = []
      const failed: string[] = []
      for (const cols of rows) {
        const email = cols[0] ?? ""
        if (!email) continue
        const password = (cols[3] ?? "password123")
        const full_name = cols[1] || null
        const user_type = (cols[2] ?? "pos") === "admin" ? "admin" : "pos"
        try {
          await apiFetch(`${API}/users/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, full_name, user_type, role_id: null }),
          })
          created.push(email)
        } catch {
          failed.push(email)
        }
      }
      if (created.length > 0) toast.success(`Imported ${created.length} user(s): ${created.join(", ")}`)
      if (failed.length > 0) toast.error(`Failed: ${failed.join(", ")}`)
      fetchData()
    } catch {
      toast.error("Failed to read the CSV file.")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput || !passwordInput) {
      toast.error("Email and password are required.")
      return
    }
    try {
      setSubmitting(true)
      await apiFetch(`${API}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          password: passwordInput,
          full_name: fullNameInput || null,
          user_type: userType,
          role_id: selectedRoleId || null,
        }),
      })
      toast.success(`User "${fullNameInput || emailInput}" created successfully!`)
      setAddUserModalOpen(false)
      setEmailInput("")
      setFullNameInput("")
      setPasswordInput("")
      setSelectedRoleId("")
      reset()
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error while creating user.")
    } finally {
      setSubmitting(false)
    }
  }

  const openEditUser = (user: UserRecord) => {
    setEditingUser(user)
    setFullNameInput(user.full_name || "")
    setSelectedRoleId(user.role_id ?? "")
    setIsActiveInput(user.is_active)
    setEditUserModalOpen(true)
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    try {
      setSubmitting(true)
      await apiFetch(`${API}/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullNameInput,
          role_id: selectedRoleId || null,
          is_active: isActiveInput,
        }),
      })
      toast.success(`User "${fullNameInput || editingUser.email}" updated successfully!`)
      setEditUserModalOpen(false)
      setEditingUser(null)
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error while updating user.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (user: UserRecord) => {
    if (!confirm(`Are you sure you want to delete this user?`)) return
    try {
      setDeletingId(user.id)
      await apiFetch(`${API}/users/${user.id}`, { method: "DELETE" })
      toast.success("User deleted successfully")
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error while deleting user.")
    } finally {
      setDeletingId(null)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-amber-800 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (currentUser && !currentUser.is_admin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-amber-800 mx-auto" />
          <h1 className="text-lg font-bold text-gray-900">Access denied</h1>
          <p className="text-xs text-gray-500">
            Only administrators can manage users and roles.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-amber-800 text-white rounded-xl font-semibold text-xs"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      <PageHeader
        title="Users"
        icon={<Users className="w-5 h-5" />}
        actions={
          <>
            <button
              onClick={handleExport}
              className="eligo-btn-secondary"
            >
              <DownloadSimple className="w-4 h-4 text-gray-600" />
              <span>Export</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="eligo-btn-secondary"
            >
              <UploadSimple className="w-4 h-4 text-gray-600" />
              <span>Import</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={handleImport}
            />
            <button
              onClick={() => setAddUserModalOpen(true)}
              className="eligo-btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Add users</span>
            </button>
          </>
        }
      />

      {/* Main Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="eligo-table-wrap">
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-500">Loading users…</div>
          ) : usersList.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500">No users found. Add a user to get started.</div>
          ) : (
            <table className="eligo-table">
              <thead>
                <tr>
                  <th className="eligo-th">User</th>
                  <th className="eligo-th">User Type</th>
                  <th className="eligo-th">Status</th>
                  <th className="eligo-th text-right">Role</th>
                  <th className="eligo-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-amber-800 text-xs">{u.full_name || "—"}</div>
                      <span className="text-[11px] text-gray-500">{u.email}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800 capitalize">{u.user_type === "pos" ? "Point of Sale user" : "Admin user"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        u.is_active
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-red-100 text-red-800 border-red-200"
                      }`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      {roleMap[u.role_id ?? 0] ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditUser(u)}
                          className="p-2 rounded-lg bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-900 transition-colors cursor-pointer"
                          title="Edit user"
                        >
                          <PencilSimple className="w-4 h-4" />
                        </button>
                        {!u.is_admin && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={deletingId === u.id}
                            className="p-2 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete user"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Users Modal Form */}
      {addUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Add users</h3>
              <button onClick={() => setAddUserModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              {/* User Details Type Selection */}
              <div>
                <label className="block font-bold text-gray-900 uppercase tracking-wide mb-2">User details</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType("admin")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      userType === "admin" ? "bg-amber-50 border-amber-800 text-amber-900 font-bold" : "bg-gray-50 border-gray-300 text-gray-700"
                    }`}
                  >
                    <div className="font-bold">Admin user</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Supports all roles</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserType("pos")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      userType === "pos" ? "bg-amber-50 border-amber-800 text-amber-900 font-bold" : "bg-gray-50 border-gray-300 text-gray-700"
                    }`}
                  >
                    <div className="font-bold">Point of Sale user</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Only supports POS roles</div>
                  </button>
                </div>
              </div>

              {/* Full Name & Email Inputs */}
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Adnan Khan"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="staff@eligoleather.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
                />
              </div>

              {/* Secure Sign-In Requirement */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-900">
                  <input
                    type="checkbox"
                    checked={requireSecureAuth}
                    onChange={(e) => setRequireSecureAuth(e.target.checked)}
                    className="rounded border-gray-300 text-amber-800"
                  />
                  <span>Secure sign-in method</span>
                </label>
                <p className="text-[11px] text-gray-500">
                  Requires a secure sign-in method, like a passkey or two-step authentication, to log in.
                </p>
              </div>

              {/* Roles Assignment Picker */}
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Assign Role</label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-amber-800"
                >
                  <option value="">— No role —</option>
                  {rolesList.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAddUserModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Creating…" : "Assign User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Edit user</h3>
              <button onClick={() => { setEditUserModalOpen(false); setEditingUser(null); }} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="font-bold text-amber-800 text-xs">{editingUser.full_name || "—"}</div>
                <span className="text-[11px] text-gray-500">{editingUser.email}</span>
              </div>

              {/* Full Name Input */}
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Adnan Khan"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
                />
              </div>

              {/* Roles Assignment Picker */}
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Assign Role</label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-amber-800"
                >
                  <option value="">— No role —</option>
                  {rolesList.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              {/* Active Status Toggle */}
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Status</label>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-900">
                    <input
                      type="checkbox"
                      checked={isActiveInput}
                      onChange={(e) => setIsActiveInput(e.target.checked)}
                      className="rounded border-gray-300 text-amber-800"
                    />
                    <span>Active</span>
                  </label>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Inactive users cannot login to their account.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setEditUserModalOpen(false); setEditingUser(null); }}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
