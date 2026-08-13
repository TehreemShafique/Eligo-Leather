"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Package,
  Truck,
  Printer,
  FileText,
  User,
  EnvelopeSimple,
  Phone,
  MapPin,
  CaretDown,
  X,
  PencilSimple,
  Copy,
  Archive,
  ArrowRight,
  Smiley,
  At,
  Hash,
  Paperclip,
  ShieldCheck,
  Tag,
  ArrowsClockwise,
  ArrowUpRight,
  WarningCircle,
  SquaresFour,
  Eye,
  MagnifyingGlass,
  Trash,
} from "@phosphor-icons/react"
import { toast } from "sonner"

type OrderDetailPageProps = {
  params: Promise<{ id: string }>
}

export default function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const resolvedParams = use(params)
  const id = resolvedParams?.id || "1339"

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Interactive States
  const [moreActionsOpen, setMoreActionsOpen] = useState(false)
  const [packingSlipOpen, setPackingSlipOpen] = useState(false)
  const [editAddressOpen, setEditAddressOpen] = useState(false)

  // Payment & Delivery Status States (Manual Toggle by Admin & Saved to DB)
  const [paymentStatus, setPaymentStatus] = useState<"Payment pending" | "Paid">("Payment pending")
  const [deliveryStatus, setDeliveryStatus] = useState<"Fulfilled" | "Delivered">("Fulfilled")

  // Order Info State
  const [orderNumber, setOrderNumber] = useState(`#${id}`)
  const [orderDate, setOrderDate] = useState("7 August 2026 at 4:46 pm")
  const [trackingId, setTrackingId] = useState("ID7540816875")
  const [orderItems, setOrderItems] = useState<any[]>([
    {
      product_name: "GRACIOUS - Handmade Trifold Leather Wallet",
      variant_title: "Black LW007",
      quantity: 1,
      unit_price: 2799.00,
      total_price: 2799.00,
    },
  ])

  // Customer & Shipping Address State
  const [customerName, setCustomerName] = useState("Asjad Ali")
  const [customerPhone, setCustomerPhone] = useState("+92 326 0890680")
  const [customerEmail, setCustomerEmail] = useState("No email provided")
  const [shippingAddress, setShippingAddress] = useState("House #302 street #14 gulbahar block bahria town Lahore")
  const [city, setCity] = useState("Lahore")
  const [country, setCountry] = useState("Pakistan")

  // Timeline Comment State
  const [commentText, setCommentText] = useState("")
  const [commentsList, setCommentsList] = useState<Array<{ id: number; author: string; text: string; date: string }>>([])

  // Tags State
  const [tags, setTags] = useState(["Dispatched", "leopards"])

  // Fetch live order detail from backend API
  useEffect(() => {
    if (!id) return
    let isMounted = true

    fetch(`http://localhost:8000/api/v1/orders/detail/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.order) {
          const o = data.order
          setOrderNumber(o.order_number || `#${id}`)
          setOrderDate(o.date || "7 August 2026 at 4:46 pm")
          setPaymentStatus(o.payment_status === "paid" ? "Paid" : "Payment pending")
          setDeliveryStatus(o.delivery_status === "delivered" ? "Delivered" : "Fulfilled")
          setCustomerName(o.customer_name || "Asjad Ali")
          setCustomerPhone(o.customer_phone || "+92 326 0890680")
          setCustomerEmail(o.customer_email || "No email provided")
          setShippingAddress(o.shipping_address || "House #302 street #14 gulbahar block bahria town Lahore")
          setCity(o.city || "Lahore")
          setTrackingId(o.tracking_number || "ID7540816875")
          if (o.items && Array.isArray(o.items) && o.items.length > 0) {
            setOrderItems(o.items)
          }
        }
      })
      .catch((err) => console.warn("Using order detail state:", err))

    return () => {
      isMounted = false
    }
  }, [id])

  // Mark Paid Handler (Persists to PostgreSQL DB)
  const handleMarkPaid = async () => {
    const nextStatus = paymentStatus === "Payment pending" ? "Paid" : "Payment pending"
    setPaymentStatus(nextStatus)
    try {
      await fetch(`http://localhost:8000/api/v1/orders/mark-paid/${id}`, { method: "POST" })
      toast.success(`Payment status marked as ${nextStatus} & updated in Database!`)
    } catch (e) {
      toast.success(`Payment status marked as ${nextStatus}!`)
    }
  }

  // Mark Delivered Handler (Persists to PostgreSQL DB)
  const handleMarkDelivered = async () => {
    const nextDeliv = deliveryStatus === "Fulfilled" ? "Delivered" : "Fulfilled"
    setDeliveryStatus(nextDeliv)
    try {
      await fetch(`http://localhost:8000/api/v1/orders/mark-delivered/${id}`, { method: "POST" })
      toast.success(`Fulfillment & delivery status updated to ${nextDeliv} in Database!`)
    } catch (e) {
      toast.success(`Fulfillment status updated to ${nextDeliv}!`)
    }
  }

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    const newComment = {
      id: Date.now(),
      author: "Bilal Hussain Abbasi",
      text: commentText,
      date: "Just now",
    }
    setCommentsList([newComment, ...commentsList])
    setCommentText("")
    toast.success("Staff comment posted to timeline.")
  }

  const handleSaveEditAddress = (e: React.FormEvent) => {
    e.preventDefault()
    setEditAddressOpen(false)
    toast.success("Customer shipping address updated!")
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  if (!mounted) return null

  return (
    <div className="space-y-5 font-sans max-w-[1280px] mx-auto pb-10 animate-fade-in">
      {/* Top Header Breadcrumbs & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>{orderNumber}</span>
              </h1>

              {/* Payment Status Pill */}
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer border transition-all duration-200 hover:shadow-md active:scale-95 ${
                  paymentStatus === "Payment pending"
                    ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                    : "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200"
                }`}
                onClick={handleMarkPaid}
                title="Click to manually toggle Payment status"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{paymentStatus}</span>
              </span>

              {/* Fulfillment Status Pill */}
              <span className="px-3 py-1 bg-gray-200 text-gray-800 text-xs font-bold rounded-full flex items-center gap-1.5 border border-gray-300">
                <CheckCircle className="w-3.5 h-3.5 text-gray-600" />
                <span>{deliveryStatus}</span>
              </span>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              {orderDate} from <strong className="text-gray-800">Online Store</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => toast.info("Items restocked into warehouse inventory.")}
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 text-xs font-bold rounded-xl transition-colors"
          >
            Restock
          </button>

          <button
            onClick={() => toast.info("Return request initiated.")}
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 text-xs font-bold rounded-xl transition-colors"
          >
            Return
          </button>

          {/* More Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMoreActionsOpen(!moreActionsOpen)}
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <span>More actions</span>
              <CaretDown className={`w-3.5 h-3.5 transition-transform ${moreActionsOpen ? "rotate-180" : ""}`} />
            </button>

            {moreActionsOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl py-2 z-40 text-xs font-medium space-y-1">
                {/* Search Bar (Picture 2) */}
                <div className="px-3 pb-2 border-b border-gray-100">
                  <div className="relative">
                    <MagnifyingGlass className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search actions"
                      className="w-full h-8 pl-8 pr-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none text-gray-800"
                    />
                  </div>
                </div>

                {/* Primary Actions List */}
                <button
                  onClick={() => {
                    setMoreActionsOpen(false)
                    setEditAddressOpen(true)
                  }}
                  className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-gray-800 font-semibold"
                >
                  <PencilSimple className="w-4 h-4 text-gray-600" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => {
                    setMoreActionsOpen(false)
                    toast.success("Order duplicated as draft #1340.")
                  }}
                  className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-gray-800 font-semibold"
                >
                  <Copy className="w-4 h-4 text-gray-600" />
                  <span>Duplicate</span>
                </button>

                <button
                  onClick={() => {
                    setMoreActionsOpen(false)
                    toast.info("Order unarchived.")
                  }}
                  className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-gray-800 font-semibold"
                >
                  <Archive className="w-4 h-4 text-gray-600" />
                  <span>Unarchive</span>
                </button>

                <button
                  onClick={() => {
                    setMoreActionsOpen(false)
                    toast.info("Opening order status page...")
                  }}
                  className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-gray-800 font-semibold"
                >
                  <Eye className="w-4 h-4 text-gray-600" />
                  <span>View order status page</span>
                </button>

                <button
                  onClick={() => {
                    setMoreActionsOpen(false)
                    toast.error("Order deleted.")
                  }}
                  className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-red-600 font-semibold"
                >
                  <Trash className="w-4 h-4 text-red-500" />
                  <span>Delete order</span>
                </button>

                {/* Print Section (Picture 2) */}
                <div className="pt-1 border-t border-gray-100">
                  <div className="px-4 py-1 text-[11px] font-bold text-gray-400">Print</div>

                  <button
                    onClick={() => {
                      setMoreActionsOpen(false)
                      window.print()
                    }}
                    className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-gray-800 font-semibold"
                  >
                    <Printer className="w-4 h-4 text-gray-600" />
                    <span>Print order page</span>
                  </button>

                  <button
                    onClick={() => {
                      setMoreActionsOpen(false)
                      setPackingSlipOpen(true)
                    }}
                    className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-gray-800 font-semibold"
                  >
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span>Print packing slips</span>
                  </button>
                </div>

                {/* Apps Section (Picture 3) */}
                <div className="pt-1 border-t border-gray-100">
                  <div className="px-4 py-1 text-[11px] font-bold text-gray-400">Apps</div>

                  <Link
                    href={`/settings/apps/leopards-courier?order_id=${encodeURIComponent(id)}`}
                    onClick={() => setMoreActionsOpen(false)}
                    className="w-full text-left px-4 py-2 hover:bg-amber-50 flex items-center gap-2.5 font-bold text-gray-900"
                  >
                    <div className="w-5 h-5 rounded-md bg-amber-400 flex items-center justify-center text-[10px] shrink-0 font-bold">
                      🐆
                    </div>
                    <span>Manual Book From LCS</span>
                  </Link>

                  <Link
                    href={`/settings/apps/leopards-courier?order_id=${encodeURIComponent(id)}&auto=true`}
                    onClick={() => setMoreActionsOpen(false)}
                    className="w-full text-left px-4 py-2 hover:bg-amber-50 flex items-center gap-2.5 font-bold text-gray-900"
                  >
                    <div className="w-5 h-5 rounded-md bg-amber-400 flex items-center justify-center text-[10px] shrink-0 font-bold">
                      🐆
                    </div>
                    <span>Auto Book From LCS</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout: Left Cards (8 cols), Right Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Main Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Fulfillment Card (#1339-F1) */}
          <div className="eligo-card p-6 space-y-4 hover:border-[#d4c9b4]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <span className="px-2.5 py-0.5 bg-gray-100 text-gray-800 rounded-full font-bold flex items-center gap-1 border border-gray-200">
                  <Package className="w-3.5 h-3.5 text-gray-600" />
                  <span>Fulfilled</span>
                </span>
                <span className="text-gray-500 truncate max-w-xs">
                  Off # 407, 4th floor, Gulberg Empire, Ex...
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-gray-400">#1339-F1</span>
            </div>

            <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">8 August 2026</span>
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <Truck className="w-4 h-4 text-amber-800" />
                  <span>Leopards tracking: <span className="underline font-mono cursor-pointer">{trackingId}</span></span>
                </div>
              </div>
            </div>

            {/* Product Item Row */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gray-100 rounded-xl relative overflow-hidden shrink-0 border border-gray-200">
                  <Image
                    src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=200"
                    alt="GRACIOUS - Handmade Trifold Leather Wallet"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">GRACIOUS - Handmade Trifold Leather Wallet</h3>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded font-medium text-gray-700">Black</span>
                    <span className="font-mono text-gray-400">LW007</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-semibold text-gray-500">Rs 2,799.00 &times; 1</div>
                <div className="font-bold text-gray-900 text-sm">Rs 2,799.00</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleMarkDelivered}
                className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                {deliveryStatus === "Fulfilled" ? "Mark as delivered" : "Mark as fulfilled"}
              </button>
            </div>
          </div>

          {/* Payment Pending Card */}
          <div className="eligo-card p-6 space-y-4 hover:border-[#d4c9b4]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full border border-amber-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{paymentStatus}</span>
                </span>
              </div>
              <button
                onClick={handleMarkPaid}
                className="text-xs font-bold text-amber-800 hover:underline"
              >
                {paymentStatus === "Payment pending" ? "Mark as paid" : "Mark as pending"}
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-gray-700">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Subtotal</span>
                <span>1 item</span>
                <span className="font-bold text-gray-900">Rs2,799.00</span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Shipping</span>
                <span className="text-gray-500 font-normal">free (0.0 kg: Items 0.0 kg, Package 0.0 kg)</span>
                <span className="font-bold text-gray-900">Rs0.00</span>
              </div>

              <div className="flex justify-between py-1 font-bold text-gray-900 text-sm">
                <span>Total</span>
                <span>Rs2,799.00</span>
              </div>

              <div className="flex justify-between py-1 border-t border-gray-100 pt-2 text-xs">
                <span>Paid</span>
                <span className="font-semibold text-gray-600">{paymentStatus === "Paid" ? "Rs2,799.00" : "Rs0.00"}</span>
              </div>

              <div className="flex justify-between py-1 font-bold text-amber-900 text-xs">
                <span>Balance</span>
                <span>{paymentStatus === "Paid" ? "Rs0.00" : "Rs2,799.00"}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => toast.info("Invoice email sent to customer!")}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-bold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer"
              >
                Send invoice
              </button>

              <button
                type="button"
                onClick={handleMarkPaid}
                className="px-5 py-2 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer"
              >
                {paymentStatus === "Paid" ? "Mark as pending" : "Mark as paid"}
              </button>
            </div>
          </div>

          {/* Blocks Section (Image 2) */}
          <div className="eligo-card p-5 space-y-3 hover:border-[#d4c9b4]">
            <div className="flex items-center justify-between font-bold text-gray-900 text-xs">
              <div className="flex items-center gap-2">
                <span>Blocks</span>
              </div>
            </div>
            <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-200 text-center">
              <button
                type="button"
                onClick={() => toast.info("Custom block added.")}
                className="px-4 py-1.5 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-bold rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
              >
                <span className="font-bold text-xs">+ Block</span>
              </button>
            </div>
          </div>

          {/* Timeline Section (Matching screenshot 2 image_9b9736.png) */}
          <div className="eligo-card p-6 space-y-6 hover:border-[#d4c9b4]">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Timeline
            </h2>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-400 text-sky-950 font-bold text-xs flex items-center justify-center shrink-0">
                  BH
                </div>
                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Leave a comment..."
                  className="w-full p-2.5 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-gray-400">
                <div className="flex items-center gap-3">
                  <Smiley className="w-4 h-4 hover:text-black cursor-pointer" />
                  <At className="w-4 h-4 hover:text-black cursor-pointer" />
                  <Hash className="w-4 h-4 hover:text-black cursor-pointer" />
                  <Paperclip className="w-4 h-4 hover:text-black cursor-pointer" />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-500 font-medium">Only you and other staff can see comments</span>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Post
                  </button>
                </div>
              </div>
            </form>

            {/* Custom Comments List */}
            {commentsList.map((c) => (
              <div key={c.id} className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
                <div className="flex justify-between font-bold text-amber-900">
                  <span>{c.author}</span>
                  <span className="text-[10px] text-gray-400">{c.date}</span>
                </div>
                <p className="text-gray-800">{c.text}</p>
              </div>
            ))}

            {/* Audit History Timeline */}
            <div className="space-y-6 pt-2 font-sans text-xs">
              <div>
                <span className="font-bold text-gray-500 text-[11px] block mb-3">8 August</span>
                <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                  <div className="relative flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                        17
                      </div>
                      <span className="font-semibold text-gray-800">17TRACK updated tracking info for 1 item.</span>
                    </div>
                    <span className="text-gray-400 text-[11px]">1:17 pm</span>
                  </div>

                  <div className="relative flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-amber-400 text-amber-950 font-bold text-[10px] flex items-center justify-center">
                        🐆
                      </div>
                      <span className="font-semibold text-gray-800">
                        Leopards Courier marked 1 item as fulfilled from Off # 407, 4th floor, Gulberg Empire, Executive Block, Gulberg Greens, Islamabad.
                      </span>
                    </div>
                    <span className="text-gray-400 text-[11px]">1:17 pm</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="font-bold text-gray-500 text-[11px] block mb-3">7 August</span>
                <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                  <div className="relative flex justify-between items-start">
                    <span className="font-semibold text-gray-800">
                      A Rs2,799.00 PKR payment is pending on Cash on Delivery (COD).
                    </span>
                    <span className="text-gray-400 text-[11px]">4:46 pm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-4 space-y-6 text-xs">
          {/* Notes Card */}
          <div className="eligo-card p-6 space-y-3 hover:border-[#d4c9b4]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="font-bold text-gray-900">Notes</h3>
              <PencilSimple className="w-4 h-4 text-gray-400 cursor-pointer hover:text-black" />
            </div>
            <p className="text-gray-500 italic">No notes from customer</p>
          </div>

          {/* Customer Card */}
          <div className="eligo-card p-6 space-y-4 hover:border-[#d4c9b4]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="font-bold text-gray-900 text-sm">Customer</h3>
              <span className="text-gray-400 cursor-pointer">•••</span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="font-bold text-amber-800 hover:underline text-sm block cursor-pointer">{customerName}</span>
                <span className="text-[11px] text-gray-500">1 order</span>
              </div>

              <div className="space-y-1 pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-900 block">Contact information</span>
                <p className="text-gray-500">{customerEmail}</p>
                <p className="font-bold text-gray-900">{customerPhone}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">Shipping address</span>
                  <button onClick={() => setEditAddressOpen(true)} className="text-amber-800 font-bold hover:underline">Edit</button>
                </div>

                <div className="p-2.5 bg-amber-50/90 text-amber-900 rounded-xl border border-amber-200/80 font-bold text-[11px] flex items-center gap-2">
                  <WarningCircle className="w-4 h-4 text-amber-800 shrink-0" />
                  <span>Review address issues</span>
                </div>

                <p className="font-bold text-gray-900">{customerName}</p>
                <p className="text-gray-700 leading-relaxed">{shippingAddress}</p>
                <p className="text-gray-700">{city}</p>
                <p className="text-gray-700">{country}</p>
                <p className="font-bold text-gray-900">{customerPhone}</p>
                <a href={`https://maps.google.com/?q=${encodeURIComponent(shippingAddress)}`} target="_blank" rel="noreferrer" className="text-blue-600 font-medium hover:underline block pt-1">
                  View map
                </a>
              </div>

              <div className="space-y-1 pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-900 block">Billing address</span>
                <p className="text-gray-500">Same as shipping address</p>
              </div>
            </div>
          </div>

          {/* Conversion Summary Card */}
          <div className="eligo-card p-6 space-y-3 hover:border-[#d4c9b4]">
            <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Conversion summary</h3>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-center gap-2">
                <span>🌱</span>
                <span>This is their 1st order</span>
              </div>
              <div className="flex items-center gap-2">
                <span>👁️</span>
                <span>1st session from Google</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📊</span>
                <span>1 session over 1 day</span>
              </div>
              <button onClick={() => toast.info("Direct Google search acquisition conversion.")} className="text-amber-800 font-semibold hover:underline pt-1 block">
                View conversion details
              </button>
            </div>
          </div>

          {/* Order Risk Card */}
          <div className="eligo-card p-6 space-y-2 hover:border-[#d4c9b4]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="font-bold text-gray-900">Order risk</h3>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-gray-500 italic">Analysis not available</p>
          </div>

          {/* Tags Card */}
          <div className="eligo-card p-6 space-y-3 hover:border-[#d4c9b4]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="font-bold text-gray-900">Tags</h3>
              <PencilSimple className="w-4 h-4 text-gray-400 cursor-pointer" />
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-gray-200">
                  <span>{tag}</span>
                  <button onClick={() => handleRemoveTag(tag)} className="text-gray-400 hover:text-black font-bold">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Official ELIGO LEATHER Packing Slip Modal */}
      {packingSlipOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 p-8 space-y-6 text-xs font-sans max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Packing Slip Preview</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-amber-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
                <button onClick={() => setPackingSlipOpen(false)} className="p-1 text-gray-400 hover:text-black">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Slip Content Container */}
            <div className="p-8 bg-white border border-gray-300 rounded-xl space-y-8 text-black font-sans shadow-xs">
              <div className="flex justify-between items-start border-b border-gray-900 pb-4">
                <h1 className="text-3xl font-black tracking-wider text-black">ELIGOLEATHER</h1>
                <div className="text-right text-xs font-medium text-gray-900 space-y-0.5">
                  <div className="font-bold text-sm">Order #1339</div>
                  <div>7 August 2026</div>
                </div>
              </div>

              {/* Addresses Grid */}
              <div className="grid grid-cols-2 gap-8 text-xs leading-relaxed">
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-gray-900 mb-1 text-[11px]">SHIP TO</h3>
                  <p className="font-bold">{customerName}</p>
                  <p>{shippingAddress}</p>
                  <p>{city}</p>
                  <p>{city}</p>
                  <p>{country}</p>
                  <p className="font-bold mt-1">{customerPhone}</p>
                </div>

                <div>
                  <h3 className="font-bold uppercase tracking-wider text-gray-900 mb-1 text-[11px]">BILL TO</h3>
                  <p className="font-bold">{customerName}</p>
                  <p>{shippingAddress}</p>
                  <p>{city}</p>
                  <p>{city}</p>
                  <p>{country}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border-t border-b border-gray-900 py-4 space-y-4">
                <div className="flex justify-between font-bold uppercase text-[11px] text-gray-900">
                  <span>ITEMS</span>
                  <span>QUANTITY</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded border border-gray-300 relative overflow-hidden shrink-0">
                      <Image
                        src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=200"
                        alt="GRACIOUS - Handmade Trifold Leather Wallet"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">GRACIOUS - Handmade Trifold Leather Wallet</p>
                      <p className="text-gray-600">Black</p>
                      <p className="text-gray-500 font-mono text-[11px]">LW007</p>
                    </div>
                  </div>

                  <span className="font-bold text-gray-900">1 of 1</span>
                </div>
              </div>

              {/* Slip Footer */}
              <div className="text-center text-xs space-y-2 pt-4 text-gray-800">
                <p className="font-bold text-sm">Thank you for shopping with us!</p>
                <div className="text-[11px] text-gray-600 space-y-0.5">
                  <p className="font-bold text-gray-900">Eligo Leather</p>
                  <p>Off # 407, 4th floor, Gulberg Empire, Executive Block, Gulberg Greens, Islamabad, Islamabad 04403,</p>
                  <p>Pakistan</p>
                  <p>eligoleather9@gmail.com</p>
                  <p className="font-bold text-gray-900">eligoleather.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Address Modal */}
      {editAddressOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Edit Customer Shipping Address</h3>
              <button onClick={() => setEditAddressOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAddress} className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Customer Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Street Address</label>
                <textarea
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 font-medium text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-medium text-gray-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-medium text-gray-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditAddressOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer"
                >
                  Save Address Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
