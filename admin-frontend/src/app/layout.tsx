import type { Metadata } from "next"
import { Manrope } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { AdminLayout } from "@/components/layout/admin-layout"

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
})

export const metadata: Metadata = {
  title: "Eligo Leather | Shopify Admin Panel",
  description: "Shopify-style management admin portal for Eligo Leather store, orders, products, growth, and settings.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={manrope.variable} suppressHydrationWarning>
      <body className={`${manrope.className} font-sans antialiased bg-[#f1f1f1]`} suppressHydrationWarning>
        <Toaster position="top-right" richColors />
        <AdminLayout>{children}</AdminLayout>
      </body>
    </html>
  )
}
