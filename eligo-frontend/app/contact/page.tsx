import type { Metadata } from "next"
import { ContactView } from "@/components/contact/contact-view"

export const metadata: Metadata = {
  title: "Contact Us | Eligo Leather",
  description: "Get in touch with Eligo Leather customer support team. Reach out via email, phone, or visit our office in Islamabad.",
}

export default function ContactPage() {
  return <ContactView />
}
