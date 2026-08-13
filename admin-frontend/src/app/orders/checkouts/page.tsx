"use client"

import { useState } from "react"
import { EnvelopeSimple, PaperPlaneTilt, Clock, CheckCircle, WarningCircle, Globe, ShieldCheck } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminAbandonedCheckoutsPage() {
  const [checkouts, setCheckouts] = useState([
    {
      id: 1,
      checkout_reference: "chk_ref_88129401",
      customer_name: "Shahid Mehmood",
      customer_email: "shahid.mehmood@gmail.com",
      customer_phone: "+92 300 8472910",
      region: "Punjab, Pakistan",
      total_price: "Rs. 3,198",
      currency: "PKR",
      recovery_status: "email_sent",
      recovery_attempts: 1,
      recovery_email_sent_at: "Today, 1:20 PM",
      ip_address: "182.185.92.14",
      items: "004 DYNAMO Handmade Leather Wallet x 1, Leather Key Organizer x 1",
      created_at: "Today, 12:45 PM",
    },
    {
      id: 2,
      checkout_reference: "chk_ref_88110492",
      customer_name: "Fatima Zahra",
      customer_email: "fatima.z@yahoo.com",
      customer_phone: "+92 321 7491029",
      region: "Sindh, Pakistan",
      total_price: "Rs. 1,699",
      currency: "PKR",
      recovery_status: "not_sent",
      recovery_attempts: 0,
      recovery_email_sent_at: "Never",
      ip_address: "111.68.102.8",
      items: "ARDOR Leather Card Holder (Orange)",
      created_at: "Yesterday, 09:15 PM",
    },
  ])

  const handleSendRecoveryEmail = (checkoutRef: string, email: string) => {
    setCheckouts(prev =>
      prev.map(c =>
        c.checkout_reference === checkoutRef
          ? {
              ...c,
              recovery_status: "email_sent",
              recovery_attempts: c.recovery_attempts + 1,
              recovery_email_sent_at: "Just now",
            }
          : c
      )
    )
    toast.success(`Jinja recovery email with discount link dispatched via Resend API to ${email}!`)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Abandoned Checkouts"
        icon={<EnvelopeSimple className="w-5 h-5" />}
      />

      {/* Table Container */}
      <div className="eligo-card overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b border-gray-200 flex justify-between items-center text-xs">
          <span className="font-bold text-gray-900">{checkouts.length} Abandoned Carts Tracked</span>
          <span className="font-mono text-gray-400">DB Model: `AbandonedCheckout`</span>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th w-[16%]">Reference ID</th>
                <th className="eligo-th">Customer &amp; Contact Info</th>
                <th className="eligo-th w-[16%]">Region &amp; IP</th>
                <th className="eligo-th w-[18%]">Recovery Status</th>
                <th className="eligo-th w-[12%]">Cart Total</th>
                <th className="eligo-th w-[18%] text-right">Recovery Action</th>
              </tr>
            </thead>
            <tbody>
              {checkouts.map((c) => (
                <tr key={c.id} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td font-bold font-mono text-amber-800">
                    <div className="truncate">{c.checkout_reference}</div>
                    <div className="text-[10px] text-gray-400">{c.created_at}</div>
                  </td>
                  <td className="eligo-td">
                    <div className="font-bold text-gray-900 truncate">{c.customer_name}</div>
                    <div className="text-[11px] font-mono text-gray-500 truncate">{c.customer_email} &bull; {c.customer_phone}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">{c.items}</div>
                  </td>
                  <td className="eligo-td">
                    <div className="font-semibold text-gray-900">{c.region}</div>
                    <div className="text-[10px] font-mono text-gray-400">IP: {c.ip_address}</div>
                  </td>
                  <td className="eligo-td">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        c.recovery_status === "email_sent"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-amber-100 text-amber-900 border border-amber-300"
                      }`}
                    >
                      {c.recovery_status} ({c.recovery_attempts} attempts)
                    </span>
                    <div className="text-[10px] text-gray-400 mt-0.5">Last Sent: {c.recovery_email_sent_at}</div>
                  </td>
                  <td className="eligo-td font-bold text-gray-900">{c.total_price}</td>
                  <td className="eligo-td text-right">
                    <button
                      onClick={() => handleSendRecoveryEmail(c.checkout_reference, c.customer_email)}
                      className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <PaperPlaneTilt className="w-3.5 h-3.5" />
                      <span>Send Recovery Email</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
