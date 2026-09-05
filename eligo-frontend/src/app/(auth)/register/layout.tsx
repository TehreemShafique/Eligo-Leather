import { buildSeoMetadata } from "@/lib/seo"

export const metadata = buildSeoMetadata({
  title: "Create Customer Account",
  description: "Create an Eligo Leather customer account for faster checkout, account access and updates about handcrafted leather products.",
  path: "/register",
  noIndex: true,
})

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}