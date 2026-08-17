"use client"

import { useState } from "react"
import Image from "next/image"
import { Star, X } from "@phosphor-icons/react"
import { toast } from "sonner"

interface Testimonial {
  id: number
  author: string
  avatar: string
  timeAgo: string
  rating: number
  title: string
  content: string
  photos: string[]
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    author: "Muhammad Usman",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    timeAgo: "1 month ago",
    rating: 5,
    title: "Excellent Quality",
    content:
      "I had ordered Handmade RFID Leather Wallet Open media 4 in modal HERALD - Handmade RFID Leather Wallet inspire online scammers they have the best quality... And I surprised to see that product 100 % recommend",
    photos: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=200",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=200",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=200",
    ],
  },
  {
    id: 2,
    author: "Hamza Malik",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    timeAgo: "1 month ago",
    rating: 5,
    title: "Unmatched Craftsmanship",
    content:
      "I had ordered Handmade RFID Leather Wallet Open media 4 in modal HERALD - Handmade RFID Leather Wallet inspire online scammers they have the best quality... And I surprised to see that product 100 % recommend",
    photos: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=200",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=200",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=200",
    ],
  },
  {
    id: 3,
    author: "Zainab Ahmed",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    timeAgo: "1 month ago",
    rating: 5,
    title: "100% Real Leather",
    content:
      "I had ordered Handmade RFID Leather Wallet Open media 4 in modal HERALD - Handmade RFID Leather Wallet inspire online scammers they have the best quality... And I surprised to see that product 100 % recommend",
    photos: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=200",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=200",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=200",
    ],
  },
]

export function TestimonialsSection() {
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [newReview, setNewReview] = useState({ name: "", title: "", content: "", rating: 5 })

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Thank you for your review! It will be posted after verification.")
    setReviewModalOpen(false)
    setNewReview({ name: "", title: "", content: "", rating: 5 })
  }

  return (
    <section className="py-12 bg-transparent w-full max-w-[1680px] min-h-[587px] mx-auto my-12 font-['Manrope']">
      <div className="w-full">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-black tracking-tight">
            What Our Customers Say
          </h2>

          <button
            onClick={() => setReviewModalOpen(true)}
            className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold rounded-[5px] shadow-sm transition-colors font-['Manrope'] inline-flex items-center justify-center self-start sm:self-auto cursor-pointer"
          >
            Write a review
          </button>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-[20px] border border-amber-800/40 p-6 lg:p-8 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow"
            >
              <div className="space-y-4">
                {/* User Info Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border border-gray-200">
                      <Image src={item.avatar} alt={item.author} fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-black font-['Manrope']">{item.author}</h3>
                    </div>
                  </div>
                  <span className="text-sm font-normal text-black/70 font-['Manrope']">
                    {item.timeAgo}
                  </span>
                </div>

                {/* Yellow Stars */}
                <div className="flex items-center text-yellow-400 gap-1 text-2xl pt-1">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} weight="fill" className="w-6 h-6" />
                  ))}
                </div>

                {/* Review Title & Body */}
                <div>
                  <h4 className="text-xl font-bold text-black font-['Manrope'] leading-tight mb-2">
                    {item.title}
                  </h4>
                  <p className="text-base text-black font-normal font-['Manrope'] leading-relaxed">
                    {item.content}
                  </p>
                </div>
              </div>

              {/* Photo Thumbnails */}
              <div className="flex items-center gap-3 pt-6">
                {item.photos.map((photoUrl, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 rounded-[5px] overflow-hidden border border-gray-200 bg-gray-100"
                  >
                    <Image src={photoUrl} alt="Review attachment" fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Write a Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setReviewModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black p-1"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold text-black font-['Manrope'] mb-2">Write a Review</h3>
            <p className="text-sm text-gray-600 font-['Manrope'] mb-6">
              Share your experience with Eligo Leather products.
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4 font-['Manrope']">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={newReview.name}
                  onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                  placeholder="e.g. Muhammad Usman"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-hidden focus:border-amber-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Rating</label>
                <div className="flex items-center gap-2 text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        weight={star <= newReview.rating ? "fill" : "regular"}
                        className="w-7 h-7"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Review Title</label>
                <input
                  type="text"
                  required
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                  placeholder="e.g. Excellent Quality"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-hidden focus:border-amber-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Review</label>
                <textarea
                  required
                  rows={4}
                  value={newReview.content}
                  onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                  placeholder="Write your review here..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-hidden focus:border-amber-800 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-amber-800 text-white text-sm font-semibold hover:bg-amber-900 shadow-md"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
