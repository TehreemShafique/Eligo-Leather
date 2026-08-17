import type { Metadata } from "next"
import { TermsOfServiceContent } from "@/components/static/terms-of-service-content"

export const metadata: Metadata = {
  title: "Terms of Service | Eligo Leather",
  description: "Read Eligo Leather's Terms of Service governing the use of our website, services, and product purchases.",
}

export default function TermsOfServicePage() {
  return <TermsOfServiceContent />
}
