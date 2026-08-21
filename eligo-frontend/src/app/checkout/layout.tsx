import { buildSeoMetadata } from "@/lib/seo"

export const metadata = buildSeoMetadata({
  title: "Secure Checkout",
  description: "Complete delivery and billing details to securely place your Eligo Leather order for delivery across Pakistan.",
  path: "/checkout",
  noIndex: true,
})

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}