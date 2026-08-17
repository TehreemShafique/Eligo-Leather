"use client"

import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { ContactHero } from "./contact-hero"
import { ContactCards } from "./contact-cards"
import { ContactFormSection } from "./contact-form-section"
import { ContactSocialSection } from "./contact-social-section"

export function ContactView() {
  return (
    <div className="py-8 bg-slate-50 min-h-screen font-['Manrope']">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Breadcrumbs items={[{ label: "Contact Us" }]} />
        </div>

        {/* Main Page Title: Contact Us (Placed OUTSIDE & BEFORE the first section) */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-amber-800 tracking-tight mb-8">
          Contact Us
        </h1>

        {/* First Section (1680px wide x 550px height frame starting with We're Here to Help) */}
        <ContactHero />
        <ContactCards />
        <ContactFormSection />
        <ContactSocialSection />
      </div>
    </div>
  )
}
