"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Bell,
  Envelope,
  PaperPlaneTilt,
  Code,
  Eye,
  CheckCircle,
  X,
  Sparkle,
  ArrowsClockwise,
  Gear,
  Key,
  ShieldCheck,
  Tag,
  Truck,
  Package,
} from "@phosphor-icons/react"
import { toast } from "sonner"

const API = "http://localhost:8000/api/v1/settings/notifications"

interface NotificationTemplate {
  id: number
  code: string
  title: string
  desc: string
  type: string
  subject: string
  htmlBody: string
  is_active: boolean
  is_built_in: boolean
}

function mapBackendTemplate(t: any): NotificationTemplate {
  return {
    id: t.id,
    code: t.code,
    title: t.name,
    desc: "",
    type: "Email (Resend + Jinja2)",
    subject: t.subject,
    htmlBody: t.html_body,
    is_active: t.is_active,
    is_built_in: t.is_built_in,
  }
}

export default function AdminSettingsNotificationsPage() {
  const [mailProvider, setMailProvider] = useState<"resend" | "smtp">("resend")
  const [resendApiKey, setResendApiKey] = useState("")
  const [fromEmail, setFromEmail] = useState("")
  const [fromName, setFromName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [savingConfig, setSavingConfig] = useState(false)
  const [senderEnabled, setSenderEnabled] = useState(true)

  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [testingSmtp, setTestingSmtp] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(true)

  const [templates, setTemplates] = useState<NotificationTemplate[]>([])

  useEffect(() => {
    fetchSenderConfig()
    fetchTemplates()
  }, [])

  const fetchSenderConfig = async () => {
    try {
      const res = await fetch(`${API}/sender`)
      if (!res.ok) return
      const data = await res.json()
      setFromEmail(data.from_email || "")
      setFromName(data.from_name || "")
      setAdminEmail(data.admin_email || "")
      setSenderEnabled(data.is_enabled)
      setResendApiKey(data.smtp_username || "")
    } catch {}
  }

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const res = await fetch(`${API}/templates`)
      if (!res.ok) return
      const data = await res.json()
      setTemplates(data.map(mapBackendTemplate))
    } catch {
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleSaveMailConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingConfig(true)
    try {
      const res = await fetch(`${API}/sender`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_email: fromEmail,
          from_name: fromName,
          admin_email: adminEmail,
          smtp_username: resendApiKey,
        }),
      })
      if (res.ok) {
        toast.success("Sender configuration updated successfully!")
        fetchSenderConfig()
      } else {
        const err = await res.json()
        toast.error(err.detail || "Failed to save config")
      }
    } catch {
      toast.error("Network error saving config")
    } finally {
      setSavingConfig(false)
    }
  }

  const handleSaveTemplate = async (updated: NotificationTemplate) => {
    try {
      const res = await fetch(`${API}/templates/${updated.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updated.title,
          subject: updated.subject,
          html_body: updated.htmlBody,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const mapped = mapBackendTemplate(data)
        setTemplates(prev => prev.map(t => (t.id === updated.id ? { ...mapped, title: mapped.title || updated.title } : t)))
        setEditingTemplate({ ...mapped, title: mapped.title || updated.title })
        toast.success(`Template '${updated.title}' saved to database!`)
      } else {
        const err = await res.json()
        toast.error(err.detail || "Failed to save template")
      }
    } catch {
      toast.error("Network error saving template")
    }
  }

  const handleSendTestEmail = async (template: NotificationTemplate) => {
    setTestingSmtp(true)
    try {
      const res = await fetch(`${API}/sender/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: adminEmail }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(data.message || `Test email sent to ${adminEmail}!`)
      } else {
        const err = await res.json()
        toast.error(err.detail || "Failed to send test email")
      }
    } catch {
      toast.error("Network error sending test email")
    } finally {
      setTestingSmtp(false)
    }
  }

  const renderPreview = (text: string) => {
    return text
      .replace(/\{\{\s*customer_name\s*\|\s*default\('[^']+'\)\s*\}\}/g, "Muhammad Ali")
      .replace(/\{\{\s*customer_name\s*\}\}/g, "Muhammad Ali")
      .replace(/\{\{\s*order_number\s*\|\s*default\('[^']+'\)\s*\}\}/g, "EL-9482")
      .replace(/\{\{\s*order_number\s*\}\}/g, "EL-9482")
      .replace(/\{\{\s*total_price\s*\|\s*default\('[^']+'\)\s*\}\}/g, "Rs. 4,598")
      .replace(/\{\{\s*total_price\s*\}\}/g, "Rs. 4,598")
      .replace(/\{\{\s*support_email\s*\|\s*default\('[^']+'\)\s*\}\}/g, "support@eligoleather.com")
      .replace(/\{\{\s*support_email\s*\}\}/g, "support@eligoleather.com")
      .replace(/\{\{\s*tracking_company\s*\|\s*default\('[^']+'\)\s*\}\}/g, "TCS Courier")
      .replace(/\{\{\s*tracking_number\s*\|\s*default\('[^']+'\)\s*\}\}/g, "TCS-847291039")
      .replace(/\{\{\s*discount_code\s*\|\s*default\('[^']+'\)\s*\}\}/g, "ELIGO15")
      .replace(/\{\{\s*discount_code\s*\}\}/g, "ELIGO15")
      .replace(/\{\{\s*discount_value\s*\|\s*default\('[^']+'\)\s*\}\}/g, "15% OFF")
      .replace(/\{\{\s*discount_value\s*\}\}/g, "15% OFF")
      .replace(/\{\{\s*store_url\s*\|\s*default\('[^']+'\)\s*\}\}/g, "http://localhost:3000")
      .replace(/\{\{\s*recovery_url\s*\|\s*default\('[^']+'\)\s*\}\}/g, "http://localhost:3000/cart")
      .replace(/\{\{\s*store_name\s*\}\}/g, "Eligo Leather")
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
        <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
              <Sparkle className="w-3.5 h-3.5" />
              <span>Resend API &amp; Jinja2 Workflow Engine</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications &amp; Email Workflow</h1>
            <p className="text-xs text-gray-500 mt-1">
              Configure Resend API keys, order confirmation emails, tracking emails, and discount offer templates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 ${senderEnabled ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
              <CheckCircle className={`w-3.5 h-3.5 ${senderEnabled ? "text-emerald-700" : "text-gray-400"}`} />
              <span>{senderEnabled ? "Email Engine Active" : "Email Engine Disabled"}</span>
            </span>
          </div>
        </div>

        {/* Resend API & Provider Configuration Form */}
        <form onSubmit={handleSaveMailConfig} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-800" />
              <span>Resend API &amp; Sender Configuration</span>
            </span>
            <span className="text-[10px] text-emerald-700 font-mono font-bold">resend.Emails.send() Connected</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Email Provider Engine</label>
              <select
                value={mailProvider}
                onChange={e => setMailProvider(e.target.value as "resend" | "smtp")}
                className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-bold text-amber-900 focus:outline-hidden"
              >
                <option value="resend">Resend API (Recommended)</option>
                <option value="smtp">Custom SMTP Server</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Resend API Key (RESEND_API_KEY)</label>
              <input
                type="password"
                value={resendApiKey}
                onChange={e => setResendApiKey(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-mono text-gray-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">From Sender Email</label>
              <input
                type="email"
                value={fromEmail}
                onChange={e => setFromEmail(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-semibold text-gray-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Sender Name</label>
              <input
                type="text"
                value={fromName}
                onChange={e => setFromName(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-semibold text-gray-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Admin Alert Recipient Email</label>
              <input
                type="email"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-semibold text-gray-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={savingConfig}
              className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer transition-colors"
            >
              {savingConfig ? "Saving..." : "Save Provider Configuration"}
            </button>
          </div>
        </form>

        {/* Jinja Email Template List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              Automated Jinja Email Templates per Purpose
            </h2>
            <button
              onClick={fetchTemplates}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowsClockwise className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {loadingTemplates && (
            <div className="text-xs text-gray-400 py-8 text-center">Loading templates from database...</div>
          )}

          {!loadingTemplates && templates.length === 0 && (
            <div className="text-xs text-gray-400 py-8 text-center">No templates found. Click refresh or restart the backend to seed defaults.</div>
          )}

          {templates.map(item => (
            <div
              key={item.id}
              className="p-4 bg-gray-50 hover:bg-white rounded-xl border border-gray-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900 text-sm">{item.title}</span>
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                    {item.code}
                  </span>
                  {item.is_built_in && (
                    <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                      built-in
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-gray-400 font-mono mt-1 block">Subject: {item.subject}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendTestEmail(item)}
                  disabled={testingSmtp}
                  title="Send Test Email via Resend"
                  className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <PaperPlaneTilt className="w-3.5 h-3.5 text-amber-800" />
                  <span>Send Test</span>
                </button>

                <button
                  onClick={() => {
                    setEditingTemplate(item)
                    setActiveTab("edit")
                  }}
                  className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-lg text-xs shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Edit template</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Jinja Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                  <Sparkle className="w-3.5 h-3.5" />
                  <span>Jinja2 Email Template Editor</span>
                </div>
                <h3 className="text-base font-bold text-gray-900">{editingTemplate.title} ({editingTemplate.code})</h3>
              </div>
              <button onClick={() => setEditingTemplate(null)} className="p-1 text-gray-400 hover:text-black cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`px-4 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === "edit" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-black"
                }`}
              >
                <Code className="w-4 h-4" />
                <span>Jinja Code</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-4 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === "preview" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-black"
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Live Output Preview</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {activeTab === "edit" ? (
                <>
                  <div>
                    <label className="font-bold text-gray-900 block mb-1">Subject Header (supports Jinja syntax):</label>
                    <input
                      type="text"
                      value={editingTemplate.subject}
                      onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                      className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-gray-900">HTML Body Template:</label>
                      <span className="text-[10px] text-amber-800 font-mono">Variables: {"{{ customer_name }}"}, {"{{ order_number }}"}, {"{{ total_price }}"}</span>
                    </div>
                    <textarea
                      rows={12}
                      value={editingTemplate.htmlBody}
                      onChange={e => setEditingTemplate({ ...editingTemplate, htmlBody: e.target.value })}
                      className="w-full p-3 bg-gray-900 text-amber-200 border border-gray-800 rounded-xl text-xs font-mono focus:outline-hidden leading-relaxed"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Rendered Subject</span>
                    <span className="font-bold text-gray-900 text-sm block mt-0.5">{renderPreview(editingTemplate.subject)}</span>
                  </div>
                  <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Live Email HTML Preview</span>
                    <div
                      dangerouslySetInnerHTML={{ __html: renderPreview(editingTemplate.htmlBody) }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold cursor-pointer hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveTemplate(editingTemplate)}
                className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer"
              >
                Save Template Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
