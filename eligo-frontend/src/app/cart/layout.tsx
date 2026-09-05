import { buildSeoMetadata } from "@/lib/seo"

export const metadata = buildSeoMetadata({
  title: "Shopping Cart",
  description: "Review the leather products in your Eligo Leather shopping cart before proceeding to secure checkout.",
  path: "/cart",
  noIndex: true,
})

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children
}