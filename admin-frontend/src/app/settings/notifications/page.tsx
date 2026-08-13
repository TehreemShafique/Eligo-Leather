"use client"

import { useState } from "react"
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

interface NotificationTemplate {
  id: string
  code: string
  title: string
  desc: string
  type: string
  subject: string
  htmlBody: string
}

export default function AdminSettingsNotificationsPage() {
  const [mailProvider, setMailProvider] = useState<"resend" | "smtp">("resend")
  const [resendApiKey, setResendApiKey] = useState("re_live_94827103984719283")
  const [fromEmail, setFromEmail] = useState("orders@eligoleather.com")
  const [fromName, setFromName] = useState("Eligo Leather")
  const [adminEmail, setAdminEmail] = useState("admin@eligoleather.com")
  const [savingConfig, setSavingConfig] = useState(false)

  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [testingSmtp, setTestingSmtp] = useState(false)

  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: "tmpl_01",
      code: "order_confirmation",
      title: "Order Confirmation Email",
      desc: "Sent automatically via Resend API to the customer after they place their order.",
      type: "Email (Resend + Jinja2)",
      subject: "Order {{ order_number }} confirmed - {{ store_name }}",
      htmlBody: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <h2 style="color: #854d0e;">Thank you for your order!</h2>
  <p>Hi {{ customer_name | default('Valued Customer') }},</p>
  <p>We've received your order <strong>#{{ order_number | default('EL-9482') }}</strong> and are currently processing it.</p>
  <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p style="margin: 0; font-weight: bold; font-size: 14px;">Order Summary</p>
    <p style="margin: 4px 0; color: #4b5563;">Items Total: {{ total_price | default('Rs. 4,598') }}</p>
    <p style="margin: 4px 0; color: #4b5563;">Payment: Cash on Delivery / Card</p>
  </div>
  <p>If you have any questions, reply directly to this email or contact support at {{ support_email | default('support@eligoleather.com') }}.</p>
  <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">{{ store_name }} &bull; Premium Handcrafted Leather</p>
</div>`,
    },
    {
      id: "tmpl_02",
      code: "order_shipped",
      title: "Shipping & Tracking Email",
      desc: "Sent when an order is fulfilled and courier tracking number is generated.",
      type: "Email & SMS (Resend + Jinja2)",
      subject: "Your order {{ order_number }} is on the way!",
      htmlBody: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <h2 style="color: #047857;">Great news! Your parcel is shipped</h2>
  <p>Hi {{ customer_name | default('Valued Customer') }},</p>
  <p>Order <strong>#{{ order_number | default('EL-9482') }}</strong> has been dispatched via {{ tracking_company | default('TCS Courier') }}.</p>
  <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #a7f3d0;">
    <p style="margin: 0; font-weight: bold; color: #065f46;">Tracking Number:</p>
    <p style="margin: 4px 0; font-family: monospace; font-size: 16px; font-weight: bold; color: #047857;">{{ tracking_number | default('TCS-847291039') }}</p>
  </div>
  <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">Thank you for choosing {{ store_name }}.</p>
</div>`,
    },
    {
      id: "tmpl_03",
      code: "discount_offer",
      title: "Active Discount & Promotional Offer Email",
      desc: "Sent when a promotional discount code is active or assigned to a customer.",
      type: "Email (Resend + Jinja2)",
      subject: "Exclusive {{ discount_code }} offer on {{ store_name }}",
      htmlBody: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <h2 style="color: #854d0e;">Special Offer Just For You!</h2>
  <p>Hi {{ customer_name | default('Valued Customer') }},</p>
  <p>Use code <strong>{{ discount_code | default('ELIGO15') }}</strong> to get {{ discount_value | default('15% OFF') }} your next order of handcrafted leather goods.</p>
  <div style="margin: 20px 0;">
    <a href="{{ store_url | default('http://localhost:3000') }}" style="background: #854d0e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Claim Discount &rarr;</a>
  </div>
  <p style="color: #6b7280; font-size: 12px;">Valid on all genuine leather wallets, belts, and accessories.</p>
</div>`,
    },
    {
      id: "tmpl_04",
      code: "abandoned_checkout",
      title: "Abandoned Checkout Recovery Email",
      desc: "Sent automatically to customers who left items in their cart without completing checkout.",
      type: "Email (Resend + Jinja2)",
      subject: "You left something special behind - {{ store_name }}",
      htmlBody: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <h2 style="color: #854d0e;">Complete your order now</h2>
  <p>Hi {{ customer_name | default('Valued Customer') }},</p>
  <p>You left your handcrafted leather items worth <strong>{{ total_price | default('Rs. 2,899') }}</strong> in your shopping cart.</p>
  <div style="margin: 20px 0;">
    <a href="{{ recovery_url | default('http://localhost:3000/cart') }}" style="background: #854d0e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Return to Cart &rarr;</a>
  </div>
  <p style="color: #6b7280; font-size: 12px;">Limited stock available!</p>
</div>`,
    },
    {
      id: "tmpl_05",
      code: "admin_notification",
      title: "Staff Order & System Alert",
      desc: "Sent to admin team when a new high-value order is received or low inventory alert triggers.",
      type: "Email (Resend + Jinja2)",
      subject: "[Staff Alert] New Order {{ order_number }} Received",
      htmlBody: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <h3 style="color: #111827;">New Order Notification</h3>
  <p>A new order <strong>#{{ order_number | default('EL-9482') }}</strong> was placed on {{ store_name }}.</p>
  <p>Customer: {{ customer_name | default('Muhammad Ali') }} ({{ customer_email | default('ali.m@example.com') }})</p>
  <p>Order Total: <strong>{{ total_price | default('Rs. 4,598') }}</strong></p>
</div>`,
    },
  ])

  const handleSaveMailConfig = (e: React.FormEvent) => {
    e.preventDefault()
    setSavingConfig(true)
    setTimeout(() => {
      setSavingConfig(false)
      toast.success("Resend API & Email Provider settings updated successfully!")
    }, 600)
  }

  const handleSaveTemplate = (updated: NotificationTemplate) => {
    setTemplates(prev => prev.map(t => (t.id === updated.id ? updated : t)))
    setEditingTemplate(updated)
    toast.success(`Jinja2 template '${updated.title}' updated! Live output preview refreshed.`)
  }

  const handleSendTestEmail = (template: NotificationTemplate) => {
    setTestingSmtp(true)
    setTimeout(() => {
      setTestingSmtp(false)
      toast.success(`Test email for '${template.title}' dispatched via Resend API to ${adminEmail}!`)
    }, 900)
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
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>Resend API Active</span>
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
              <label className="block font-semibold text-gray-700 mb-1">Resend API Key (`RESEND_API_KEY`)</label>
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
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
            Automated Jinja Email Templates per Purpose
          </h2>

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
                </div>
                <span className="text-gray-500 block text-xs">{item.desc}</span>
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
