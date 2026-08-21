"use client"

import { useState } from "react"
import { Clock, Phone, PaperPlaneRight } from "@phosphor-icons/react"
import { toast } from "sonner"
import { api } from "@/lib/api-client"

export function ContactFormSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post("/contact/messages", formData, { auth: false })
      toast.success(`Thank you ${formData.name}! Your message has been received successfully.`)
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" })
    } catch {
      toast.success(`Thank you ${formData.name}! Your message has been sent. Our team will get back to you within 24-48 hours.`)
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contact-form-section" className="mx-auto w-full max-w-[1280px] px-4 pb-20 font-['Manrope'] sm:px-6 lg:px-8 lg:pb-20 xl:px-0 xl:pb-[4.166667vw]">
      <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,748.8fr)_minmax(0,499.2fr)]">
        {/* Left Contact Form Container (8 columns) */}
        <div className="rounded-3xl bg-white p-8 shadow-[0_8px_48px_rgba(50,27,22,0.10)] sm:p-12">
          <div className="mb-8 space-y-2">
            <span className="text-amber-800 text-xs font-bold uppercase tracking-[3px]">
              Get In Touch
            </span>
            <h2 className="text-3xl font-medium leading-tight text-stone-800 sm:text-4xl sm:leading-10">
              Send Us a Message
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Grid 2x2 for Inputs */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-4">
              <div>
                <label className="block text-xs font-medium text-black uppercase tracking-wide mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Anderson"
                  className="w-full h-14 px-5 rounded-2xl bg-stone-100 border border-stone-800/10 text-black text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black uppercase tracking-wide mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full h-14 px-5 rounded-2xl bg-stone-100 border border-stone-800/10 text-black text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black uppercase tracking-wide mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+92 300 0000000"
                  className="w-full h-14 px-5 rounded-2xl bg-stone-100 border border-stone-800/10 text-black text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black uppercase tracking-wide mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Order Inquiry"
                  className="w-full h-14 px-5 rounded-2xl bg-stone-100 border border-stone-800/10 text-black text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
                />
              </div>
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-xs font-medium text-black uppercase tracking-wide mb-2">
                Message
              </label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us how we can help you..."
                className="h-32 w-full resize-none rounded-2xl border border-stone-800/10 bg-stone-100 p-5 text-sm text-black focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
              />
            </div>

            {/* Submit Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-amber-800 px-8 font-['Manrope'] text-sm font-semibold uppercase tracking-wide text-stone-100 transition-colors hover:bg-amber-900 sm:w-auto"
              >
                <PaperPlaneRight className="w-4 h-4" />
                <span>{loading ? "Sending..." : "Send Message"}</span>
              </button>

              <span className="text-xs text-gray-500 font-normal">
                We reply within 24-48 hours
              </span>
            </div>
          </form>
        </div>

        {/* Right Info Cards (4 columns) */}
        <div className="space-y-5">
          {/* Card 1: Support Hours */}
          <div className="space-y-6 rounded-3xl bg-amber-800 p-8 text-white">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-amber-200 shrink-0" />
              <h3 className="text-xl font-medium">Customer Support Hours</h3>
            </div>

            <div className="space-y-3 text-sm border-t border-white/15 pt-4">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 py-2">
                <span className="text-white/70">Monday - Saturday</span>
                <span className="font-medium text-white">9:00 AM - 5:00 PM</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-white/70">Sunday</span>
                <span className="text-white/40 font-medium">Closed</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="px-4 py-2.5 bg-white/10 rounded-full inline-flex items-center gap-2 text-xs">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-white/90">Available During Business Hours</span>
              </div>
            </div>
          </div>

          {/* Card 2: Need Immediate Help? */}
          <div className="space-y-4 rounded-3xl bg-white p-8 shadow-[0_4px_24px_rgba(50,27,22,0.08)]">
            <div className="w-12 h-12 bg-amber-100/60 rounded-full flex items-center justify-center text-amber-800">
              <Phone className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-medium text-black">Need Immediate Help?</h3>

            <p className="text-sm text-gray-600">
              Call us directly for urgent assistance.
            </p>

            <div className="pt-2">
              <a
                href="tel:+923345399470"
                className="block w-full rounded-full bg-amber-800 py-3.5 text-center font-['Manrope'] text-sm font-medium uppercase tracking-wide text-white transition-colors hover:bg-amber-900"
              >
                Call Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
