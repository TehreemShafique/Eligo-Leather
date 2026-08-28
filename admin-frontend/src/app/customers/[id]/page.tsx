"use client"

import { useState, useEffect, useCallback, use } from "react"
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
  Spinner,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>
}

interface CustomerAddress {
  id: number
  first_name: string | null
  last_name: string | null
  address_line1: string
  city: string
  province: string | null
  postal_code: string | null
  country: string
  phone: string | null
  is_default: boolean
}

interface CompanyInfo {
  id?: number
  name?: string
  company_name?: string
}

interface CustomerData {
  id: number
  email: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  location: string | null
  postal_code: string | null
  customer_language: string | null
  email_subscription: boolean
  sms_subscription: boolean
  whatsapp_subscription: boolean
  total_orders: number
  amount_spent: number
  tax_exempt: boolean
  deletable: boolean
  created_at: string
  addresses: CustomerAddress[]
  companies: CompanyInfo[]
}

interface OrderRow {
  id: number
  order_number: string
  total_price: number
  payment_status: string
  fulfillment_status: string
  created_at: string
  items: { id: number; product_name: string; quantity: number }[]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  })
}

export default function AdminCustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = use(params)

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [orders, setOrders] = useState<OrderRow[]>([])

  const [emailSub, setEmailSub] = useState(false)
  const [smsSub, setSmsSub] = useState(false)
  const [whatsappSub, setWhatsappSub] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchCustomer = useCallback(async () => {
    try {
      const data = await apiFetch<CustomerData>(`/api/v1/customers/${id}`)
      setCustomer(data)
      setEmailSub(Boolean(data.email_subscription))
      setSmsSub(Boolean(data.sms_subscription))
      setWhatsappSub(Boolean(data.whatsapp_subscription))
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchOrders = useCallback(async () => {
    try {
      const data = await apiFetch<OrderRow[]>(`/api/v1/orders/?customer_id=${id}&limit=50`)
      setOrders(Array.isArray(data) ? data : [])
    } catch { /* silent */ }
  }, [id])

  useEffect(() => {
    fetchCustomer(); fetchOrders()
  }, [fetchCustomer, fetchOrders])

  const handleUpdateSubscription = async (
    key: "email" | "sms" | "whatsapp",
    value: boolean,
  ) => {
    if (!customer) return
    setToggling(key)
    const body =
      key === "email" ? { email_subscription: value }
      : key === "sms" ? { sms_subscription: value }
      : { whatsapp_subscription: value }
    try {
      await apiFetch(`/api/v1/customers/${customer.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      })
      toast.success("Customer subscription settings updated!")
    } catch {
      toast.error("Failed to update subscription")
      // revert on failure
      if (key === "email") setEmailSub(!value)
      else if (key === "sms") setSmsSub(!value)
      else setWhatsappSub(!value)
    } finally {
      setToggling(null)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-32"><Spinner className="w-8 h-8 text-amber-800 animate-spin" /></div>

  if (!customer || notFound) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <User className="w-10 h-10 text-gray-400" />
      <span className="text-sm font-semibold text-gray-500">Customer not found</span>
      <Link href="/customers" className="text-xs font-bold text-amber-800 hover:underline">Back to customers</Link>
    </div>
  )

  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || customer.email || "Guest"
  const defaultAddress =
    customer.addresses?.find((a) => a.is_default) || customer.addresses?.[0] || null
  const company = customer.companies?.[0] || null

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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{fullName}</h1>
              {customer.tax_exempt && (
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Tax Exempt
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Customer since {formatDate(customer.created_at)} &bull; Location: <strong className="text-gray-800">{customer.location || "—"}</strong>
            </p>
          </div>
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
                  Orders History ({orders.length})
                </h2>
              </div>
              <span className="text-xs font-bold text-gray-900">
                Total Spent: Rs. {Number(customer.amount_spent || 0).toLocaleString()}
              </span>
            </div>

            <div className="divide-y divide-gray-100 text-xs">
              {orders.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-semibold">No orders yet</div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                    <div>
                      <Link href={`/orders/${encodeURIComponent(String(order.order_number).replace(/^#/, ""))}`} className="font-bold text-amber-800 hover:underline">{order.order_number}</Link>
                      <span className="text-gray-500 ml-2">&bull; {formatDate(order.created_at)}</span>
                      <p className="text-[11px] text-gray-600 mt-0.5 truncate max-w-[320px]">
                        {order.items?.map((i) => `${i.product_name} x${i.quantity}`).join(", ") || "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">Rs. {Number(order.total_price).toLocaleString()}</div>
                      <span className={`inline-block text-[10px] px-2 py-0.5 font-bold rounded-full ${
                        order.payment_status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-900"
                      }`}>
                        {order.payment_status}
                      </span>
                    </div>
                  </div>
                ))
              )}
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
                    disabled={toggling === "email"}
                    onClick={() => {
                      setEmailSub(!emailSub)
                      handleUpdateSubscription("email", !emailSub)
                    }}
                    className="text-[11px] font-bold text-amber-800 hover:underline disabled:opacity-50"
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
                    disabled={toggling === "sms"}
                    onClick={() => {
                      setSmsSub(!smsSub)
                      handleUpdateSubscription("sms", !smsSub)
                    }}
                    className="text-[11px] font-bold text-amber-800 hover:underline disabled:opacity-50"
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
                    disabled={toggling === "whatsapp"}
                    onClick={() => {
                      setWhatsappSub(!whatsappSub)
                      handleUpdateSubscription("whatsapp", !whatsappSub)
                    }}
                    className="text-[11px] font-bold text-amber-800 hover:underline disabled:opacity-50"
                  >
                    Toggle
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* B2B Company Account Link */}
          {company && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-3">
              <h2 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-3 flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-800" />
                <span>B2B Corporate Account</span>
              </h2>

              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <h3 className="font-bold text-sm text-gray-900">{company.name || company.company_name}</h3>
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
                {customer.email ? (
                  <a href={`mailto:${customer.email}`} className="font-semibold text-gray-900 hover:underline truncate">
                    {customer.email}
                  </a>
                ) : (
                  <span className="text-gray-400">No email</span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-800 shrink-0" />
                {customer.phone ? (
                  <a href={`tel:${customer.phone}`} className="font-semibold text-gray-900 hover:underline">
                    {customer.phone}
                  </a>
                ) : (
                  <span className="text-gray-400">No phone</span>
                )}
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100">
                <Translate className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Language: <strong className="text-gray-900">{customer.customer_language || "en"}</strong></span>
              </div>
            </div>
          </div>

          {/* Default Address Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-3 text-xs">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-800" />
              <span>Default Address</span>
            </h2>

            {defaultAddress ? (
              <div className="text-gray-700 leading-relaxed space-y-1">
                <p className="font-bold text-gray-900">{fullName}</p>
                <p>{defaultAddress.address_line1}, {defaultAddress.city}{defaultAddress.province ? `, ${defaultAddress.province}` : ""}, {defaultAddress.country}</p>
                <p className="text-gray-500 font-mono">Postal Code: {defaultAddress.postal_code || customer.postal_code || "—"}</p>
              </div>
            ) : (
              <div className="text-gray-700 leading-relaxed space-y-1">
                <p>{customer.location || "No address on file"}</p>
                <p className="text-gray-500 font-mono">Postal Code: {customer.postal_code || "—"}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
