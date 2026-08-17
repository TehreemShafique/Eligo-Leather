import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { StorefrontProvider } from "@/components/layout/storefront-provider";
import { CartProvider } from "@/context/cart-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/common/toast";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eligo-Leather",
  description: "Eligo-Leather E-commerce store",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="bg-brand-white text-brand-black antialiased">
        <CartProvider>
          <StorefrontProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </StorefrontProvider>
          <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}
