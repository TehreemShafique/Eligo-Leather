"use client"

import { apiFetch } from "@/lib/api"

import { useState, useEffect, useCallback, useRef } from "react"
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
  Tag,
  Truck,
  Package,
  Clock,
  Warning,
  UserCircle,
  MagnifyingGlass,
  ListChecks,
  Paperclip,
  ArrowRight,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { useFormDirty } from "@/components/unsaved-changes"

const API = "/api/v1/settings/notifications"

const NOTIFICATION_TYPES: { key: string; label: string; desc: string; category: "transactional" | "promotional" | "internal" }[] = [
  { key: "order_confirmation", label: "Order Confirmation", desc: "Sent when a customer successfully places an order", category: "transactional" },
  { key: "order_placed", label: "Order Placed", desc: "Sent when a customer successfully places an order", category: "transactional" },
  { key: "order_shipped", label: "Order Shipped", desc: "Sent when an order is fulfilled and shipped", category: "transactional" },
  { key: "order_delivered", label: "Order Delivered", desc: "Sent when the shipment is confirmed delivered", category: "transactional" },
  { key: "order_cancelled", label: "Order Cancelled", desc: "Sent when an order is cancelled", category: "transactional" },
  { key: "abandoned_checkout", label: "Abandoned Checkout", desc: "Sent when a checkout is abandoned before completion", category: "transactional" },
  { key: "discount_offer", label: "Special Discount & Offer", desc: "Promotional email with discount codes", category: "promotional" },
  { key: "admin_notification", label: "Admin / Staff Alert", desc: "Internal notification to admin/staff", category: "internal" },
  { key: "return_requested", label: "Return Requested", desc: "Sent when a customer requests a return", category: "transactional" },
  { key: "password_reset", label: "Password Reset", desc: "Account password reset notification", category: "transactional" },
  { key: "low_stock", label: "Low Stock Alert", desc: "Internal alert when inventory is low", category: "internal" },
]

interface NotificationSetting {
  id: number
  notification_type: string
  enabled: boolean
  updated_at: string
}

interface NotificationTemplate {
  id: number
  code: string
  name: string
  subject: string
  html_body: string
  is_active: boolean
  is_built_in: boolean
}

interface NotificationLogEntry {
  id: number
  event_type: string
  channel: string
  recipient: string | null
  subject: string | null
  status: string
  error: string | null
  template_code: string | null
  provider: string | null
  customer_id: number | null
  order_id: number | null
  created_at: string
}

interface SenderConfig {
  id: number
  smtp_host: string
  smtp_port: number
  smtp_username: string
  has_password: boolean
  use_tls: boolean
  use_ssl: boolean
  from_email: string
  from_name: string
  admin_email: string
  is_enabled: boolean
  updated_at: string
}

interface CustomerSearchResult {
  id: number
  name: string
  email: string | null
  phone: string | null
}

export default function AdminSettingsNotificationsPage() {
  const [activeSection, setActiveSection] = useState<"auto" | "sender" | "templates" | "manual" | "test" | "history">("auto")

  // Auto notifications settings
  const [settings, setSettings] = useState<NotificationSetting[]>([])
  const [loadingSettings, setLoadingSettings] = useState(true)

  // Sender config
  const [senderConfig, setSenderConfig] = useState<SenderConfig | null>(null)
  const [savingConfig, setSavingConfig] = useState(false)
  const [testingConfig, setTestingConfig] = useState(false)
  const [smtpUsername, setSmtpUsername] = useState("")
  const [smtpPassword, setSmtpPassword] = useState("")
  const [fromEmail, setFromEmail] = useState("")
  const [fromName, setFromName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")

  // Templates
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")

  // Manual email
  const [manualCustomerSearch, setManualCustomerSearch] = useState("")
  const [manualCustomerResults, setManualCustomerResults] = useState<CustomerSearchResult[]>([])
  const [manualSelectedCustomer, setManualSelectedCustomer] = useState<CustomerSearchResult | null>(null)
  const [manualTemplate, setManualTemplate] = useState("")
  const [manualSubject, setManualSubject] = useState("")
  const [manualContext, setManualContext] = useState("{}")
  const [manualRecipientEmail, setManualRecipientEmail] = useState("")
  const [sendingManual, setSendingManual] = useState(false)
  const customerSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Test email
  const [testRecipient, setTestRecipient] = useState("")
  const [testTemplate, setTestTemplate] = useState("")
  const [testContext, setTestContext] = useState("{}")
  const [sendingTest, setSendingTest] = useState(false)

  // Email history
  const [logs, setLogs] = useState<NotificationLogEntry[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [logPage, setLogPage] = useState(0)

  const [dataLoaded, setDataLoaded] = useState(false)

  const { reset } = useFormDirty(
    {
      smtpUsername,
      smtpPassword,
      fromEmail,
      fromName,
      adminEmail,
      manualTemplate,
      manualSubject,
      manualContext,
      manualRecipientEmail,
      testRecipient,
      testTemplate,
      testContext,
    },
    dataLoaded
  )

  useEffect(() => {
    fetchSettings()
    fetchSenderConfig()
    fetchTemplates()
    fetchLogs()
    setDataLoaded(true)
  }, [])

  // ==================== DATA FETCHING ====================

  const fetchSettings = async () => {
    setLoadingSettings(true)
    try {
      const data = await apiFetch<NotificationSetting[]>(API + "/settings")
      setSettings(data)
    } catch {
      toast.error("Failed to load notification settings")
    } finally {
      setLoadingSettings(false)
    }
  }

  const fetchSenderConfig = async () => {
    try {
      const data = await apiFetch<SenderConfig>(API + "/sender")
      setSenderConfig(data)
      setFromEmail(data.from_email || "")
      setFromName(data.from_name || "")
      setAdminEmail(data.admin_email || "")
      setSmtpUsername(data.smtp_username || "")
      setSmtpPassword("")
    } catch {}
  }

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const data = await apiFetch<NotificationTemplate[]>(API + "/templates")
      setTemplates(data)
    } catch {
    } finally {
      setLoadingTemplates(false)
    }
  }

  const fetchLogs = async (skip = 0) => {
    setLoadingLogs(true)
    try {
      const data = await apiFetch<NotificationLogEntry[]>(API + `/logs?skip=${skip}&limit=50`)
      setLogs(data)
    } catch {
    } finally {
      setLoadingLogs(false)
    }
  }

  const searchCustomers = useCallback(async (query: string) => {
    if (customerSearchTimeout.current) clearTimeout(customerSearchTimeout.current)
    if (!query || query.length < 2) {
      setManualCustomerResults([])
      return
    }
    customerSearchTimeout.current = setTimeout(async () => {
      try {
        const data = await apiFetch<CustomerSearchResult[]>(API + `/customers/search?q=${encodeURIComponent(query)}`)
        setManualCustomerResults(data)
      } catch {}
    }, 300)
  }, [])

  // ==================== HANDLERS ====================

  const handleToggleSetting = async (notificationType: string, enabled: boolean) => {
    try {
      await apiFetch(API + `/settings/${notificationType}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      })
      setSettings(prev =>
        prev.map(s => s.notification_type === notificationType ? { ...s, enabled } : s)
      )
      toast.success(`${NOTIFICATION_TYPES.find(t => t.key === notificationType)?.label || notificationType} ${enabled ? "enabled" : "disabled"}`)
    } catch {
      toast.error("Failed to update setting")
    }
  }

  const handleSaveSenderConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingConfig(true)
    try {
      const payload: Record<string, string> = {
        from_email: fromEmail,
        from_name: fromName,
        admin_email: adminEmail,
        smtp_username: smtpUsername,
      }
      // Only include the app password when the user typed one, so a
      // name/email-only save never clears the stored password. Changing the
      // Gmail address requires entering that account's new app password.
      if (smtpPassword) {
        payload.smtp_password = smtpPassword
      }
      await apiFetch(API + "/sender", {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
      toast.success("Sender configuration updated!")
      setSmtpPassword("")
      fetchSenderConfig()
      reset()
    } catch {
      toast.error("Failed to save sender config")
    } finally {
      setSavingConfig(false)
    }
  }

  const handleTestSender = async () => {
    const to = adminEmail || fromEmail
    if (!to) {
      toast.error("Enter an admin / recipient email first")
      return
    }
    setTestingConfig(true)
    try {
      const result = await apiFetch<{ success: boolean; message: string }>(API + "/sender/test", {
        method: "POST",
        body: JSON.stringify({ to }),
      })
      if (result?.success) {
        toast.success(result.message || `Test email sent to ${to}`)
      } else {
        toast.error(result?.message || "Test email failed to send")
      }
    } catch {
      toast.error("Failed to send test email")
    } finally {
      setTestingConfig(false)
    }
  }

  const handleSaveTemplate = async (updated: NotificationTemplate) => {
    try {
      const data = await apiFetch<NotificationTemplate>(API + `/templates/${updated.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: updated.name,
          subject: updated.subject,
          html_body: updated.html_body,
        }),
      })
      setTemplates(prev => prev.map(t => t.id === updated.id ? { ...data, is_built_in: t.is_built_in } : t))
      setEditingTemplate({ ...data, is_built_in: updated.is_built_in })
      toast.success(`Template '${updated.name}' saved!`)
      reset()
    } catch {
      toast.error("Failed to save template")
    }
  }

  const handleSendManual = async () => {
    const recipient = manualSelectedCustomer?.email || manualRecipientEmail
    if (!recipient) {
      toast.error("Select a customer or enter an email address")
      return
    }
    if (!manualTemplate) {
      toast.error("Select a template")
      return
    }

    setSendingManual(true)
    try {
      let context = {}
      try {
        context = JSON.parse(manualContext)
      } catch {
        toast.error("Invalid JSON in template variables")
        setSendingManual(false)
        return
      }

      const body: any = {
        template_code: manualTemplate,
        recipient_email: recipient,
        context,
      }
      if (manualSelectedCustomer) body.customer_id = manualSelectedCustomer.id
      if (manualSubject) body.subject = manualSubject

      const result = await apiFetch<{ success: boolean; message: string; recipient: string | null }>(API + "/send", {
        method: "POST",
        body: JSON.stringify(body),
      })

      if (result.success) {
        toast.success(result.message)
        fetchLogs()
        reset()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error("Failed to send email")
    } finally {
      setSendingManual(false)
    }
  }

  const handleSendTest = async () => {
    if (!testRecipient) {
      toast.error("Enter a recipient email")
      return
    }
    if (!testTemplate) {
      toast.error("Select a template")
      return
    }

    setSendingTest(true)
    try {
      let context = {}
      try {
        context = JSON.parse(testContext)
      } catch {
        toast.error("Invalid JSON in template variables")
        setSendingTest(false)
        return
      }

      const result = await apiFetch<{ success: boolean; message: string; recipient: string }>(API + "/test", {
        method: "POST",
        body: JSON.stringify({
          to: testRecipient,
          template_code: testTemplate,
          context,
        }),
      })

      if (result.success) {
        toast.success(result.message)
        reset()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error("Failed to send test email")
    } finally {
      setSendingTest(false)
    }
  }

  // ==================== HELPERS ====================

  const isSettingEnabled = (type: string) => {
    const s = settings.find(s => s.notification_type === type)
    return s ? s.enabled : true
  }

  const getTemplateSubjectPreview = (subject: string) => {
    return subject
      .replace(/\{\{\s*customer_name\s*\}\}/g, "Muhammad Ali")
      .replace(/\{\{\s*order_number\s*\}\}/g, "EL-9482")
      .replace(/\{\{\s*store_name\s*\}\}/g, "Eligo Leather")
      .replace(/\{\{\s*discount_code\s*\}\}/g, "ELIGO15")
      .replace(/\{\{\s*alert_title\s*\}\}/g, "Low Stock")
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
      .replace(/\{\{\s*tracking_company\s*\|\s*default\('[^']+'\)\s*\}\}/g, "Leopards Courier")
      .replace(/\{\{\s*tracking_number\s*\|\s*default\('[^']+'\)\s*\}\}/g, "TCS-847291039")
      .replace(/\{\{\s*discount_code\s*\|\s*default\('[^']+'\)\s*\}\}/g, "ELIGO15")
      .replace(/\{\{\s*discount_code\s*\}\}/g, "ELIGO15")
      .replace(/\{\{\s*discount_value\s*\|\s*default\('[^']+'\)\s*\}\}/g, "15% OFF")
      .replace(/\{\{\s*discount_value\s*\}\}/g, "15% OFF")
      .replace(/\{\{\s*store_url\s*\|\s*default\('[^']+'\)\s*\}\}/g, "http://localhost:3000")
      .replace(/\{\{\s*recovery_url\s*\|\s*default\('[^']+'\)\s*\}\}/g, "http://localhost:3000/cart")
      .replace(/\{\{\s*store_name\s*\}\}/g, "Eligo Leather")
      .replace(/\{\{\s*alert_title\s*\|\s*default\('[^']+'\)\s*\}\}/g, "Low Stock Alert")
      .replace(/\{\{\s*alert_title\s*\}\}/g, "Low Stock Alert")
      .replace(/\{\{\s*message\s*\}\}/g, "This product is running low on stock.")
      .replace(/\{\{\s*event_type\s*\}\}/g, "low_stock")
      .replace(/\{\{\s*admin_name\s*\|\s*default\('[^']+'\)\s*\}\}/g, "Store Admin")
      .replace(/\{%\s*for\s+item\s+in\s+items\s*%\}[\s\S]*?\{%\s*endfor\s*%}/g, '<tr><td>Classic Leather Wallet</td><td>1</td><td>Rs. 2,499</td></tr><tr><td>Leather Belt</td><td>1</td><td>Rs. 2,099</td></tr>')
  }

  const SECTION_TABS = [
    { key: "auto" as const, label: "Automatic Emails", icon: Bell },
    { key: "sender" as const, label: "Sender Config", icon: Gear },
    { key: "templates" as const, label: "Templates", icon: Code },
    { key: "manual" as const, label: "Manual Email", icon: PaperPlaneTilt },
    { key: "test" as const, label: "Test Email", icon: Envelope },
    { key: "history" as const, label: "Email History", icon: Clock },
  ]

  const transactionalTypes = NOTIFICATION_TYPES.filter(t => t.category === "transactional")
  const promotionalTypes = NOTIFICATION_TYPES.filter(t => t.category === "promotional")
  const internalTypes = NOTIFICATION_TYPES.filter(t => t.category === "internal")

  // ==================== RENDER ====================

  return (
    <div className="space-y-6 font-sans max-w-5xl">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
          <Sparkle className="w-3.5 h-3.5" />
          <span>Email Notification Engine</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage automatic emails, send manual notifications, and track delivery history.
        </p>

        {/* Section Tabs */}
        <div className="flex gap-1 mt-4 bg-gray-100 p-1 rounded-xl overflow-x-auto">
          {SECTION_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeSection === tab.key
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ==================== AUTOMATIC EMAILS ==================== */}
      {activeSection === "auto" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Automatic Email Notifications</h2>
              <p className="text-xs text-gray-500 mt-0.5">Toggle which notification types are sent automatically by the system.</p>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs text-emerald-700 font-semibold">{settings.filter(s => s.enabled).length} active</span>
            </div>
          </div>

          {loadingSettings ? (
            <div className="text-xs text-gray-400 py-8 text-center">Loading settings...</div>
          ) : (
            <>
              {/* Transactional */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Transactional</h3>
                <div className="space-y-2">
                  {transactionalTypes.map(t => (
                    <NotificationToggle
                      key={t.key}
                      type={t.key}
                      label={t.label}
                      desc={t.desc}
                      enabled={isSettingEnabled(t.key)}
                      onToggle={(enabled) => handleToggleSetting(t.key, enabled)}
                    />
                  ))}
                </div>
              </div>

              {/* Promotional */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Promotional</h3>
                <div className="space-y-2">
                  {promotionalTypes.map(t => (
                    <NotificationToggle
                      key={t.key}
                      type={t.key}
                      label={t.label}
                      desc={t.desc}
                      enabled={isSettingEnabled(t.key)}
                      onToggle={(enabled) => handleToggleSetting(t.key, enabled)}
                    />
                  ))}
                </div>
              </div>

              {/* Internal */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Internal / Admin</h3>
                <div className="space-y-2">
                  {internalTypes.map(t => (
                    <NotificationToggle
                      key={t.key}
                      type={t.key}
                      label={t.label}
                      desc={t.desc}
                      enabled={isSettingEnabled(t.key)}
                      onToggle={(enabled) => handleToggleSetting(t.key, enabled)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================== SENDER CONFIG ==================== */}
      {activeSection === "sender" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-800" />
              Email Sender Configuration
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Emails are sent through Gmail SMTP using a Gmail App Password. All addresses can be
              changed later - when you change the Gmail address, enter that account's app password too.
            </p>
          </div>

          <form onSubmit={handleSaveSenderConfig} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Gmail SMTP Address (sender login)</label>
                <input
                  type="text"
                  value={smtpUsername}
                  onChange={e => setSmtpUsername(e.target.value)}
                  placeholder="e.g. eligoleather9@gmail.com"
                  className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-mono text-gray-900 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Gmail App Password</label>
                <input
                  type="password"
                  value={smtpPassword}
                  onChange={e => setSmtpPassword(e.target.value)}
                  placeholder={senderConfig?.has_password ? "Leave blank to keep current password" : "Enter your Gmail App Password"}
                  className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-mono text-gray-900 focus:outline-hidden"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  {senderConfig?.has_password ? "A password is stored. Enter a new one only to replace it." : "No password stored yet - email sending needs it."}
                  Create one at myaccount.google.com → Security → 2-Step Verification → App passwords.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">From Sender Email</label>
                <input
                  type="email"
                  value={fromEmail}
                  onChange={e => setFromEmail(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-semibold text-gray-900 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Sender Name</label>
                <input
                  type="text"
                  value={fromName}
                  onChange={e => setFromName(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-semibold text-gray-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Admin Alert Recipient Email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-semibold text-gray-900 focus:outline-hidden"
                />
              </div>
              <div className="flex items-end pb-2">
                <span className="text-[11px] text-gray-400">
                  Server: {senderConfig?.smtp_host || "smtp.gmail.com"}:{senderConfig?.smtp_port || 587} (TLS)
                </span>
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestSender}
                disabled={testingConfig}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-bold text-xs rounded-xl shadow-2xs cursor-pointer transition-colors disabled:opacity-50"
              >
                {testingConfig ? "Sending..." : "Send Test Email"}
              </button>
              <button
                type="submit"
                disabled={savingConfig}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer transition-colors disabled:opacity-50"
              >
                {savingConfig ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== EMAIL TEMPLATES ==================== */}
      {activeSection === "templates" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Email Templates</h2>
              <p className="text-xs text-gray-500 mt-0.5">Jinja2 HTML templates used for automated and manual emails.</p>
            </div>
            <button
              onClick={fetchTemplates}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowsClockwise className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {loadingTemplates ? (
            <div className="text-xs text-gray-400 py-8 text-center">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-xs text-gray-400 py-8 text-center">No templates found.</div>
          ) : (
            <div className="space-y-2">
              {templates.map(item => (
                <div
                  key={item.id}
                  className="p-4 bg-gray-50 hover:bg-white rounded-xl border border-gray-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm">{item.name}</span>
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                        {item.code}
                      </span>
                      {item.is_built_in && (
                        <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                          built-in
                        </span>
                      )}
                      {!item.is_active && (
                        <span className="text-[10px] font-mono font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200">
                          inactive
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono truncate block">
                      Subject: {getTemplateSubjectPreview(item.subject)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setEditingTemplate(item)
                      setActiveTab("edit")
                    }}
                    className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-lg text-xs shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Edit template</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== MANUAL EMAIL ==================== */}
      {activeSection === "manual" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <PaperPlaneTilt className="w-4 h-4 text-amber-800" />
              Send Manual Email
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Send an email to a specific customer using a template.</p>
          </div>

          {/* Customer Search */}
          <div className="text-xs space-y-1">
            <label className="font-semibold text-gray-700">Recipient (search customer or enter email)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={manualCustomerSearch}
                  onChange={e => {
                    setManualCustomerSearch(e.target.value)
                    searchCustomers(e.target.value)
                  }}
                  className="w-full h-9 pl-9 pr-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-hidden"
                />
                {manualCustomerResults.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {manualCustomerResults.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setManualSelectedCustomer(c)
                          setManualCustomerSearch(c.name)
                          setManualCustomerResults([])
                          setManualRecipientEmail("")
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-xs"
                      >
                        <UserCircle className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="font-semibold text-gray-900">{c.name}</span>
                          {c.email && <span className="text-gray-400 ml-2">{c.email}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-gray-400 self-center text-xs">or</span>
              <input
                type="email"
                placeholder="Enter email address"
                value={manualRecipientEmail}
                onChange={e => {
                  setManualRecipientEmail(e.target.value)
                  setManualSelectedCustomer(null)
                  setManualCustomerSearch("")
                }}
                className="flex-1 h-9 px-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-hidden"
              />
            </div>
            {manualSelectedCustomer && (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">
                  Selected: {manualSelectedCustomer.name} ({manualSelectedCustomer.email})
                </span>
                <button onClick={() => { setManualSelectedCustomer(null); setManualCustomerSearch("") }} className="ml-auto cursor-pointer">
                  <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-900" />
                </button>
              </div>
            )}
          </div>

          {/* Template Selection */}
          <div className="text-xs space-y-1">
            <label className="font-semibold text-gray-700">Template</label>
            <select
              value={manualTemplate}
              onChange={e => setManualTemplate(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-semibold text-gray-900 focus:outline-hidden"
            >
              <option value="">Select a template...</option>
              {templates.filter(t => t.is_active).map(t => (
                <option key={t.code} value={t.code}>{t.name} ({t.code})</option>
              ))}
            </select>
          </div>

          {/* Subject override */}
          <div className="text-xs space-y-1">
            <label className="font-semibold text-gray-700">Subject (leave empty to use template default)</label>
            <input
              type="text"
              value={manualSubject}
              onChange={e => setManualSubject(e.target.value)}
              placeholder="Optional subject override..."
              className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-hidden"
            />
          </div>

          {/* Template Variables */}
          <div className="text-xs space-y-1">
            <label className="font-semibold text-gray-700">Template Variables (JSON)</label>
            <textarea
              rows={3}
              value={manualContext}
              onChange={e => setManualContext(e.target.value)}
              placeholder='{"discount_code": "ELIGO20", "discount_value": "20% OFF"}'
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl font-mono text-xs text-gray-900 focus:outline-hidden"
            />
            <p className="text-[10px] text-gray-400">Context variables passed to the Jinja2 template. Customer name is auto-injected.</p>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleSendManual}
              disabled={sendingManual}
              className="px-5 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {sendingManual ? (
                <>Sending...</>
              ) : (
                <>
                  <PaperPlaneTilt className="w-3.5 h-3.5" />
                  Send Email
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ==================== TEST EMAIL ==================== */}
      {activeSection === "test" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Envelope className="w-4 h-4 text-amber-800" />
              Send Test Email
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Send a test email with mock data to verify template rendering and delivery.</p>
          </div>

          <div className="text-xs space-y-1">
            <label className="font-semibold text-gray-700">Test Recipient Email</label>
            <input
              type="email"
              value={testRecipient}
              onChange={e => setTestRecipient(e.target.value)}
              placeholder="admin@example.com"
              className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-semibold text-gray-900 focus:outline-hidden"
            />
          </div>

          <div className="text-xs space-y-1">
            <label className="font-semibold text-gray-700">Template</label>
            <select
              value={testTemplate}
              onChange={e => setTestTemplate(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-semibold text-gray-900 focus:outline-hidden"
            >
              <option value="">Select a template...</option>
              {templates.filter(t => t.is_active).map(t => (
                <option key={t.code} value={t.code}>{t.name} ({t.code})</option>
              ))}
            </select>
          </div>

          <div className="text-xs space-y-1">
            <label className="font-semibold text-gray-700">Additional Template Variables (JSON)</label>
            <textarea
              rows={2}
              value={testContext}
              onChange={e => setTestContext(e.target.value)}
              placeholder='{"discount_code": "TEST10"}'
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl font-mono text-xs text-gray-900 focus:outline-hidden"
            />
            <p className="text-[10px] text-gray-400">Default mock data is pre-filled. Only add overrides here.</p>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleSendTest}
              disabled={sendingTest}
              className="px-5 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {sendingTest ? (
                <>Sending...</>
              ) : (
                <>
                  <Envelope className="w-3.5 h-3.5" />
                  Send Test Email
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ==================== EMAIL HISTORY ==================== */}
      {activeSection === "history" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-800" />
                Email History
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Log of all sent and failed email notifications.</p>
            </div>
            <button
              onClick={() => { setLogPage(0); fetchLogs(0) }}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowsClockwise className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {loadingLogs ? (
            <div className="text-xs text-gray-400 py-8 text-center">Loading history...</div>
          ) : logs.length === 0 ? (
            <div className="text-xs text-gray-400 py-8 text-center">No emails sent yet.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-semibold text-gray-600">Event</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600">Template</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600">Recipient</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600">Status</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600">Provider</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3">
                          <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                            {log.event_type}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-600 font-mono">{log.template_code || "—"}</td>
                        <td className="py-2 px-3 text-gray-600 truncate max-w-[200px]">{log.recipient || "—"}</td>
                        <td className="py-2 px-3">
                          {log.status === "success" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                              <CheckCircle className="w-3 h-3" /> Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 font-semibold" title={log.error || ""}>
                              <Warning className="w-3 h-3" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-gray-500 font-mono">{log.provider || "—"}</td>
                        <td className="py-2 px-3 text-gray-500">
                          {new Date(log.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => { const newPage = Math.max(0, logPage - 50); setLogPage(newPage); fetchLogs(newPage) }}
                  disabled={logPage === 0}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 disabled:opacity-30 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-400">Showing {logs.length} entries</span>
                <button
                  onClick={() => { const newPage = logPage + 50; setLogPage(newPage); fetchLogs(newPage) }}
                  disabled={logs.length < 50}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 disabled:opacity-30 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================== EDIT TEMPLATE MODAL ==================== */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                  <Sparkle className="w-3.5 h-3.5" />
                  <span>Jinja2 Email Template Editor</span>
                </div>
                <h3 className="text-base font-bold text-gray-900">{editingTemplate.name} ({editingTemplate.code})</h3>
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
                className={`px-4 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === "edit" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-black"
                }`}
              >
                <Code className="w-4 h-4" />
                <span>Jinja Code</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-4 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
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
                    <label className="font-bold text-gray-900 block mb-1">Subject (Jinja2 supported):</label>
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
                      <span className="text-[10px] text-amber-800 font-mono">
                        Vars: {"{{ customer_name }}"}, {"{{ order_number }}"}, {"{{ total_price }}"}
                      </span>
                    </div>
                    <textarea
                      rows={14}
                      value={editingTemplate.html_body}
                      onChange={e => setEditingTemplate({ ...editingTemplate, html_body: e.target.value })}
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
                    <div dangerouslySetInnerHTML={{ __html: renderPreview(editingTemplate.html_body) }} />
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

// ==================== NOTIFICATION TOGGLE COMPONENT ====================

function NotificationToggle({
  type,
  label,
  desc,
  enabled,
  onToggle,
}: {
  type: string
  label: string
  desc: string
  enabled: boolean
  onToggle: (enabled: boolean) => void
}) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
      enabled ? "bg-gray-50 border-gray-200" : "bg-white border-gray-200 opacity-60"
    }`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 text-xs">{label}</span>
          <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
            {type}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ml-4 ${
          enabled ? "bg-emerald-500" : "bg-gray-300"
        }`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-2xs transition-transform ${
          enabled ? "left-[18px]" : "left-0.5"
        }`} />
      </button>
    </div>
  )
}
