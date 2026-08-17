"use client"

import { EnvelopeSimple, PhoneCall, MapPin, Clock } from "@phosphor-icons/react"

export function ContactCards() {
  const googleMapsUrl =
    "https://maps.google.com/?q=Gulberg+Empire,+Civic+Center,+Executive+Block,+Gulberg+Greens,+Islamabad"

  return (
    <section className="py-12 font-['Manrope']">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl sm:text-5xl font-bold text-black tracking-tight">
          How to Reach Us
        </h2>
      </div>

      {/* 3 Contact Method Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Card 1: Email Us */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-amber-100/60 rounded-full flex items-center justify-center text-amber-800">
              <EnvelopeSimple className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-medium text-black">Email Us</h3>

            <p className="text-sm text-gray-700 leading-relaxed">
              For product inquiries, order support, or general questions, contact us by email.
            </p>

            <a
              href="mailto:info@eligoleather.com"
              className="text-base font-medium text-amber-800 hover:text-amber-900 block"
            >
              info@eligoleather.com
            </a>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
            <Clock className="w-4 h-4 text-amber-800" />
            <span>Response within 24–48 hours</span>
          </div>
        </div>

        {/* Card 2: Call Us */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-amber-100/60 rounded-full flex items-center justify-center text-amber-800">
              <PhoneCall className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-medium text-black">Call Us</h3>

            <div className="space-y-1">
              <a
                href="tel:+923345399470"
                className="text-base font-medium text-amber-800 hover:text-amber-900 block"
              >
                +92 334 5399470
              </a>
              <a
                href="tel:0512745781"
                className="text-base font-medium text-amber-800 hover:text-amber-900 block"
              >
                051-2745781
              </a>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
            <Clock className="w-4 h-4 text-amber-800" />
            <span>Monday–Saturday · 9:00 AM – 5:00 PM</span>
          </div>
        </div>

        {/* Card 3: Visit Our Office */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-amber-100/60 rounded-full flex items-center justify-center text-amber-800">
              <MapPin className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-medium text-black">Visit Our Office</h3>

            <div className="text-sm text-gray-700 leading-relaxed space-y-0.5">
              <p>Office #407, 4th Floor</p>
              <p>Gulberg Empire, Civic Center</p>
              <p>Executive Block, Gulberg Greens</p>
              <p>Islamabad, Pakistan</p>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-800 text-amber-800 text-xs font-normal uppercase tracking-wide hover:bg-amber-800 hover:text-white transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>View on Google Maps</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
