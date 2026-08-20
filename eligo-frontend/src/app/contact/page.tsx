import { ContactHero } from "@/components/contact/contact-hero"
import { buildSeoMetadata } from "@/lib/seo"
import { ContactCards } from "@/components/contact/contact-cards"
import { ContactFormSection } from "@/components/contact/contact-form-section"
import { ContactSocialSection } from "@/components/contact/contact-social-section"

export const metadata = buildSeoMetadata({ title: "Contact Eligo Leather Customer Support", description: "Contact Eligo Leather for product questions, order assistance, delivery information and customer support by phone, email or at our Islamabad office.", path: "/contact", keywords: ["Eligo Leather contact", "leather store Islamabad"] })

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 font-['Manrope']">
      <ContactHero />

      <ContactCards />
      <ContactFormSection />
      <ContactSocialSection />

    </main>
  )
}
