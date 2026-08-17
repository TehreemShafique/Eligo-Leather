import type { Metadata } from "next"
import { PrivacyPolicyContent } from "@/components/static/privacy-policy-content"

export const metadata: Metadata = {
  title: "Privacy Policy | Eligo Leather",
  description: "Read Eligo Leather's Privacy Policy outlining how we collect, use, and protect your personal information.",
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent />
}
