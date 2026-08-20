import { buildSeoMetadata } from "@/lib/seo"

export const metadata = buildSeoMetadata({
  title: "Customer Login",
  description: "Sign in to your Eligo Leather customer account to manage account information and access your shopping experience.",
  path: "/login",
  noIndex: true,
})

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}