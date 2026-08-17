import type { Metadata } from "next"
import { SalesContent } from "@/components/static/sales-content"

export const metadata: Metadata = {
  title: "Sales & Special Offers | Eligo Leather",
  description: "Explore exclusive sales, clearance deals, bundle discounts, and VIP offers on genuine handmade leather products.",
}

export default function SalesPage() {
  return <SalesContent />
}
