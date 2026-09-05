"use client"

import { API_BASE } from "@/lib/api"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  CaretLeft,
  Star,
  CheckCircle,
  XCircle,
  Trash,
  Funnel,
  MagnifyingGlass,
  Image as ImageIcon,
  Check,
  X,
  ShieldCheck,
  Database,
  ChatCircleText,
  Eye,
} from "@phosphor-icons/react"
import { toast } from "sonner"

// Customer-uploaded review photos are stored as backend-relative paths
// (e.g. `/static/uploads/x.webp`). Resolve them against the backend API base.
function resolveMediaUrl(url?: string | null): string {
  if (!url) return ""
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith("/")) return `${API_BASE}${url}`
  return url
}

interface CustomerReview {
  id: string | number
  productId: number | string
  productTitle: string
  reviewerName: string
  reviewerEmail: string
  rating: number
  title: string
  body: string
  status: "pending" | "approved" | "rejected"
  images?: string[]
  createdAt: string
  isVerified?: boolean
}

export default function SupabaseReviewsAdminPage() {
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>("all")
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const [reviews, setReviews] = useState<CustomerReview[]>([])

  // Fetch live reviews from the backend database
  useEffect(() => {
    let isMounted = true
    const fetchReviews = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE}/api/v1/settings/apps/supabase_reviews/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "fetch_reviews", payload: { page: 1, per_page: 100 } }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.detail || `Failed to load reviews (${res.status})`)
        }

        const data = await res.json()
        if (isMounted && data?.data?.reviews && Array.isArray(data.data.reviews)) {
            const mapped: CustomerReview[] = data.data.reviews.map((r: any) => ({
              id: r.id,
              productId: r.product_id || "",
              productTitle:
                r.product_id == null || r.product_id === ""
                  ? "Homepage Review"
                  : r.product_title || `Product #${r.product_id}`,
              reviewerName: r.reviewer_name || "Anonymous",
              reviewerEmail: r.reviewer_email || "",
              rating: Number(r.rating) || 5,
              title: r.title || "Customer Review",
              body: r.body || "",
              status: r.status === "approved" ? "approved" : r.status === "rejected" ? "rejected" : "pending",
              images: r.images || r.photo_urls || [],
              createdAt: r.created_at || new Date().toISOString(),
              isVerified: true,
            }))
            setReviews(mapped)
          }
      } catch (err) {
        console.error("Failed to fetch reviews:", err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load reviews")
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchReviews()
    return () => {
      isMounted = false
    }
  }, [])

  // Admin Decision: Update Review Status (Approve vs Reject)
  const handleUpdateStatus = async (reviewId: string | number, newStatus: "approved" | "rejected") => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/settings/apps/supabase_reviews/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_review_status",
          payload: { review_id: reviewId, status: newStatus },
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to update review status")
      }

      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: newStatus } : r))
      )

      if (newStatus === "approved") {
        toast.success("Review Approved! It is now published live on the product page.")
      } else {
        toast.info("Review Rejected. It is hidden from storefront product pages.")
      }
    } catch (err) {
      toast.error("Failed to update review status. Please try again.")
    }
  }

  // Delete Review
  const handleDeleteReview = async (reviewId: string | number) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/settings/apps/supabase_reviews/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_review",
          payload: { review_id: reviewId },
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to delete review")
      }

      setReviews((prev) => prev.filter((r) => r.id !== reviewId))
      toast.success("Review deleted from database.")
    } catch (err) {
      toast.error("Failed to delete review. Please try again.")
    }
  }

  // Products list for filtering
  const uniqueProducts = Array.from(new Set(reviews.map((r) => r.productTitle)))

  // Filter Logic
  const filteredReviews = reviews.filter((r) => {
    if (selectedProductFilter !== "all" && r.productTitle !== selectedProductFilter) return false
    if (selectedStatusFilter !== "all" && r.status !== selectedStatusFilter) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        r.reviewerName.toLowerCase().includes(q) ||
        r.reviewerEmail.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.body.toLowerCase().includes(q) ||
        r.productTitle.toLowerCase().includes(q)
      )
    }

    return true
  })

  // Summary Metrics
  const pendingCount = reviews.filter((r) => r.status === "pending").length
  const approvedCount = reviews.filter((r) => r.status === "approved").length
  const avgRating = (
    reviews.reduce((acc, curr) => acc + curr.rating, 0) / Math.max(1, reviews.length)
  ).toFixed(1)

  return (
    <div className="space-y-5 font-sans text-gray-900 pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link href="/settings/apps" className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors">
            <CaretLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Product Reviews</h1>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-300 flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span>Stored in Eligo database</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Moderate customer reviews &amp; uploaded photos before publishing live to product pages.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 bg-amber-50 text-amber-900 font-extrabold text-xs rounded-xl border border-amber-300 flex items-center gap-1.5">
            <ChatCircleText className="w-4 h-4 text-amber-800" />
            <span>{pendingCount} Pending Moderation</span>
          </span>
        </div>
      </div>

      {/* Metric Cards Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-gray-500 block">Average Rating</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-gray-900">{avgRating}</span>
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(avgRating)) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
              ))}
            </div>
          </div>
          <span className="text-[11px] text-gray-400 font-medium">{reviews.length} total reviews</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-gray-500 block">Pending Queue</span>
          <span className="text-2xl font-extrabold text-amber-700">{pendingCount}</span>
          <span className="text-[11px] text-amber-900 block font-medium">Requires admin approval</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-gray-500 block">Live on Storefront</span>
          <span className="text-2xl font-extrabold text-emerald-700">{approvedCount}</span>
          <span className="text-[11px] text-emerald-900 block font-medium">Published on product pages</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-gray-500 block">Customer Photos</span>
          <span className="text-2xl font-extrabold text-indigo-700">
            {reviews.reduce((acc, curr) => acc + (curr.images?.length || 0), 0)}
          </span>
          <span className="text-[11px] text-indigo-900 block font-medium">Uploaded by buyers</span>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviewer name, email, product, or review text..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-white border border-gray-300 text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSelectedStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedStatusFilter === "all" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-600 hover:text-black"
              }`}
            >
              All ({reviews.length})
            </button>
            <button
              onClick={() => setSelectedStatusFilter("pending")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedStatusFilter === "pending" ? "bg-amber-800 text-white shadow-2xs" : "text-gray-600 hover:text-black"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setSelectedStatusFilter("approved")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedStatusFilter === "approved" ? "bg-emerald-700 text-white shadow-2xs" : "text-gray-600 hover:text-black"
              }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => setSelectedStatusFilter("rejected")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedStatusFilter === "rejected" ? "bg-gray-700 text-white shadow-2xs" : "text-gray-600 hover:text-black"
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Product Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-gray-500 font-bold flex items-center gap-1 mr-1">
            <Funnel className="w-3.5 h-3.5 text-gray-400" />
            <span>Product Filter:</span>
          </span>
          <button
            onClick={() => setSelectedProductFilter("all")}
            className={`px-3 py-1 rounded-xl font-bold transition-colors cursor-pointer ${
              selectedProductFilter === "all" ? "bg-amber-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Products
          </button>
          {uniqueProducts.map((prodName) => (
            <button
              key={prodName}
              onClick={() => setSelectedProductFilter(prodName)}
              className={`px-3 py-1 rounded-xl font-bold transition-colors cursor-pointer ${
                selectedProductFilter === prodName ? "bg-amber-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {prodName}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Reviews Queue Cards */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-bold">Could not load reviews</p>
            <p>{error}</p>
          </div>
        </div>
      )}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className={`bg-white rounded-2xl border p-5 space-y-4 transition-all ${
                rev.status === "pending"
                  ? "border-amber-300 ring-2 ring-amber-400/20 shadow-xs"
                  : rev.status === "approved"
                  ? "border-gray-200 hover:border-emerald-300"
                  : "border-gray-200 opacity-75 bg-gray-50/50"
              }`}
            >
              {/* Top Row: Product Title & Status Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-900 font-extrabold text-xs rounded-xl border border-gray-200">
                    {rev.productTitle}
                  </span>
                  {rev.isVerified && (
                    <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Verified Buyer</span>
                    </span>
                  )}
                </div>

                {/* Status Badge */}
                <div>
                  {rev.status === "pending" && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-full border border-amber-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping inline-block" />
                      <span>Pending Admin Approval</span>
                    </span>
                  )}
                  {rev.status === "approved" && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-full border border-emerald-300 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-700" />
                      <span>Live on Product Page</span>
                    </span>
                  )}
                  {rev.status === "rejected" && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 font-bold text-xs rounded-full border border-gray-300 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-gray-500" />
                      <span>Rejected (Hidden)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Review Content & Customer Details */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start text-xs">
                <div className="md:col-span-8 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                      ))}
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">{rev.title}</h3>
                  </div>

                  <p className="text-gray-700 leading-relaxed font-medium">{rev.body}</p>

                  {/* Customer Uploaded Product Photos */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-gray-600 block mb-1.5 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Customer Uploaded Product Photos ({rev.images.length}):</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {rev.images.map((imgUrl, imgIdx) => (
                          <div
                            key={imgIdx}
                            onClick={() => setPreviewImage(imgUrl)}
                            className="w-16 h-16 rounded-xl border border-gray-300 overflow-hidden cursor-pointer hover:opacity-85 transition-opacity relative group"
                          >
                            <img src={resolveMediaUrl(imgUrl)} alt="Review upload" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Reviewer Meta */}
                <div className="md:col-span-4 p-3 bg-gray-50/80 rounded-xl border border-gray-200 space-y-1 text-[11px]">
                  <span className="text-gray-500 font-bold block">Reviewer Details</span>
                  <p className="font-bold text-gray-900">{rev.reviewerName}</p>
                  <p className="text-gray-600 font-mono">{rev.reviewerEmail}</p>
                  <p className="text-gray-400 pt-1 border-t border-gray-200">
                    Submitted: {new Date(rev.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Admin Decision Control Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                {rev.status !== "approved" && (
                  <button
                    onClick={() => handleUpdateStatus(rev.id, "approved")}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve (Show on Product Page)</span>
                  </button>
                )}

                {rev.status !== "rejected" && (
                  <button
                    onClick={() => handleUpdateStatus(rev.id, "rejected")}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject (Hide)</span>
                  </button>
                )}

                <button
                  onClick={() => handleDeleteReview(rev.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition-colors"
                  title="Delete review"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center text-xs text-gray-500 font-medium">
            No customer reviews found matching your search or product filter.
          </div>
        )}
      </div>

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="relative max-w-xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={resolveMediaUrl(previewImage)} alt="Uploaded customer review photo" className="w-full max-h-[75vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  )
}
