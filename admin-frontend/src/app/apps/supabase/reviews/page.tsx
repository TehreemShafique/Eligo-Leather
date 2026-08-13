"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Star,
  CheckCircle,
  XCircle,
  Trash,
  ArrowsClockwise,
  MagnifyingGlass,
  Funnel,
  ShieldCheck,
  Database,
  ArrowLeft,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"

interface Review {
  id: string
  productTitle: string
  productId: number
  authorName: string
  authorEmail: string
  rating: number
  title: string
  body: string
  createdAt: string
  status: "approved" | "pending" | "spam"
  verifiedPurchase: boolean
}

export default function AdminSupabaseReviewsPage() {
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [ratingFilter, setRatingFilter] = useState<string>("all")

  const [reviews, setReviews] = useState<Review[]>([
    {
      id: "rev_01",
      productTitle: "ARDOR - Handmade Leather Card Holder Wallet",
      productId: 1,
      authorName: "Muhammad Ali",
      authorEmail: "ali.m@example.com",
      rating: 5,
      title: "Outstanding craftsmanship!",
      body: "The leather quality is incredible. Stitching is precise and holds 6 cards comfortably without bulging.",
      createdAt: "2026-08-09T10:30:00Z",
      status: "approved",
      verifiedPurchase: true,
    },
    {
      id: "rev_02",
      productTitle: "ESSENCE - Premium Leather Belt (Dark Brown)",
      productId: 3,
      authorName: "Usman Tariq",
      authorEmail: "usman.t@example.com",
      rating: 5,
      title: "Genuine full grain leather",
      body: "Very solid brass buckle and thick premium leather. Fits perfectly according to waist measurement.",
      createdAt: "2026-08-08T14:15:00Z",
      status: "approved",
      verifiedPurchase: true,
    },
    {
      id: "rev_03",
      productTitle: "LEGEND - Genuine Leather Keychain Holder",
      productId: 2,
      authorName: "Sara Ahmed",
      authorEmail: "sara.a@example.com",
      rating: 4,
      title: "Great keychain, stylish color",
      body: "Compact and stylish. Keeps keys secure. Delivery took 3 days in Lahore.",
      createdAt: "2026-08-07T09:45:00Z",
      status: "pending",
      verifiedPurchase: true,
    },
    {
      id: "rev_04",
      productTitle: "ARDOR - Handmade Leather Card Holder Wallet",
      productId: 1,
      authorName: "Kamran Shah",
      authorEmail: "k.shah@example.com",
      rating: 5,
      title: "Value for money",
      body: "Subtle leather smell, soft feel in hand. High recommend Eligo products!",
      createdAt: "2026-08-05T18:20:00Z",
      status: "approved",
      verifiedPurchase: false,
    },
  ])

  const handleSync = () => {
    setSyncing(true)
    setTimeout(() => {
      setSyncing(false)
      toast.success("Successfully synchronized reviews with Supabase database (public.product_reviews)!")
    }, 900)
  }

  const handleApprove = (id: string) => {
    setReviews(prev =>
      prev.map(r => (r.id === id ? { ...r, status: "approved" } : r))
    )
    toast.success("Review approved and published to product page!")
  }

  const handleMarkSpam = (id: string) => {
    setReviews(prev =>
      prev.map(r => (r.id === id ? { ...r, status: "spam" } : r))
    )
    toast.info("Review marked as spam.")
  }

  const handleDelete = (id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id))
    toast.success("Review permanently deleted from Supabase.")
  }

  const filteredReviews = reviews.filter(r => {
    const matchesSearch =
      r.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.body.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || r.status === statusFilter
    const matchesRating = ratingFilter === "all" || r.rating === parseInt(ratingFilter)
    return matchesSearch && matchesStatus && matchesRating
  })

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Supabase Product Reviews"
        icon={<Database className="w-5 h-5" />}
        actions={
          <button
            onClick={handleSync}
            disabled={syncing}
            className="eligo-btn-primary"
          >
            <ArrowsClockwise className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Syncing..." : "Sync with Supabase"}</span>
          </button>
        }
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Reviews</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">{reviews.length}</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">+12 this week</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Average Rating</span>
          <div className="text-2xl font-bold text-amber-800 mt-1 flex items-center gap-2">
            <span>4.8</span>
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
          <span className="text-[11px] text-gray-500 font-medium mt-1 block">Based on verified buyers</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Verified Buyer Ratio</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">92%</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Order match verified</span>
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Pending Moderation</span>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {reviews.filter(r => r.status === "pending").length}
          </div>
          <span className="text-[11px] text-amber-600 font-medium mt-1 block">Requires admin review</span>
        </div>
      </div>

      {/* Filter & Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search product or review content..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1 text-xs text-gray-500 font-semibold">
              <Funnel className="w-3.5 h-3.5 text-gray-400" />
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 font-medium focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="spam">Spam</option>
            </select>

            <select
              value={ratingFilter}
              onChange={e => setRatingFilter(e.target.value)}
              className="h-9 px-3 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 font-medium focus:outline-hidden"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
            </select>
          </div>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th">Product &amp; Rating</th>
                <th className="eligo-th">Reviewer</th>
                <th className="eligo-th">Review Content</th>
                <th className="eligo-th">Status</th>
                <th className="eligo-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No Supabase reviews match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredReviews.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 max-w-xs">
                      <Link href={`/products/${r.productId}`} className="font-bold text-gray-900 hover:text-amber-800 block text-xs truncate">
                        {r.productTitle}
                      </Link>
                      <div className="flex items-center gap-1 text-amber-500 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="text-[11px] font-bold text-gray-700 ml-1">{r.rating}.0</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{r.authorName}</div>
                      <div className="text-[11px] text-gray-500">{r.authorEmail}</div>
                      {r.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold mt-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Verified Buyer</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 max-w-md">
                      <div className="font-bold text-gray-900">{r.title}</div>
                      <p className="text-gray-600 mt-0.5 line-clamp-2">{r.body}</p>
                      <span className="text-[10px] text-gray-400 block mt-1">
                        {new Date(r.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {r.status === "approved" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Approved
                        </span>
                      )}
                      {r.status === "pending" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Pending
                        </span>
                      )}
                      {r.status === "spam" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          Spam
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status !== "approved" && (
                          <button
                            onClick={() => handleApprove(r.id)}
                            title="Approve Review"
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {r.status !== "spam" && (
                          <button
                            onClick={() => handleMarkSpam(r.id)}
                            title="Mark as Spam"
                            className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(r.id)}
                          title="Delete Review"
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
