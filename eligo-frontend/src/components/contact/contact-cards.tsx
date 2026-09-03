"use client"

import { EnvelopeSimple, PhoneCall, MapPin, Clock } from "@phosphor-icons/react"

export function ContactCards() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pb-24 pt-20 font-['Manrope'] sm:px-6 lg:px-8 lg:pb-24 lg:pt-20 xl:px-0 xl:pb-[5.416667vw] xl:pt-[4.166667vw]">
      {/* Section Header */}
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-bold leading-tight text-black sm:text-5xl sm:leading-[56px]">
          How to Reach Us
        </h2>
      </div>

      {/* 3 Contact Method Cards */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-8 xl:grid-cols-[repeat(3,384px)] xl:gap-[50.666px]">
        {/* Card 1: Email Us */}
        <div className="flex min-h-80 flex-col justify-between rounded-3xl bg-white p-8 shadow-[0_4px_24px_rgba(50,27,22,0.07)]">
          <div className="space-y-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-stone-300 text-amber-800">
              <EnvelopeSimple className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-medium text-black">Email Us</h3>

            <p className="text-sm leading-6 text-black">
              For product inquiries, order support, or general questions, contact us by email.
            </p>

            <a
              href="mailto:info@eligoleather.com"
              className="text-base font-medium text-amber-800 hover:text-amber-900 block"
            >
              info@eligoleather.com
            </a>
          </div>

          <div className="flex items-center gap-1.5 pt-4 text-xs leading-4 text-black">
            <Clock className="w-4 h-4 text-amber-800" />
            <span>Response within 24–48 hours</span>
          </div>
        </div>

        {/* Card 2: Call Us */}
        <div className="flex min-h-80 flex-col justify-between rounded-3xl bg-white p-8 shadow-[0_4px_24px_rgba(50,27,22,0.07)]">
          <div className="space-y-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-stone-300 text-amber-800">
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

          <div className="flex items-center gap-1.5 pt-4 text-xs leading-4 text-black">
            <Clock className="w-4 h-4 text-amber-800" />
            <span>Monday–Saturday · 9:00 AM – 5:00 PM</span>
          </div>
        </div>

        {/* Card 3: Visit Our Office */}
        <div className="flex min-h-80 flex-col justify-between rounded-3xl bg-white p-8 shadow-[0_4px_24px_rgba(50,27,22,0.07)]">
          <div className="space-y-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-stone-300 text-amber-800">
              <MapPin className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-medium text-black">Visit Our Office</h3>

            <div className="text-sm leading-6 text-black space-y-0.5">
              <p>Office #407, 4th Floor</p>
              <p>Gulberg Empire, Civic Center</p>
              <p>Executive Block, Gulberg Greens</p>
              <p>Islamabad, Pakistan</p>
            </div>
          </div>

          <div className="pt-2">
            <a
              href="https://maps.app.goo.gl/qf5psEBjZ2DZBAT19"
              //href="https://www.google.com/maps/place/Gulberg+Empire/@33.6005967,73.1525973,17z/data=!4m14!1m7!3m6!1s0x38dfed8e1fe5ae65:0x8b8839f7a8567077!2sGulberg+Empire!8m2!3d33.6005967!4d73.1525973!16s%2Fg%2F11frdrb6ml!3m5!1s0x38dfed8e1fe5ae65:0x8b8839f7a8567077!8m2!3d33.6005967!4d73.1525973!16s%2Fg%2F11frdrb6ml?entry=ttu&g_ep=EgoyMDI2MDgxOS4wIKXMDSoASAFQAw%3D%3D"
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
