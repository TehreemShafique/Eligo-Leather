"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ShoppingBagOpen,
  Plus,
  MagnifyingGlass,
  DownloadSimple,
  CheckCircle,
  Clock,
  Package,
  Truck,
  Phone,
  Envelope,
  X,
  Sparkle,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminOrdersPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const [activeTab, setActiveTab] = useState<"all" | "unfulfilled" | "phone_only">("all")
  const [searchQuery, setSearchQuery] = useState("")

  const [leopardModalOrder, setLeopardModalOrder] = useState<any>(null)
  const [leopardTracking, setLeopardTracking] = useState("LPD-84920194")
  const [leopardCourier, setLeopardCourier] = useState("Leopard Courier Pakistan")
  const [phoneCallOrder, setPhoneCallOrder] = useState<any>(null)
  const [phoneNotes, setPhoneNotes] = useState("Called customer on phone. Confirmed COD amount and shipping address.")

  const [orders, setOrders] = useState([
    {
      id: 1339,
      order_number: "#1339",
      created_at: "Feb 11, 2026, 16:10",
      customer_name: "Asjad Ali",
      customer_email: "asjad.ali@example.com",
      customer_phone: "03260890680",
      has_email: true,
      destination: "Bahria Town, Lahore (PK)",
      payment_status: "Pending (COD)",
      fulfillment_status: "Fulfilled (Leopard)",
      phone_confirmed: true,
      items: "Handcrafted Leather Belt & Wallet",
      total: 2799,
      tracking_number: "ID7540816875",
    },
    {
      id: 1331,
      order_number: "#1331",
      created_at: "Feb 11, 2026, 15:45",
      customer_name: "danyal sajid",
      customer_email: "",
      customer_phone: "03115133191",
      has_email: false,
      destination: "Tarbela Ghazi (PK)",
      payment_status: "Pending (COD)",
      fulfillment_status: "Fulfilled (Leopard)",
      phone_confirmed: true,
      items: "ARDOR Leather Card Holder",
      total: 2699,
      tracking_number: "ID7536607778",
    },
    {
      id: 1329,
      order_number: "#1329",
      created_at: "Feb 11, 2026, 14:20",
      customer_name: "Raja Khubaib",
      customer_email: "raja.k@example.com",
      customer_phone: "03338880607",
      has_email: true,
      destination: "Adiala Road, Rawalpindi (PK)",
      payment_status: "Pending (COD)",
      fulfillment_status: "Fulfilled (Leopard)",
      phone_confirmed: true,
      items: "Executive Leather Sleeve",
      total: 2699,
      tracking_number: "ID7536607772",
    },
    {
      id: 101,
      order_number: "#EL-9482",
      created_at: "Feb 11, 2026, 14:30",
      customer_name: "Muhammad Ali",
      customer_email: "m.ali@example.com",
      customer_phone: "+92 300 1234567",
      has_email: true,
      destination: "Lahore, Pakistan",
      payment_status: "Paid",
      fulfillment_status: "Unfulfilled",
      phone_confirmed: true,
      items: "Handcrafted Leather Wallet (Orange)",
      total: 2799,
      tracking_number: "LPD-84920194",
    },
    {
      id: 102,
      order_number: "#EL-9483",
      created_at: "Feb 11, 2026, 12:15",
      customer_name: "Zainab Khan (Guest COD)",
      customer_email: "",
      customer_phone: "+92 321 9876543",
      has_email: false,
      destination: "Islamabad, Pakistan",
      payment_status: "Pending (COD)",
      fulfillment_status: "Unfulfilled",
      phone_confirmed: false,
      items: "ARDOR Leather Card Holder",
      total: 1850,
      tracking_number: "",
    },
  ])

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "unfulfilled" && order.fulfillment_status.includes("Fulfilled")) return false
    if (activeTab === "phone_only" && order.has_email) return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        order.order_number.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.customer_phone.toLowerCase().includes(q) ||
        order.destination.toLowerCase().includes(q)
      )
    }

    return true
  })

  const handleConfirmPhoneCall = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneCallOrder) return
    setOrders(prev =>
      prev.map(o => (o.id === phoneCallOrder.id ? { ...o, phone_confirmed: true } : o))
    )
    toast.success(`Order ${phoneCallOrder.order_number} confirmed via Phone Call!`)
    setPhoneCallOrder(null)
  }

  const handleGenerateLeopardShipment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!leopardModalOrder) return

    setOrders(prev =>
      prev.map(o =>
        o.id === leopardModalOrder.id
          ? {
              ...o,
              fulfillment_status: "Fulfilled (Leopard)",
              tracking_number: leopardTracking,
            }
          : o
      )
    )

    if (leopardModalOrder.has_email) {
      toast.success(
        `Leopard Shipment ${leopardTracking} generated! Auto-dispatched 'order_shipped' email via Resend to ${leopardModalOrder.customer_email}.`
      )
    } else {
      toast.info(
        `Leopard Shipment ${leopardTracking} generated! (No email attached - marked for manual phone/SMS dispatch to ${leopardModalOrder.customer_phone}).`
      )
    }

    setLeopardModalOrder(null)
  }

  const handleExportCSV = () => {
    const listToExport = filteredOrders.length > 0 ? filteredOrders : orders
    if (listToExport.length === 0) {
      toast.error("No orders available to export.")
      return
    }

    const headers = [
      "Order Number",
      "Created At",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Destination",
      "Payment Status",
      "Phone Call Status",
      "Fulfillment Status",
      "Items Purchased",
      "Total (PKR)",
      "Tracking Number",
    ]

    const escapeCsv = (val: string | number | undefined | null) => {
      const str = String(val ?? "").replace(/"/g, '""')
      return `"${str}"`
    }

    const csvRows = [
      headers.join(","),
      ...listToExport.map((order) =>
        [
          escapeCsv(order.order_number),
          escapeCsv(order.created_at),
          escapeCsv(order.customer_name),
          escapeCsv(order.customer_email || "N/A"),
          escapeCsv(order.customer_phone || "N/A"),
          escapeCsv(order.destination),
          escapeCsv(order.payment_status),
          escapeCsv(order.phone_confirmed ? "Confirmed" : "Pending Call"),
          escapeCsv(order.fulfillment_status),
          escapeCsv(order.items),
          escapeCsv(order.total),
          escapeCsv(order.tracking_number || "N/A"),
        ].join(",")
      ),
    ]

    const csvString = "\uFEFF" + csvRows.join("\n")
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const today = new Date().toISOString().split("T")[0]
    link.href = url
    link.setAttribute("download", `eligo_orders_export_${today}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`Exported ${listToExport.length} order(s) to CSV!`)
  }

  if (!mounted) return null

  const tabs = [
    { key: "all" as const, label: "All Orders", count: orders.length },
    { key: "unfulfilled" as const, label: "Unfulfilled", count: orders.filter(o => o.fulfillment_status.includes("Unfulfilled")).length },
    { key: "phone_only" as const, label: "Phone-Only", count: orders.filter(o => !o.has_email).length },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customer Orders & Dispatch"
        icon={<ShoppingBagOpen className="w-5 h-5" />}
        actions={
          <>
            <button onClick={handleExportCSV} className="eligo-btn-secondary">
              <DownloadSimple className="w-4 h-4 text-amber-800" />
              <span>Export CSV</span>
            </button>
            <Link href="/orders/drafts/new" className="eligo-btn-primary">
              <Plus className="w-4 h-4" />
              <span>Create order</span>
            </Link>
          </>
        }
      />

      {/* Orders Card */}
      <div className="eligo-card overflow-hidden animate-slide-up">
        {/* Tabs + Search */}
        <div className="px-4 pt-3 pb-3 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === tab.key
                    ? "bg-amber-800 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative flex-1 lg:max-w-xs lg:ml-auto">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, phone, customer..."
              className="eligo-input pl-9"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th w-[11%]">Order #</th>
                <th className="eligo-th w-[24%]">Customer & Contact</th>
                <th className="eligo-th w-[13%]">Phone Call</th>
                <th className="eligo-th w-[13%]">Payment</th>
                <th className="eligo-th w-[22%]">Fulfillment & Courier</th>
                <th className="eligo-th w-[10%] text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td">
                    <Link href={`/orders/${order.id}`} className="font-bold text-amber-900 hover:underline block">
                      {order.order_number}
                    </Link>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">{order.created_at}</div>
                  </td>

                  <td className="eligo-td">
                    <div className="font-bold text-gray-900 truncate">{order.customer_name}</div>
                    <div className="text-[11px] font-mono text-gray-600">{order.customer_phone}</div>
                    {order.has_email ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 mt-0.5">
                        <Envelope className="w-3 h-3" />
                        <span className="truncate max-w-[140px]">{order.customer_email}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[10px] border border-amber-300 mt-0.5">
                        <Phone className="w-3 h-3 text-amber-800" />
                        <span>No Email</span>
                      </span>
                    )}
                  </td>

                  <td className="eligo-td">
                    {order.phone_confirmed ? (
                      <span className="eligo-badge bg-emerald-100 text-emerald-800 border-emerald-200">
                        <CheckCircle className="w-3 h-3" />
                        Confirmed
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPhoneCallOrder(order)}
                        className="eligo-badge bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 cursor-pointer transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        Confirm Call
                      </button>
                    )}
                  </td>

                  <td className="eligo-td">
                    <Link
                      href={`/orders/${order.id}`}
                      className={`eligo-badge border ${
                        order.payment_status.includes("Paid")
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-amber-100 text-amber-900 border-amber-300"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span className="truncate">{order.payment_status}</span>
                    </Link>
                  </td>

                  <td className="eligo-td">
                    <div className="font-bold text-gray-900 truncate">{order.fulfillment_status}</div>
                    {order.tracking_number && (
                      <div className="text-[10px] font-mono text-emerald-800 font-bold truncate">
                        {order.tracking_number}
                      </div>
                    )}
                    {order.fulfillment_status.includes("Unfulfilled") && (
                      <button
                        type="button"
                        onClick={() => setLeopardModalOrder(order)}
                        className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 hover:text-amber-900 hover:underline cursor-pointer"
                      >
                        <Truck className="w-3 h-3" />
                        Book Leopard
                      </button>
                    )}
                  </td>

                  <td className="eligo-td text-right font-bold text-gray-900 whitespace-normal">
                    Rs. {order.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Phone Call Confirmation Modal */}
      {phoneCallOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans animate-scale-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-800/10 text-amber-800 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Confirm Phone Call</h3>
              </div>
              <button onClick={() => setPhoneCallOrder(null)} className="p-1 text-gray-400 hover:text-black cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
              <span className="font-bold text-amber-900 block">Customer: {phoneCallOrder.customer_name}</span>
              <span className="font-mono font-bold text-gray-900 text-sm block">Call: {phoneCallOrder.customer_phone}</span>
              <span className="text-[11px] text-gray-600 block">Order: {phoneCallOrder.order_number} ({phoneCallOrder.items})</span>
            </div>

            <form onSubmit={handleConfirmPhoneCall} className="space-y-4">
              <div>
                <label className="font-bold text-gray-900 block mb-1">Call Log Notes:</label>
                <textarea
                  rows={3}
                  value={phoneNotes}
                  onChange={e => setPhoneNotes(e.target.value)}
                  className="eligo-input !h-auto py-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setPhoneCallOrder(null)} className="eligo-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="eligo-btn-primary">
                  <CheckCircle className="w-4 h-4" />
                  Mark Call Confirmed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leopard Courier Shipment Modal */}
      {leopardModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans animate-scale-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-800/10 text-amber-800 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Leopard Shipment & Label</h3>
              </div>
              <button onClick={() => setLeopardModalOrder(null)} className="p-1 text-gray-400 hover:text-black cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Order:</span>
                <span className="font-bold text-gray-900 text-right">{leopardModalOrder.order_number}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Customer:</span>
                <span className="font-bold text-gray-900 text-right">{leopardModalOrder.customer_name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Destination:</span>
                <span className="font-bold text-gray-900 text-right">{leopardModalOrder.destination}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Customer Email:</span>
                <span className="font-bold text-gray-900 text-right">
                  {leopardModalOrder.has_email ? leopardModalOrder.customer_email : "None (Phone-Only)"}
                </span>
              </div>
            </div>

            <form onSubmit={handleGenerateLeopardShipment} className="space-y-4">
              <div>
                <label className="font-bold text-gray-900 block mb-1">Courier Company:</label>
                <input
                  type="text"
                  value={leopardCourier}
                  onChange={e => setLeopardCourier(e.target.value)}
                  className="eligo-input font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-900 block mb-1">Leopard Tracking / Consignment Number:</label>
                <input
                  type="text"
                  value={leopardTracking}
                  onChange={e => setLeopardTracking(e.target.value)}
                  className="eligo-input font-mono font-bold text-amber-900"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-gray-700">
                {leopardModalOrder.has_email ? (
                  <p>
                    <Sparkle className="w-3.5 h-3.5 inline text-amber-800 mr-1" />
                    Generates the Leopard Shipping Label and auto-sends the order shipped email to {leopardModalOrder.customer_email}.
                  </p>
                ) : (
                  <p>
                    <Phone className="w-3.5 h-3.5 inline text-amber-800 mr-1" />
                    Customer has no email. Generates the Leopard label &amp; flags tracking for staff to SMS/call the customer.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setLeopardModalOrder(null)} className="eligo-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="eligo-btn-primary">
                  <Package className="w-4 h-4" />
                  Generate Label & Fulfill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
