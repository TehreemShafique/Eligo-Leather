"use client"

import Link from "next/link"
import { FacebookLogo, InstagramLogo, TwitterLogo, YoutubeLogo, WhatsappLogo, LinkedinLogo } from "@phosphor-icons/react"

export function Footer() {
  const currentYear = 2026

  return (
    <footer className="w-full max-w-[1920px] min-h-[400px] mx-auto bg-black text-white pt-12 pb-8 font-['Manrope']">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Quick Links */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-amber-800 text-lg font-bold tracking-wide font-['Manrope']">
            Quick Links
          </h3>
          <ul className="space-y-3 text-sm font-normal text-white/90 font-['Manrope']">
            <li>
              <Link href="/" className="hover:text-amber-500 transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-amber-500 transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-amber-500 transition-colors">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Our Categories */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-amber-800 text-lg font-bold tracking-wide font-['Manrope']">
            Our Categories
          </h3>
          <ul className="space-y-3 text-sm font-normal text-white/90 font-['Manrope']">
            <li>
              <Link href="/categories/wallets" className="hover:text-amber-500 transition-colors">
                Wallets
              </Link>
            </li>
            <li>
              <Link href="/categories/belts" className="hover:text-amber-500 transition-colors">
                Belts
              </Link>
            </li>
            <li>
              <Link href="/categories/keychains" className="hover:text-amber-500 transition-colors">
                Key Chain
              </Link>
            </li>
            <li>
              <Link href="/categories/cases" className="hover:text-amber-500 transition-colors">
                Cases
              </Link>
            </li>
          </ul>
        </div>

        {/* Our Policies */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-amber-800 text-lg font-bold tracking-wide font-['Manrope']">
            Our Policies
          </h3>
          <ul className="space-y-3 text-sm font-normal text-white/90 font-['Manrope']">
            <li>
              <Link href="/privacy-policy" className="hover:text-amber-500 transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className="hover:text-amber-500 transition-colors">
                Refund Policy
              </Link>
            </li>
            <li>
              <Link href="/terms-of-service" className="hover:text-amber-500 transition-colors">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>

        {/* Find Us */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-amber-800 text-lg font-bold tracking-wide font-['Manrope']">
            Find Us
          </h3>
          <div className="text-sm text-white/90 leading-relaxed font-['Manrope'] space-y-2">
            <p>
              Office # 407, 4th floor, Gulberg Empire, Civic Center, Executive Block, Gulberg Greens, Islamabad
            </p>
            <p className="text-white/75 font-mono text-xs pt-1">
              051-2745781
              <br />
              0334-5399470
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 my-6">
        <div className="w-full h-px bg-white/20" />
      </div>

      {/* Copyright & Social Bar */}
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-white/80 font-['Manrope'] tracking-wide text-center sm:text-left">
          © {currentYear}, Eligo Leather, Design &amp; Develop By BitBlazeTec
        </p>

        <div className="flex items-center space-x-3 text-white">
          <a href="#" aria-label="Facebook" className="p-1.5 hover:text-amber-500 transition-colors">
            <FacebookLogo className="w-5 h-5" />
          </a>
          <a href="#" aria-label="Instagram" className="p-1.5 hover:text-amber-500 transition-colors">
            <InstagramLogo className="w-5 h-5" />
          </a>
          <a href="#" aria-label="Twitter" className="p-1.5 hover:text-amber-500 transition-colors">
            <TwitterLogo className="w-5 h-5" />
          </a>
          <a href="#" aria-label="Youtube" className="p-1.5 hover:text-amber-500 transition-colors">
            <YoutubeLogo className="w-5 h-5" />
          </a>
          <a href="#" aria-label="Whatsapp" className="p-1.5 hover:text-amber-500 transition-colors">
            <WhatsappLogo className="w-5 h-5" />
          </a>
          <a href="#" aria-label="Linkedin" className="p-1.5 hover:text-amber-500 transition-colors">
            <LinkedinLogo className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  )
}

