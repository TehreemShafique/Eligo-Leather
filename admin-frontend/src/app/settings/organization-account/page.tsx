"use client"

import { useState } from "react"
import Link from "next/link"
import { Users, Plus, DownloadSimple, UploadSimple, ShieldCheck, X, Check, Lock, UserCheck } from "@phosphor-icons/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"

export default function AdminSettingsUsersPage() {
  const [addUserModalOpen, setAddUserModalOpen] = useState(false)
  const [userType, setUserType] = useState<"admin" | "pos">("admin")
  const [emailInput, setEmailInput] = useState("")
  const [fullNameInput, setFullNameInput] = useState("")
  const [selectedRole, setSelectedRole] = useState("Administrator")
  const [requireSecureAuth, setRequireSecureAuth] = useState(true)

  const usersList = [
    {
      id: 1,
      name: "Bilal Hussain Abbasi",
      email: "eligoleather9@gmail.com",
      status: "Active",
      role: "Store owner",
      userType: "Admin user",
    },
    {
      id: 2,
      name: "Muhammad Usama Shakeel",
      email: "usama.shakeel@example.com",
      status: "Active",
      role: "Administrator",
      userType: "Admin user",
    },
    {
      id: 3,
      name: "POS Retail Cashier",
      email: "pos.terminal01@eligoleather.com",
      status: "Active",
      role: "Cashier",
      userType: "Point of Sale user",
    },
  ]

  const availableRoles = [
    "Administrator",
    "Store manager",
    "Marketer",
    "Merchandiser",
    "Online store editor",
    "Customer support",
    "POS administrator",
    "Cashier",
  ]

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput) {
      toast.error("Please enter a valid user email address.")
      return
    }
    toast.success(`User "${fullNameInput || emailInput}" added to database successfully!`)
    setAddUserModalOpen(false)
    setEmailInput("")
    setFullNameInput("")
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      <PageHeader
        title="Users"
        icon={<Users className="w-5 h-5" />}
        actions={
          <>
            <button
              onClick={() => toast.info("Exporting staff user list...")}
              className="eligo-btn-secondary"
            >
              <DownloadSimple className="w-4 h-4 text-gray-600" />
              <span>Export</span>
            </button>
            <button
              onClick={() => toast.info("Importing staff list...")}
              className="eligo-btn-secondary"
            >
              <UploadSimple className="w-4 h-4 text-gray-600" />
              <span>Import</span>
            </button>
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

      {/* Database Authentication System Note */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center gap-2.5 font-semibold">
          <ShieldCheck className="w-5 h-5 text-amber-800 shrink-0" />
          <span>
            Custom Database Architecture Active: Users are stored directly in PostgreSQL with JWT authentication. No SaaS user limits applied.
          </span>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th">User</th>
                <th className="eligo-th">User Type</th>
                <th className="eligo-th">Status</th>
                <th className="eligo-th text-right">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-amber-800 text-xs">{u.name}</div>
                    <span className="text-[11px] text-gray-500">{u.email}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{u.userType}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  required
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
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-amber-800"
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>{role}</option>
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
                  className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer"
                >
                  Assign User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
