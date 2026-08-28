"use client"

import { useState, useEffect, use, useCallback, useRef } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Truck,
  Printer,
  FileText,
  ArrowCounterClockwise,
  User,
  EnvelopeSimple,
  Phone,
  MapPin,
  CaretDown,
  X,
  PencilSimple,
  Tag,
  WarningCircle,
  Plus,
  Spinner,
  Trash,
  TextB,
  TextItalic,
  TextStrikethrough,
  Quotes,
  LinkSimple,
  Smiley,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"

type OrderDetailPageProps = {
  params: Promise<{ id: string }>
}

interface OrderItem {
  id: number
  product_id?: number | null
  variant_id?: number | null
  sku?: string | null
  product_name: string
  variant_title: string | null
  quantity: number
  unit_price: number
  total_price: number
  restocked?: boolean
}

interface AuditLog {
  id: number
  event_type: string
  description: string
  actor_name: string | null
  created_at: string
}

interface OrderNote {
  id: number
  order_id: number
  author_name: string
  body: string
  is_customer_visible: boolean
  created_at: string
  updated_at: string
}

interface OrderData {
  id: number
  order_number: string
  customer_id: number | null
  channel: string
  currency: string
  subtotal: number
  shipping_cost: number
  tax: number
  total_price: number
  paid_amount: number
  payment_status: string
  fulfillment_status: string
  delivery_status: string
  delivery_method: string
  return_status: string
  tracking_company: string | null
  tracking_number: string | null
  shipping_address: string | null
  billing_address: string | null
  customer_note: string | null
  internal_note: string | null
  tags: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
  items: OrderItem[]
  customer_name?: string | null
  customer_phone?: string | null
  customer_email?: string | null
}

type FeedItem =
  | {
      kind: "event"
      id: number
      description: string
      event_type: string
      actor_name: string | null
      created_at: string
    }
  | {
      kind: "comment"
      id: number
      body: string
      author_name: string | null
      is_customer_visible: boolean
      created_at: string
    }

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((startOfToday.getTime() - startOfDay.getTime()) / 86400000)
  if (diffDays <= 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  })
}

export default function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const resolvedParams = use(params)
  const id = resolvedParams?.id || ""

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<OrderData | null>(null)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [notes, setNotes] = useState<OrderNote[]>([])

  const [moreActionsOpen, setMoreActionsOpen] = useState(false)
  const [packingSlipOpen, setPackingSlipOpen] = useState(false)
  const [editAddressOpen, setEditAddressOpen] = useState(false)
  const [restocking, setRestocking] = useState(false)

  const [editShippingAddress, setEditShippingAddress] = useState("")
  const [commentText, setCommentText] = useState("")
  const [newTag, setNewTag] = useState("")
  const [internalNote, setInternalNote] = useState("")
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editNoteText, setEditNoteText] = useState("")
  const composerRef = useRef<HTMLTextAreaElement | null>(null)

  const fetchOrder = useCallback(async () => {
    if (!id) return
    try {
      const data = await apiFetch<OrderData>(`/api/v1/orders/${encodeURIComponent(id)}`)
      setOrder(data)
      setOrderId(data.id)
      setEditShippingAddress(data.shipping_address || "")
      setInternalNote(data.internal_note || "")
    } catch {
      toast.error("Could not load order details")
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchAuditLog = useCallback(async () => {
    if (orderId == null) return
    try {
      const data = await apiFetch<AuditLog[]>(`/api/v1/orders/${orderId}/audit-log`)
      setAuditLogs(data)
    } catch { /* silent */ }
  }, [orderId])

  const fetchNotes = useCallback(async () => {
    if (orderId == null) return
    try {
      const data = await apiFetch<OrderNote[]>(`/api/v1/orders/${orderId}/notes`)
      setNotes(data)
    } catch { /* silent */ }
  }, [orderId])

  useEffect(() => {
    fetchOrder(); fetchAuditLog(); fetchNotes()
  }, [fetchOrder, fetchAuditLog, fetchNotes])

  useEffect(() => {
    const interval = setInterval(() => { fetchOrder(); fetchAuditLog(); fetchNotes() }, 30000)
    return () => clearInterval(interval)
  }, [fetchOrder, fetchAuditLog, fetchNotes])

  const handleMarkPaid = async () => {
    if (!order) return
    try {
      await apiFetch(`/api/v1/orders/mark-paid/${orderId}`, { method: "POST" })
      toast.success("Payment status marked as Paid!")
      fetchOrder(); fetchAuditLog()
    } catch { toast.error("Failed to update payment status") }
  }

  const handleMarkDelivered = async () => {
    if (!order) return
    try {
      await apiFetch(`/api/v1/orders/mark-delivered/${orderId}`, { method: "POST" })
      toast.success("Order marked as delivered!")
      fetchOrder(); fetchAuditLog()
    } catch { toast.error("Failed to update delivery status") }
  }

  // Returns every non-restocked order item back to its variant's inventory
  // (same product + same color variant that was ordered). The order itself
  // stays in the system for courier (Leopards) return claims.
  const handleRestock = async () => {
    if (!order || restocking) return
    const restockable = order.items.filter(i => !i.restocked)
    if (restockable.length === 0) {
      toast.info("All items in this order are already restocked.")
      return
    }
    const summary = restockable
      .map(i => `${i.product_name} (${i.variant_title || "Standard"}) x ${i.quantity}`)
      .join(", ")
    if (
      !window.confirm(
        `Return these items back to inventory?\n\n${summary}\n\n` +
        `Stock becomes available again on the exact color variants ordered. ` +
        `The order stays in the system for the Leopards return claim.`,
      )
    ) {
      return
    }
    setRestocking(true)
    try {
      await apiFetch(`/api/v1/orders/${orderId}/restock`, { method: "POST" })
      toast.success(`${restockable.length} item(s) returned to inventory!`)
      fetchOrder(); fetchAuditLog()
    } catch {
      toast.error("Failed to restock items")
    } finally {
      setRestocking(false)
    }
  }

  const handleUpdateTags = async (newTags: string) => {
    if (!order) return
    try {
      await apiFetch(`/api/v1/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ tags: newTags }),
      })
      fetchOrder(); fetchAuditLog()
    } catch { toast.error("Failed to update tags") }
  }

  const handleAddTag = () => {
    if (!newTag.trim() || !order) return
    const current = order.tags ? order.tags.split(",").map(t => t.trim()).filter(Boolean) : []
    if (current.includes(newTag.trim())) { toast.info("Tag already exists"); setNewTag(""); return }
    handleUpdateTags([...current, newTag.trim()].join(", "))
    setNewTag("")
  }

  const handleRemoveTag = (tag: string) => {
    if (!order) return
    const current = order.tags ? order.tags.split(",").map(t => t.trim()).filter(Boolean) : []
    handleUpdateTags(current.filter(t => t !== tag).join(", "))
  }

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    try {
      await apiFetch(`/api/v1/orders/${orderId}/notes`, {
        method: "POST",
        body: JSON.stringify({ body: commentText, is_customer_visible: false }),
      })
      setCommentText(""); fetchNotes(); fetchAuditLog()
      toast.success("Comment added to timeline")
    } catch { toast.error("Failed to post comment") }
  }

  const handleSaveEditedNote = async (noteId: number) => {
    if (!editNoteText.trim()) return
    try {
      await apiFetch(`/api/v1/orders/notes/${noteId}?body=${encodeURIComponent(editNoteText)}`, {
        method: "PATCH",
      })
      setEditingNoteId(null); setEditNoteText("")
      fetchNotes(); fetchAuditLog()
      toast.success("Comment updated")
    } catch { toast.error("Failed to update comment") }
  }

  const handleDeleteNote = async (noteId: number) => {
    try {
      await apiFetch(`/api/v1/orders/notes/${noteId}`, { method: "DELETE" })
      fetchNotes(); fetchAuditLog()
      toast.success("Comment removed from timeline")
    } catch { toast.error("Failed to delete comment") }
  }

  const applyFormat = (before: string, after: string = before) => {
    const el = composerRef.current
    if (!el) return
    const start = el.selectionStart ?? commentText.length
    const end = el.selectionEnd ?? commentText.length
    const next =
      commentText.slice(0, start) + before + commentText.slice(start, end) + after + commentText.slice(end)
    setCommentText(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + before.length, end + before.length)
    })
  }

  const appendEmoji = (emoji: string) => {
    const el = composerRef.current
    const start = el?.selectionStart ?? commentText.length
    const next = commentText.slice(0, start) + emoji + commentText.slice(start)
    setCommentText(next)
  }

  const handleSaveNote = async () => {
    if (!order) return
    try {
      await apiFetch(`/api/v1/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ internal_note: internalNote }),
      })
      toast.success("Note saved!"); fetchOrder()
    } catch { toast.error("Failed to save note") }
  }

  const handleSaveAddress = async () => {
    if (!order) return
    try {
      await apiFetch(`/api/v1/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ shipping_address: editShippingAddress }),
      })
      setEditAddressOpen(false); toast.success("Shipping address updated!"); fetchOrder(); fetchAuditLog()
    } catch { toast.error("Failed to update address") }
  }

  if (loading) return <div className="flex items-center justify-center py-32"><Spinner className="w-8 h-8 text-amber-800 animate-spin" /></div>

  if (!order) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <WarningCircle className="w-10 h-10 text-gray-400" />
      <span className="text-sm font-semibold text-gray-500">Order not found</span>
      <Link href="/orders" className="text-xs font-bold text-amber-800 hover:underline">Back to orders</Link>
    </div>
  )

  const tags = order.tags ? order.tags.split(",").map(t => t.trim()).filter(Boolean) : []
  const isPaid = order.payment_status === "paid"
  const isFulfilled = order.fulfillment_status === "fulfilled"
  const restockableItems = order.items.filter(i => !i.restocked)
  const allRestocked = order.items.length > 0 && restockableItems.length === 0
  const totalRestockUnits = order.items.reduce((sum, i) => sum + i.quantity, 0)

  const feed: FeedItem[] = [
    ...auditLogs.map((log): FeedItem => ({
      kind: "event",
      id: log.id,
      description: log.description,
      event_type: log.event_type,
      actor_name: log.actor_name,
      created_at: log.created_at,
    })),
    ...notes.map((n): FeedItem => ({
      kind: "comment",
      id: n.id,
      body: n.body,
      author_name: n.author_name,
      is_customer_visible: n.is_customer_visible,
      created_at: n.created_at,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const feedGroups: { label: string; items: FeedItem[] }[] = []
  for (const item of feed) {
    const label = dayLabel(item.created_at)
    const lastGroup = feedGroups[feedGroups.length - 1]
    if (lastGroup && lastGroup.label === label) lastGroup.items.push(item)
    else feedGroups.push({ label, items: [item] })
  }

  return (
    <div className="space-y-5 font-sans max-w-[1280px] mx-auto pb-10 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/orders" className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-black transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
              <span onClick={handleMarkPaid} className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer border transition-all duration-200 hover:shadow-md active:scale-95 ${isPaid ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200" : "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"}`} title="Click to toggle payment status">
                {isPaid ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                <span>{isPaid ? "Paid" : "Payment pending"}</span>
              </span>
              <span className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 border ${isFulfilled ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-gray-100 text-gray-700 border-gray-200"}`}>
                {isFulfilled ? <Truck className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                <span>{isFulfilled ? "Fulfilled" : "Unfulfilled"}</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatDateLong(order.created_at)} from <strong className="text-gray-800">{order.channel}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 relative">
          {!isPaid && <button onClick={handleMarkPaid} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer">Mark as Paid</button>}
          {!isFulfilled && <button onClick={handleMarkDelivered} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer">Mark as Delivered</button>}
          {restockableItems.length > 0 && (
            <button
              onClick={handleRestock}
              disabled={restocking}
              title="Return ordered items back to their variant inventory"
              className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {restocking ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <ArrowCounterClockwise className="w-3.5 h-3.5" />}
              <span>{restocking ? "Restocking..." : `Restock item${restockableItems.length > 1 ? "s" : ""}`}</span>
            </button>
          )}
          <div className="relative">
            <button onClick={() => setMoreActionsOpen(!moreActionsOpen)} className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer">
              <span>More actions</span>
              <CaretDown className={`w-3.5 h-3.5 transition-transform ${moreActionsOpen ? "rotate-180" : ""}`} />
            </button>
            {moreActionsOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl py-2 z-40 text-xs font-medium space-y-1">
                <button onClick={() => { setMoreActionsOpen(false); setEditAddressOpen(true) }} className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-gray-800 font-semibold"><PencilSimple className="w-4 h-4 text-gray-600" /><span>Edit shipping address</span></button>
                <button onClick={() => { setMoreActionsOpen(false); window.print() }} className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-gray-800 font-semibold"><Printer className="w-4 h-4 text-gray-600" /><span>Print order page</span></button>
                <button onClick={() => { setMoreActionsOpen(false); setPackingSlipOpen(true) }} className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-gray-800 font-semibold"><FileText className="w-4 h-4 text-gray-600" /><span>Print packing slip</span></button>
                <div className="pt-1 border-t border-gray-100">
                  <div className="px-4 py-1 text-[11px] font-bold text-gray-400">Book Shipment</div>
                  <Link href={`/settings/apps/leopards-courier?order_id=${encodeURIComponent(id)}`} onClick={() => setMoreActionsOpen(false)} className="w-full text-left px-4 py-2 hover:bg-amber-50 flex items-center gap-2.5 font-bold text-gray-900">
                    <span className="text-amber-600">{"\u{1F406}"}</span><span>Book via Leopard Courier</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Fulfillment Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">Fulfillment</h3>
              <div className="flex items-center gap-2">
                {allRestocked && (
                  <span className="eligo-badge bg-violet-100 text-violet-800 border-violet-200 cursor-default" title={`${totalRestockUnits} unit(s) returned to inventory`}>
                    <ArrowCounterClockwise className="w-3 h-3" />Restocked
                  </span>
                )}
                {isFulfilled && <span className="eligo-badge bg-blue-100 text-blue-800 border-blue-200"><Truck className="w-3 h-3" />Fulfilled</span>}
              </div>
            </div>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500"><span className="text-sm">📦</span></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-900 truncate flex items-center gap-2">
                      <span className="truncate">{item.product_name}</span>
                      {item.restocked && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-bold">Restocked to inventory</span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500">{item.variant_title || "Default"} x {item.quantity}</div>
                  </div>
                  <div className="text-xs font-bold text-gray-900">Rs. {Number(item.total_price).toLocaleString()}</div>
                </div>
              ))}
            </div>
            {order.tracking_number && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <span className="text-[11px] text-gray-500 font-semibold">Tracking</span>
                <span className="text-xs font-bold font-mono text-emerald-800">{order.tracking_number}</span>
              </div>
            )}
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">Payment</h3>
              <span className={`eligo-badge ${isPaid ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-900 border-amber-300"}`}>
                {isPaid ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {isPaid ? "Paid" : "Pending"}
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-bold text-gray-900">Rs. {Number(order.subtotal).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="font-bold text-gray-900">Rs. {Number(order.shipping_cost).toLocaleString()}</span></div>
              {Number(order.tax) > 0 && <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="font-bold text-gray-900">Rs. {Number(order.tax).toLocaleString()}</span></div>}
              <div className="flex justify-between pt-2 border-t border-gray-100"><span className="font-bold text-gray-900">Total</span><span className="font-bold text-gray-900">Rs. {Number(order.total_price).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Paid by customer</span><span className="font-bold text-emerald-800">Rs. {Number(order.paid_amount).toLocaleString()}</span></div>
              {Number(order.total_price) - Number(order.paid_amount) > 0 && <div className="flex justify-between"><span className="text-gray-500">Balance due</span><span className="font-bold text-amber-800">Rs. {(Number(order.total_price) - Number(order.paid_amount)).toLocaleString()}</span></div>}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">Timeline</h3>
            <form onSubmit={handlePostComment} className="space-y-2">
              <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-t-xl border-b-0 flex-wrap">
                <button type="button" title="Bold" onClick={() => applyFormat("**")} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"><TextB className="w-3.5 h-3.5" /></button>
                <button type="button" title="Italic" onClick={() => applyFormat("_")} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"><TextItalic className="w-3.5 h-3.5" /></button>
                <button type="button" title="Strikethrough" onClick={() => applyFormat("~~")} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"><TextStrikethrough className="w-3.5 h-3.5" /></button>
                <span className="w-px h-4 bg-gray-300 mx-0.5" />
                <button type="button" title="Quote" onClick={() => applyFormat("> ")} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"><Quotes className="w-3.5 h-3.5" /></button>
                <button type="button" title="Link" onClick={() => applyFormat("[", "](https://)")} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"><LinkSimple className="w-3.5 h-3.5" /></button>
                <span className="w-px h-4 bg-gray-300 mx-0.5" />
                <span className="flex items-center gap-0.5">
                  {["\u{1F44D}", "\u{1F4E6}", "\u{1F69A}", "\u2705", "\u26A0\uFE0F"].map((emoji) => (
                    <button key={emoji} type="button" onClick={() => appendEmoji(emoji)} className="p-1 rounded-md hover:bg-gray-200 text-sm cursor-pointer transition-colors leading-none">{emoji}</button>
                  ))}
                  <Smiley className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
                </span>
              </div>
              <textarea
                ref={composerRef}
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment to the timeline..."
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-b-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 resize-none"
              />
              <div className="flex justify-end">
                <button type="submit" disabled={!commentText.trim()} className="px-3 h-8 bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0">Post</button>
              </div>
            </form>
            <div className="space-y-5 pt-1">
              {feedGroups.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No timeline events yet</p>
              ) : (
                feedGroups.map((group) => (
                  <div key={group.label} className="space-y-0">
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide pb-2">{group.label}</div>
                    {group.items.map((item) => (
                      <div key={`${item.kind}-${item.id}`} className="flex gap-3 relative">
                        <div className="flex flex-col items-center">
                          <CheckCircle weight="fill" className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="w-px flex-1 bg-gray-200 my-1" />
                        </div>
                        <div className="pb-4 flex-1 min-w-0">
                          {item.kind === "event" ? (
                            <>
                              <p className="text-xs text-gray-800 leading-relaxed">{item.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-gray-400">{formatTime(item.created_at)}</span>
                                {item.actor_name && <><span className="text-[10px] text-gray-300">{"\u00B7"}</span><span className="text-[10px] text-gray-500 font-semibold">{item.actor_name}</span></>}
                              </div>
                            </>
                          ) : editingNoteId === item.id ? (
                            <div className="space-y-2">
                              <textarea rows={2} value={editNoteText} onChange={(e) => setEditNoteText(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 resize-none" />
                              <div className="flex gap-1.5">
                                <button onClick={() => handleSaveEditedNote(item.id)} className="px-2.5 h-7 bg-amber-800 hover:bg-amber-900 text-white text-[11px] font-bold rounded-lg cursor-pointer">Save</button>
                                <button onClick={() => { setEditingNoteId(null); setEditNoteText("") }} className="px-2.5 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded-lg cursor-pointer">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">{item.body}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[10px] text-gray-400">{formatTime(item.created_at)}</span>
                                {item.author_name && <><span className="text-[10px] text-gray-300">{"\u00B7"}</span><span className="text-[10px] text-gray-500 font-semibold">{item.author_name}</span></>}
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">Comment</span>
                                <button onClick={() => { setEditingNoteId(item.id); setEditNoteText(item.body) }} className="text-[10px] font-bold text-gray-500 hover:text-amber-800 cursor-pointer inline-flex items-center gap-0.5"><PencilSimple className="w-3 h-3" />Edit</button>
                                <button onClick={() => handleDeleteNote(item.id)} className="text-[10px] font-bold text-gray-500 hover:text-red-600 cursor-pointer inline-flex items-center gap-0.5"><Trash className="w-3 h-3" />Delete</button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-5">
          {/* Customer Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-3">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Customer</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5"><User className="w-4 h-4 text-gray-400" /><span className="text-xs font-bold text-gray-900">{order.customer_name || "Guest"}</span></div>
              {order.customer_phone && <div className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-gray-400" /><span className="text-xs text-gray-700">{order.customer_phone}</span></div>}
              {order.customer_email && <div className="flex items-center gap-2.5"><EnvelopeSimple className="w-4 h-4 text-gray-400" /><span className="text-xs text-gray-700">{order.customer_email}</span></div>}
            </div>
            {order.shipping_address && <div className="pt-2 border-t border-gray-100"><div className="flex items-start gap-2.5"><MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" /><span className="text-xs text-gray-700 leading-relaxed">{order.shipping_address}</span></div></div>}
          </div>

          {/* Note Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-3">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Note</h3>
            <textarea rows={3} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} placeholder="Add a private note about this order..." className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 resize-none" />
            <button onClick={handleSaveNote} className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer">Save Note</button>
          </div>

          {/* Tags Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-3">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[11px] font-bold">
                  <Tag className="w-3 h-3" />{tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-0.5 text-amber-600 hover:text-red-600 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())} placeholder="Add tag..." className="flex-1 h-8 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800" />
              <button onClick={handleAddTag} disabled={!newTag.trim()} className="px-2 h-8 bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white rounded-xl cursor-pointer"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Address Modal */}
      {editAddressOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Edit Shipping Address</h3>
              <button onClick={() => setEditAddressOpen(false)} className="p-1 text-gray-400 hover:text-black cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <textarea rows={4} value={editShippingAddress} onChange={(e) => setEditShippingAddress(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 resize-none" />
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button onClick={() => setEditAddressOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold cursor-pointer">Cancel</button>
              <button onClick={handleSaveAddress} className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Packing Slip Modal */}
      {packingSlipOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Packing Slip - {order.order_number}</h3>
              <button onClick={() => setPackingSlipOpen(false)} className="p-1 text-gray-400 hover:text-black cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div><span className="font-bold text-gray-900">Ship to:</span> <span className="text-gray-700">{order.customer_name || "Guest"}</span></div>
              <div><span className="font-bold text-gray-900">Address:</span> <span className="text-gray-700">{order.shipping_address || "No address"}</span></div>
              <div className="border-t border-gray-100 pt-3 space-y-2">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-gray-700">{item.product_name} x {item.quantity}</span>
                    <span className="font-bold text-gray-900">Rs. {Number(item.total_price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span><span>Rs. {Number(order.total_price).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button onClick={() => window.print()} className="px-4 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer">Print</button>
              <button onClick={() => setPackingSlipOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
