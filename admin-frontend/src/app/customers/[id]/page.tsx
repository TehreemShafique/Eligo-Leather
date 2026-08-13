"use client"

import { useState, use } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  User,
  EnvelopeSimple,
  Phone,
  MapPin,
  Building,
  CheckCircle,
  XCircle,
  DeviceMobile,
  WhatsappLogo,
  ShoppingBagOpen,
  PencilSimple,
  Trash,
  ShieldCheck,
  Translate,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { MOCK_CUSTOMERS } from "@/modules/customers/api"
import type { Customer } from "@/modules/customers/types"

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>
}

export default function AdminCustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = use(params)
  const customer: Customer = MOCK_CUSTOMERS.find((c) => c.id.toString() === id) || MOCK_CUSTOMERS[0]

  const [emailSub, setEmailSub] = useState(customer.email_subscription)
  const [smsSub, setSmsSub] = useState(customer.sms_subscription)
  const [whatsappSub, setWhatsappSub] = useState(customer.whatsapp_subscription)

  const handleUpdateSubscription = () => {
    toast.success("Customer subscription settings updated!")
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {customer.first_name} {customer.last_name}
              </h1>
              {customer.tax_exempt && (
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Tax Exempt
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Customer since {customer.customer_added_date} &bull; Location: <strong className="text-gray-800">{customer.location}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.info("Opening Edit Customer Drawer...")}
            className="px-3.5 py-2 bg-white border border-gray-300 text-gray-800 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <PencilSimple className="w-4 h-4 text-gray-500" />
            <span>Edit Profile</span>
          </button>
          {customer.deletable && (
            <button
              onClick={() => toast.error("Delete customer functionality confirmed.")}
              className="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl hover:bg-rose-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Trash className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Grid (8 cols left, 4 cols right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Customer Orders History Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBagOpen className="w-5 h-5 text-amber-800" />
                <h2 className="text-base font-bold text-gray-900">
                  Orders History ({customer.total_orders})
                </h2>
              </div>
              <span className="text-xs font-bold text-gray-900">
                Total Spent: Rs. {customer.amount_spent.toLocaleString()}
              </span>
            </div>

            <div className="divide-y divide-gray-100 text-xs">
              <div className="p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                <div>
                  <Link href="/orders/1022" className="font-bold text-amber-800 hover:underline">#1022</Link>
                  <span className="text-gray-500 ml-2">&bull; Feb 8, 2026</span>
                  <p className="text-[11px] text-gray-600 mt-0.5">ARDOR Handmade Leather Wallet x 1</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">Rs. 1,699</div>
                  <span className="inline-block text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">Paid</span>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                <div>
                  <Link href="/orders/1008" className="font-bold text-amber-800 hover:underline">#1008</Link>
                  <span className="text-gray-500 ml-2">&bull; Jan 24, 2026</span>
                  <p className="text-[11px] text-gray-600 mt-0.5">SOVEREIGN Classic Leather Belt x 2</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">Rs. 4,998</div>
                  <span className="inline-block text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">Paid</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscriptions & Marketing Channels */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-3">
              Marketing Subscriptions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Email */}
              <div className="p-4 rounded-xl border border-gray-200 flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-2">
                  <EnvelopeSimple className="w-5 h-5 text-amber-800" />
                  <span className="font-bold text-gray-900">Email Marketing</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={emailSub ? "text-emerald-700 font-semibold" : "text-gray-400"}>
                    {emailSub ? "Subscribed" : "Unsubscribed"}
                  </span>
                  <button
                    onClick={() => {
                      setEmailSub(!emailSub)
                      handleUpdateSubscription()
                    }}
                    className="text-[11px] font-bold text-amber-800 hover:underline"
                  >
                    Toggle
                  </button>
                </div>
              </div>

              {/* SMS */}
              <div className="p-4 rounded-xl border border-gray-200 flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-2">
                  <DeviceMobile className="w-5 h-5 text-blue-700" />
                  <span className="font-bold text-gray-900">SMS Marketing</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={smsSub ? "text-blue-700 font-semibold" : "text-gray-400"}>
                    {smsSub ? "Subscribed" : "Unsubscribed"}
                  </span>
                  <button
                    onClick={() => {
                      setSmsSub(!smsSub)
                      handleUpdateSubscription()
                    }}
                    className="text-[11px] font-bold text-amber-800 hover:underline"
                  >
                    Toggle
                  </button>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="p-4 rounded-xl border border-gray-200 flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-2">
                  <WhatsappLogo className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-gray-900">WhatsApp Deals</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={whatsappSub ? "text-emerald-700 font-semibold" : "text-gray-400"}>
                    {whatsappSub ? "Subscribed" : "Unsubscribed"}
                  </span>
                  <button
                    onClick={() => {
                      setWhatsappSub(!whatsappSub)
                      handleUpdateSubscription()
                    }}
                    className="text-[11px] font-bold text-amber-800 hover:underline"
                  >
                    Toggle
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* B2B Company Account Link */}
          {customer.company_name && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-3">
              <h2 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-3 flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-800" />
                <span>B2B Corporate Account</span>
              </h2>

              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <h3 className="font-bold text-sm text-gray-900">{customer.company_name}</h3>
                  <p className="text-gray-500 mt-0.5">Pricing Tier: Tier 1 Gold (15% Corporate Discount)</p>
                </div>
                <Link
                  href="/customers/companies"
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg border border-gray-300"
                >
                  Manage Company
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Contact Details Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4 text-xs">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-3">
              Contact Overview
            </h2>

            <div className="space-y-3 text-gray-700">
              <div className="flex items-center gap-2.5">
                <EnvelopeSimple className="w-4 h-4 text-amber-800 shrink-0" />
                <a href={`mailto:${customer.email}`} className="font-semibold text-gray-900 hover:underline truncate">
                  {customer.email}
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-800 shrink-0" />
                <a href={`tel:${customer.phone}`} className="font-semibold text-gray-900 hover:underline">
                  {customer.phone}
                </a>
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100">
                <Translate className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Language: <strong className="text-gray-900">{customer.customer_language}</strong></span>
              </div>
            </div>
          </div>

          {/* Default Address Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-3 text-xs">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-800" />
              <span>Default Address</span>
            </h2>

            <div className="text-gray-700 leading-relaxed space-y-1">
              <p className="font-bold text-gray-900">{customer.first_name} {customer.last_name}</p>
              <p>{customer.location}</p>
              <p className="text-gray-500 font-mono">Postal Code: {customer.postal_code}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
