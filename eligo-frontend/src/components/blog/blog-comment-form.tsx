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
    <section className="mx-auto w-full max-w-[730px] px-4 pb-20 pt-16 font-['Manrope'] sm:px-0 lg:pb-[4.0625vw] lg:pt-[3.125vw]">
      <h2 className="mb-[30px] text-4xl font-bold leading-tight text-black sm:text-5xl sm:leading-[56px]">
        Leave a comment
      </h2>


      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-[60px]">
          {/* Name Field */}
          <div>
            <label className="sr-only">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Name"
              className="h-12 w-full rounded-[10px] border border-amber-800 bg-white px-5 text-sm font-medium text-black placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="sr-only">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email"
              className="h-12 w-full rounded-[10px] border border-amber-800 bg-white px-5 text-sm font-medium text-black placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
            />
          </div>
        </div>

        {/* Comment Textarea */}
        <div className="mt-8">
          <label className="sr-only">Comment</label>
          <textarea
            required
            rows={4}
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            placeholder="Comment"
            className="h-24 w-full resize-none rounded-[10px] border border-amber-800 bg-white px-5 py-4 text-sm font-medium text-black placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
          />
        </div>

        <p className="mt-1 text-lg font-normal text-black">
          Please note, comments need to be approved before they are published
        </p>

        {/* Submit Button */}
        <div className="mt-[35px] flex justify-center">
          <button
            type="submit"
            disabled={submitting}
            className="h-12 w-40 cursor-pointer rounded-[10px] bg-amber-800 font-['Manrope'] text-sm font-semibold text-white transition-colors hover:bg-amber-900"
          >
            {submitting ? "Submitting..." : "Post Comment"}
          </button>
        </div>
      </form>
    </section>
  )
}
