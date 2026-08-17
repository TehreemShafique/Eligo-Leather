import type { Metadata } from "next"
import { RefundPolicyContent } from "@/components/static/refund-policy-content"

export const metadata: Metadata = {
  title: "Refund Policy | Eligo Leather",
  description: "Read Eligo Leather's Refund & Return Policy detailing returns, exchanges, return shipping, and refund timelines.",
}

export default function RefundPolicyPage() {
  return <RefundPolicyContent />
}
