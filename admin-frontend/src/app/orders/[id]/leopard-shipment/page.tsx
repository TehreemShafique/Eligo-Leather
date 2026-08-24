"use client"

import { useState, use, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Truck,
  Printer,
  Barcode,
  CheckCircle,
  Check,
  ArrowsClockwise,
  X,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Legacy orders pack "Name | Phone: 03xx | street, city" into shipping_address;
// the slip must show the street address only.
function cleanConsigneeAddress(raw: string): string {
  const s = (raw || "").trim()
  if (!s.includes("|")) return s
  const parts = s.split("|").map((p) => p.trim()).filter(Boolean)
  const phoneIdx = parts.findIndex((p) => p.toLowerCase().startsWith("phone"))
  if (phoneIdx === -1) return s
  const address = parts.slice(phoneIdx + 1).join(", ").trim()
  return address || s
}

interface OrderDetail {
  id: number
  order_number: string
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  shipping_address: string | null
  city: string | null
  total_price: number | string | null
  items?: Array<{ product_name: string; variant_title?: string; quantity: number }>
}

export default function AdminLeopardShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const orderId = resolvedParams.id

  // Consignee details (prefilled live from the database)
  const [loadingOrder, setLoadingOrder] = useState(true)
  const [orderNumber, setOrderNumber] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [shippingAddress, setShippingAddress] = useState("")
  const [city, setCity] = useState("") // Manual text input
  const [weightGrams, setWeightGrams] = useState("500")
  const [pieces, setPieces] = useState("1")
  const [codAmount, setCodAmount] = useState("0")
  const [specialInstructions, setSpecialInstructions] = useState("")

  // Shipper & Business Info (from Settings -> General store settings)
  const [accountName, setAccountName] = useState("102620 / ELIGO LEATHER")
  const [businessAddress, setBusinessAddress] = useState(
    "Office # 407, 4th floor, Gulberg Empire, Civic Center, Executive Block, Gulberg Greens, Islamabad"
  )
  const [shipperContact, setShipperContact] = useState("03345399470")
  // Shipper Address and Return Address are both the business address
  const shipperReturnAddress = businessAddress

  // Courier Booking State
  const [isBooked, setIsBooked] = useState(false)
  const [cnNumber, setCnNumber] = useState<string>("")
  const [bookingDate, setBookingDate] = useState("")
  const [bookingLoading, setBookingLoading] = useState(false)
  const [showSlipModal, setShowSlipModal] = useState(false)

  // Load order + business address on mount
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/v1/orders/detail/${orderId}`)
        if (res.ok) {
          const data = await res.json()
          const o: OrderDetail | undefined = data?.order
          if (o && !cancelled) {
            setOrderNumber(o.order_number || `#${orderId}`)
            setRecipientName(o.customer_name || "")
            setRecipientPhone(o.customer_phone || "")
            setShippingAddress(cleanConsigneeAddress(o.shipping_address || ""))
            setCity((o.city || "").toUpperCase())
            setCodAmount(o.total_price != null ? String(o.total_price) : "0")
            if (o.items && Array.isArray(o.items) && o.items.length > 0) {
              setSpecialInstructions(
                o.items
                  .map((i) => `${i.product_name}${i.variant_title ? ` - ${i.variant_title}` : ""} Qty=${i.quantity}`)
                  .join(", ")
              )
            }
          }
        } else {
          toast.error("Could not load order details from database")
        }

        try {
          const settings = await apiFetch<{ store_name?: string; store_phone?: string; address?: string }>(
            "/api/v1/settings/general/store-settings"
          )
          if (settings && !cancelled) {
            if (settings.address && settings.address.trim()) setBusinessAddress(settings.address.trim())
            if (settings.store_phone) setShipperContact(settings.store_phone)
            if (settings.store_name) setAccountName(`102620 / ${settings.store_name.toUpperCase()}`)
          }
        } catch {
          // Not logged in as admin or endpoint unavailable - keep defaults
        }
      } finally {
        if (!cancelled) setLoadingOrder(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [orderId])

  const trackingStages = [
    { stage: "CN Booked", desc: "Shipment registered via Leopard API", time: isBooked ? `${cnNumber}` : "Pending", completed: isBooked },
    { stage: "Picked Up", desc: "Rider picked up parcel from Islamabad Hub", time: "Pending", completed: false },
    { stage: "In Transit", desc: `Dispatched to Destination Hub (${city || "-"})`, time: "Pending", completed: false },
    { stage: "Out for Delivery", desc: "Assigned to Leopard Rider for delivery", time: "Pending", completed: false },
    { stage: "Delivered & COD Collected", desc: "Handed to customer & cash collected", time: "Pending", completed: false },
  ]

  const handleBookShipment = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/v1/orders/leopard/book-packet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderNumber || `#${orderId}`,
          cod_amount: codAmount,
          consignee_name: recipientName,
          consignee_phone: recipientPhone,
          consignee_email: "",
          consignee_address: shippingAddress,
          destination_city: city,
          special_instructions: specialInstructions || "N/A",
          weight: weightGrams || "500",
          weight_grams: parseInt(weightGrams.replace(/[^0-9]/g, "")) || 500,
          pieces: parseInt(pieces) || 1,
        }),
      })

      const data = await res.json()
      if (res.ok && data.status === "success" && data.cn_number) {
        const details = data.booking_details || {}
        setCnNumber(String(data.cn_number))
        setBookingDate(details.booking_date || new Date().toISOString().slice(0, 10))
        setIsBooked(true)
        toast.success(`Leopard Shipment Booked! Consignment CN Number: ${data.cn_number}`)
      } else {
        toast.error(data.message || "Leopards booking failed. Check destination city and try again.")
      }
    } catch {
      toast.error("Could not reach the Leopards booking service.")
    } finally {
      setBookingLoading(false)
    }
  }

  const handlePrintSlip = () => {
    window.print()
  }

  return (
    <div className="space-y-5 font-sans max-w-[1280px] mx-auto pb-10 animate-fade-in">
      {/* Top Header */}
      <div className="eligo-card animate-slide-up px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/orders/${orderId}`}
            className="p-2 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 hover:text-amber-800 hover:border-amber-300 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              Leopard Courier Shipment &amp; Pay Slip ({orderNumber || `#${orderId}`})
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isBooked && (
            <button
              onClick={() => setShowSlipModal(true)}
              className="px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>View &amp; Print Official Leopard Label</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Edit Form, Right Live CN Status & Tracking Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start animate-slide-up delay-75">
        {/* Left 7 cols: Customer & Shipment Details Form */}
        <div className="lg:col-span-7 eligo-card p-6 space-y-5 text-xs hover:border-[#d4c9b4]">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-800" />
              <span>Customer Shipping Information</span>
            </h2>
            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-900 font-bold text-[10px] rounded-full border border-amber-200">
              {loadingOrder ? "Loading from DB..." : "Loaded from Database"}
            </span>
          </div>

          <form onSubmit={handleBookShipment} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900 uppercase focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Contact Number</label>
                <input
                  type="text"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl font-mono font-bold text-gray-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Complete Address</label>
              <textarea
                rows={2}
                required
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl font-semibold text-gray-900 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Destination City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. ISLAMABAD or LAHORE"
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-xl font-bold text-amber-900 uppercase focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Weight in Grams</label>
                <input
                  type="text"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Pieces</label>
                <input
                  type="text"
                  value={pieces}
                  onChange={(e) => setPieces(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">COD Amount (PKR)</label>
                <input
                  type="text"
                  required
                  value={codAmount}
                  onChange={(e) => setCodAmount(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl font-bold text-amber-900 text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Merchant Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900 uppercase focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Package Remarks</label>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl font-semibold text-gray-800"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={bookingLoading}
                className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Truck className="w-4 h-4" />
                <span>{bookingLoading ? "Connecting to Leopard API..." : "Book Leopard Shipment & Generate CN"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 5 cols: Live Leopard Consignment Card & Real-World Tracking Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Consignment CN Summary */}
          <div className="eligo-card p-6 space-y-4 text-xs hover:border-[#d4c9b4]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="font-bold text-gray-900 flex items-center gap-2">
                <Barcode className="w-5 h-5 text-amber-800" />
                <span>Leopard Courier Consignment (CN)</span>
              </span>
              <span className={`px-2.5 py-0.5 font-bold text-[10px] rounded-full border ${
                isBooked
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : "bg-gray-100 text-gray-500 border-gray-200"
              }`}>
                {isBooked ? "Active CN #" : "Not Booked"}
              </span>
            </div>

            {isBooked ? (
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-center space-y-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Consignment CN Number</span>
                <div className="text-2xl font-black font-mono text-amber-900 tracking-wider block">{cnNumber}</div>
                <span className="text-[11px] text-gray-600 block">Booking Date: {bookingDate}</span>
                <span className="text-[11px] font-bold text-emerald-800 block">Destination: {(city || "-").toUpperCase()}</span>

                <button
                  type="button"
                  onClick={() => setShowSlipModal(true)}
                  className="w-full py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>View Official Airway Bill Label</span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-2">
                <CheckCircle className="w-6 h-6 text-gray-300 mx-auto" />
                <span className="text-[11px] text-gray-500 block">
                  Fill the form and book to generate a real Leopards CN for this order.
                </span>
              </div>
            )}
          </div>

          {/* Real-World Live Tracking Timeline */}
          <div className="eligo-card p-6 space-y-4 text-xs hover:border-[#d4c9b4]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <ArrowsClockwise className="w-4 h-4 text-amber-800" />
                <span>Live Leopard Tracking Timeline</span>
              </h3>
              <span className="text-[10px] text-gray-400 font-mono">Leopard API Polling</span>
            </div>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 font-sans">
              {trackingStages.map((stage, idx) => (
                <div key={idx} className="relative">
                  <div
                    className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      stage.completed ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-gray-300"
                    }`}
                  >
                    {stage.completed && <Check className="w-2.5 h-2.5" />}
                  </div>

                  <div>
                    <span className={`font-bold block ${stage.completed ? "text-gray-900" : "text-gray-400"}`}>
                      {stage.stage}
                    </span>
                    <span className="text-gray-500 block text-[11px]">{stage.desc}</span>
                    <span className="text-[10px] font-mono text-gray-400">{stage.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Official Leopard Courier Airway Bill Label Modal */}
      {showSlipModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:z-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:border-none print:shadow-none print:w-full">
            <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-100 text-xs font-sans print:hidden">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Official Leopard Courier Airway Bill Label (CN # {cnNumber})</h3>
                <p className="text-[11px] text-gray-500">Official Leopard format generated for order {orderNumber || `#${orderId}`}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="px-4 py-1.5 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-lg text-xs shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Label Now</span>
                </button>
                <button onClick={() => setShowSlipModal(false)} className="p-1 text-gray-400 hover:text-black cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Airway Bill Label */}
            <div className="p-6 bg-white overflow-y-auto text-[11px] text-black font-sans leading-snug print:p-0">
              {/* Outer Printable Container */}
              <div className="border-2 border-black p-3 space-y-2 bg-white max-w-3xl mx-auto shadow-sm print:shadow-none print:max-w-none">
                {/* Header Row */}
                <div className="flex items-center justify-between border-b-2 border-black pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-amber-900 text-white font-black rounded-lg flex items-center justify-center text-xs tracking-tighter shadow-2xs">
                      LEO
                    </div>
                    <div>
                      <h1 className="text-xl font-black italic tracking-tighter text-black uppercase leading-none">Leopards</h1>
                      <span className="text-[9px] font-bold text-gray-600 tracking-widest block">There for You</span>
                    </div>
                  </div>

                  <div className="text-center font-sans">
                    <span className="text-2xl font-black underline tracking-widest text-purple-950 uppercase block">ECONOMY</span>
                    <span className="text-xs font-bold text-black uppercase tracking-wide block">(COD PARCEL)</span>
                  </div>

                  <div className="border border-black px-3 py-1 font-bold text-[11px] text-black">
                    Handle with care
                  </div>
                </div>

                {/* 3-Column Main Grid Table */}
                <div className="grid grid-cols-12 border-2 border-black font-sans divide-x-2 divide-black">
                  {/* Column 1: Consignee / Shipper Info (4 cols) */}
                  <div className="col-span-4 p-2 space-y-3">
                    <div className="text-center font-bold underline border-b border-black pb-1 uppercase text-[10px]">
                      Consignee / Shipper Information
                    </div>

                    <div className="space-y-1">
                      <div className="font-bold underline text-[11px] text-center">Consignee Information</div>
                      <div
                        onClick={() => {
                          navigator.clipboard.writeText(recipientName)
                          toast.success(`Copied recipient name '${recipientName}'`)
                        }}
                        className="hover:bg-amber-50 cursor-pointer p-0.5 rounded transition-colors"
                        title="Click to copy name"
                      >
                        <span className="font-bold">Name :</span> <span className="font-bold uppercase">{recipientName}</span>
                      </div>
                      <div><span className="font-bold">Address :</span> <span>{shippingAddress}{city ? `, ${city}` : ""}</span></div>
                      <div
                        onClick={() => {
                          navigator.clipboard.writeText(recipientPhone)
                          toast.success(`Copied recipient phone '${recipientPhone}'`)
                        }}
                        className="hover:bg-amber-50 cursor-pointer p-0.5 rounded transition-colors"
                        title="Click to copy phone"
                      >
                        <span className="font-bold">Contact #:</span> <span className="font-mono font-bold">{recipientPhone}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-400 pt-1 space-y-1">
                      <div className="font-bold underline text-[11px] text-center">Business Information</div>
                      <div className="text-[10px] leading-tight">
                        <span className="font-bold">Address :</span> {businessAddress}
                      </div>
                    </div>

                    <div className="border-t border-gray-400 pt-1 space-y-1">
                      <div className="font-bold underline text-[11px] text-center">Shipper / Return Information</div>
                      <div><span className="font-bold">AC / Name :</span> <span className="underline">{accountName}</span></div>
                      <div><span className="font-bold">Address :</span> <span className="underline">{shipperReturnAddress}</span></div>
                      <div><span className="font-bold">Contact #:</span> <span className="font-mono">{shipperContact}</span></div>
                      <div><span className="font-bold">Return Address :</span> <span>{shipperReturnAddress}</span></div>
                    </div>
                  </div>

                  {/* Column 2: Consignment Information */}
                  <div className="col-span-4 p-2 space-y-3 flex flex-col justify-between">
                    <div className="text-center font-bold underline border-b border-black pb-1 uppercase text-[10px]">
                      Consignment Information
                    </div>

                    <div className="space-y-2 text-xs font-sans p-2 bg-gray-50 border border-gray-300 rounded-lg">
                      <div className="flex justify-between items-center border-b border-gray-200 pb-1">
                        <span className="font-bold text-gray-700">Consignment CN #:</span>
                        <span className="font-mono font-black text-amber-900 text-sm">{cnNumber}</span>
                      </div>

                      <div className="flex justify-between items-center border-b border-gray-200 pb-1">
                        <span className="font-bold text-gray-700">Tracking No:</span>
                        <span className="font-mono font-bold text-black">{cnNumber}</span>
                      </div>

                      <div className="flex justify-between items-center border-b border-gray-200 pb-1">
                        <span className="font-bold text-gray-700">Destination:</span>
                        <span className="font-black text-sm uppercase text-purple-950">{city}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-700">Booking Status:</span>
                        <span className="font-bold text-[10px] text-emerald-800 uppercase">Booked &amp; Registered</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-gray-500 italic text-center">
                      Leopard Express Network Dispatch
                    </div>
                  </div>

                  {/* Column 3: Shipment Information */}
                  <div className="col-span-4 p-2 space-y-2">
                    <div className="text-center font-bold underline border-b border-black pb-1 uppercase text-[10px]">
                      Shipment Information
                    </div>

                    <div className="space-y-1.5 font-sans text-[11px]">
                      <div className="flex justify-between">
                        <span className="font-bold">Pieces :</span>
                        <span className="font-bold">{pieces} PCS (1/{pieces})</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="font-bold">Weight :</span>
                        <span className="font-mono">{weightGrams} (Grams)</span>
                      </div>

                      <div className="border-y border-black py-2 px-2 bg-gray-100 rounded flex justify-between items-center">
                        <span className="font-bold">COD Amount :</span>
                        <span className="font-mono font-black text-base text-amber-950">PKR {codAmount}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="font-bold">Order ID :</span>
                        <span className="font-mono font-bold">{orderNumber || `#${orderId}`}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="font-bold">Origin :</span>
                        <span className="font-bold uppercase">ISLAMABAD</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="font-bold">Booking Date :</span>
                        <span className="font-mono">{bookingDate}</span>
                      </div>

                      <div className="border-t border-gray-300 pt-1">
                        <span className="font-bold block">Remarks :-</span>
                        <span className="text-[10px] text-gray-800 block mt-0.5">{specialInstructions}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Line */}
                <div className="flex items-center justify-between text-[9px] font-mono text-gray-700 pt-1 border-t border-gray-300">
                  <span>Website: <span className="underline text-purple-900 font-bold">http://www.leopardscourier.com</span></span>
                  <span>UAN: 111 300 786</span>
                  <span>User : 56871</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
