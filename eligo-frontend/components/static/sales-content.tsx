"use client"

import { useState } from "react"
import Link from "next/link"
import { Tag, Gift, Users, Lightning, EnvelopeSimple, Truck, Sparkle } from "@phosphor-icons/react"
import { toast } from "sonner"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { SaleBannerSection } from "@/components/home/sale-banner-section"
import { ProductsSection } from "@/components/home/products-section"

export function SalesContent() {
  const [vipEmail, setVipEmail] = useState("")

  const handleVipSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vipEmail) return
    toast.success("Welcome to the Eligoleather VIP List! Check your email for your exclusive welcome discount code.")
    setVipEmail("")
  }

  return (
    <div className="py-8 bg-slate-50 min-h-screen font-['Manrope'] text-black space-y-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* SEO Breadcrumbs */}
        <div className="mb-4">
          <Breadcrumbs items={[{ label: "Sales & Offers" }]} />
        </div>

        {/* Page Title Header */}
        <div className="mb-4">
          <h1 className="text-5xl sm:text-6xl font-bold text-amber-800 tracking-tight">
            Sales &amp; Special Offers
          </h1>
        </div>

        {/* Intro Banner */}
        <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs text-lg text-black font-normal leading-relaxed">
          At <strong className="font-bold text-amber-800">Eligoleather</strong>, we believe that luxury and affordability can go hand in hand. We’re committed to offering you exclusive deals and seasonal promotions on our finest leather goods, so you can enjoy premium wallets, belts, and keychain covers without compromising on quality or style.
        </div>

        {/* Current Sales & Offers Breakdown Grid */}
        <div className="space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-black tracking-tight">
            Current Sales and Offers
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Seasonal Sales */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-800/10 rounded-full flex items-center justify-center text-amber-800 mb-2">
                <Tag className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-black">Seasonal Sales</h3>
              <p className="text-gray-700 text-base leading-relaxed">
                Explore our exclusive seasonal sales for limited-time discounts on a selection of our bestselling leather products. Whether you’re looking for a classic leather wallet or a stylish belt, our seasonal promotions make it easier to upgrade your collection.
              </p>
            </div>

            {/* Clearance Deals */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-800/10 rounded-full flex items-center justify-center text-amber-800 mb-2">
                <Sparkle className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-black">Clearance Deals</h3>
              <p className="text-gray-700 text-base leading-relaxed">
                Don’t miss out on our Clearance Section where you’ll find discounted items, including past collections and final-sale pieces. These products are limited in stock, so act fast before they’re gone!
              </p>
            </div>

            {/* Bundle Offers */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-800/10 rounded-full flex items-center justify-center text-amber-800 mb-2">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-black">Bundle Offers</h3>
              <p className="text-gray-700 text-base leading-relaxed">
                Shop our Bundle Offers to save more! Combine your favorite leather wallet, belt, and keychain cover for a special discounted rate. Bundling is the perfect way to enjoy multiple products while saving money.
              </p>
            </div>

            {/* Free Shipping */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-800/10 rounded-full flex items-center justify-center text-amber-800 mb-2">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-black">Free Shipping</h3>
              <p className="text-gray-700 text-base leading-relaxed">
                For a limited time, we’re offering Free Shipping on all orders over 2000/- PKR. Shop now and take advantage of this offer to get your favorite leather goods delivered straight to your doorstep without extra shipping costs.
              </p>
            </div>
          </div>
        </div>

        {/* Live Countdown Promotional Sale Banner */}
        <SaleBannerSection />

        {/* Sign Up for Exclusive Discounts Box */}
        <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl space-y-6">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Sign Up for Exclusive Discounts
            </h2>
            <p className="text-lg text-gray-300">
              Join our <strong className="text-amber-400 font-bold">Eligoleather VIP List</strong> to receive:
            </p>

            <ul className="list-disc list-inside space-y-2 text-base text-gray-200 pl-2">
              <li>
                <strong className="text-white font-bold">Exclusive discount codes</strong> delivered directly to your inbox.
              </li>
              <li>Early access to new collections and sales events.</li>
              <li>Special offers and promotions tailored to your shopping preferences.</li>
            </ul>

            <p className="text-sm text-gray-400 pt-1">
              Sign up today and be the first to know about exciting deals and new product releases!
            </p>
          </div>

          <form onSubmit={handleVipSubmit} className="max-w-xl pt-2">
            <div className="bg-white rounded-full p-1.5 flex items-center shadow-lg">
              <div className="pl-4 text-gray-400">
                <EnvelopeSimple className="w-5 h-5" />
              </div>
              <input
                type="email"
                required
                value={vipEmail}
                onChange={(e) => setVipEmail(e.target.value)}
                placeholder="Enter your VIP email address"
                className="w-full bg-transparent px-3 py-2 text-black text-sm font-medium focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold rounded-full transition-colors shrink-0"
              >
                Join VIP
              </button>
            </div>
          </form>
        </div>

        {/* Gift Cards, Referral Program & Upcoming Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Gift Cards */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-amber-800/10 rounded-full flex items-center justify-center text-amber-800">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-black">Gift Cards</h3>
              <p className="text-gray-700 text-base leading-relaxed">
                Give the gift of timeless style with our <strong className="font-bold text-black">Eligoleather Gift Cards</strong>. Available in various denominations, our gift cards are perfect for birthdays, holidays, or special occasions. They never expire and can be used toward any item on our website, including sale products.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/products"
                className="inline-block w-full py-2.5 px-4 rounded-[5px] border border-amber-800 text-amber-800 text-sm font-semibold text-center hover:bg-amber-800 hover:text-white transition-colors"
              >
                Purchase Gift Card
              </Link>
            </div>
          </div>

          {/* Referral Program */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-amber-800/10 rounded-full flex items-center justify-center text-amber-800">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-black">Referral Program</h3>
              <p className="text-gray-700 text-base leading-relaxed">
                Do you love your Eligoleather products? Refer a friend and both of you can enjoy savings! For every successful referral, you and your friend will receive <strong className="font-bold text-black">15% off</strong> your next purchase. Share the elegance of leather craftsmanship and earn rewards for spreading the word.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => toast.info("Referral link copied to clipboard! Share it with friends.")}
                className="w-full py-2.5 px-4 rounded-[5px] bg-amber-800 text-white text-sm font-semibold text-center hover:bg-amber-900 transition-colors cursor-pointer"
              >
                Invite a Friend
              </button>
            </div>
          </div>

          {/* Upcoming Sales Events */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-amber-800/10 rounded-full flex items-center justify-center text-amber-800">
                <Lightning className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-black">Upcoming Sales Events</h3>
              <p className="text-gray-700 text-base leading-relaxed">
                Keep an eye on our website for special sale events during:
              </p>
              <ul className="list-disc list-inside font-bold text-black text-base space-y-1 pl-1">
                <li>Black Friday</li>
                <li>Cyber Monday</li>
                <li>Holiday Sales</li>
                <li>New Year’s Sales</li>
              </ul>
              <p className="text-gray-700 text-sm pt-1">
                We regularly host flash sales and limited-time offers, so be sure to check back often and take advantage of these incredible deals.
              </p>
            </div>
          </div>
        </div>

        {/* Discounted Products Section Showcase */}
        <ProductsSection />
      </div>
    </div>
  )
}
