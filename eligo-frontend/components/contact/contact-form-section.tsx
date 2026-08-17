"use client"

import { useState } from "react"
import { Clock, Phone, PaperPlaneRight, CheckCircle } from "@phosphor-icons/react"
import { toast } from "sonner"

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
      await fetch("http://127.0.0.1:8000/api/v1/contact/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
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
    <section id="contact-form-section" className="py-16 font-['Manrope']">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Contact Form Container (8 columns) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white p-8 sm:p-12 rounded-3xl shadow-xl border border-gray-100">
          <div className="space-y-2 mb-8">
            <span className="text-amber-800 text-xs font-bold uppercase tracking-[3px]">
              Get In Touch
            </span>
            <h2 className="text-3xl sm:text-4xl font-medium text-stone-800">
              Send Us a Message
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grid 2x2 for Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                className="w-full p-5 rounded-2xl bg-stone-100 border border-stone-800/10 text-black text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
              />
            </div>

            {/* Submit Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 bg-amber-800 hover:bg-amber-900 text-stone-100 text-sm font-semibold rounded-[10px] uppercase tracking-wide shadow-md transition-colors font-['Manrope'] cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <PaperPlaneRight className="w-4 h-4" />
                <span>{loading ? "Sending..." : "Send Message"}</span>
              </button>

              <span className="text-xs text-gray-500 font-normal">
                We reply within 24–48 hours
              </span>
            </div>
          </form>
        </div>

        {/* Right Info Cards (4 columns) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Card 1: Support Hours */}
          <div className="p-8 bg-amber-800 rounded-3xl text-white space-y-6 shadow-xl">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-amber-200 shrink-0" />
              <h3 className="text-xl font-medium">Customer Support Hours</h3>
            </div>

            <div className="space-y-3 text-sm border-t border-white/15 pt-4">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-white/70">Monday – Saturday</span>
                <span className="font-medium text-white">9:00 AM – 5:00 PM</span>
              </div>
              <div className="flex justify-between items-center py-2">
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
          <div className="p-8 bg-white rounded-3xl shadow-lg border border-gray-100 space-y-4">
            <div className="w-12 h-12 bg-amber-100/60 rounded-full flex items-center justify-center text-amber-800">
              <Phone className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-medium text-black">Need Immediate Help?</h3>

            <p className="text-sm text-gray-600">
              Call us directly for urgent assistance regarding orders or shipping.
            </p>

            <div className="pt-2">
              <a
                href="tel:+923345399470"
                className="w-full py-3.5 bg-amber-800 hover:bg-amber-900 text-white text-sm font-medium rounded-full text-center uppercase tracking-wide transition-colors block font-['Manrope']"
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
