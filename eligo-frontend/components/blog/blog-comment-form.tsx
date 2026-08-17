"use client"

import { useState } from "react"
import { toast } from "sonner"

export function BlogCommentForm() {
  const [formData, setFormData] = useState({ name: "", email: "", comment: "" })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    setTimeout(() => {
      toast.success("Thank you! Your comment has been submitted for moderation.")
      setFormData({ name: "", email: "", comment: "" })
      setSubmitting(false)
    }, 400)
  }

  return (
    <section className="mt-20 pt-12 border-t border-gray-200 max-w-4xl mx-auto font-['Manrope']">
      <h2 className="text-4xl sm:text-5xl font-bold text-black tracking-tight text-center mb-2">
        Leave a comment
      </h2>

      <p className="text-center text-gray-600 text-base mb-8">
        Please note, comments need to be approved before they are published
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Name"
              className="w-full h-12 px-4 rounded-[10px] border border-amber-800 bg-white text-black text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email"
              className="w-full h-12 px-4 rounded-[10px] border border-amber-800 bg-white text-black text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
            />
          </div>
        </div>

        {/* Comment Textarea */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Comment</label>
          <textarea
            required
            rows={4}
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            placeholder="Comment"
            className="w-full p-4 rounded-[10px] border border-amber-800 bg-white text-black text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 h-12 bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold rounded-[10px] shadow-md transition-colors font-['Manrope'] cursor-pointer"
          >
            {submitting ? "Submitting..." : "Post Comment"}
          </button>
        </div>
      </form>
    </section>
  )
}
