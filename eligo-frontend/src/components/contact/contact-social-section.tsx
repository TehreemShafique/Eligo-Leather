"use client"

import Link from "next/link"
import { InstagramLogo, FacebookLogo, TwitterLogo, Question } from "@phosphor-icons/react"

export function ContactSocialSection() {
  return (
    <section className="mx-auto w-full max-w-[1280px] space-y-[62px] px-4 pb-[100px] font-['Manrope'] sm:px-6 lg:px-8 xl:px-0">
      {/* Follow Eligo Leather */}
      <div>
        <div className="mx-auto mb-20 max-w-[707px] space-y-5 text-center">
          <h2 className="text-4xl font-bold leading-tight text-black sm:text-5xl sm:leading-[56px]">
            Follow Eligo Leather
          </h2>
          <p className="text-lg font-normal text-black sm:text-xl">
            Follow us for new arrivals, product launches, craftsmanship stories, exclusive offers, and behind-the-scenes content.
          </p>
        </div>

        {/* 3 Social Cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-8 xl:grid-cols-[repeat(3,384px)] xl:gap-[49.333px]">
          {/* Instagram Card */}
          <div className="flex min-h-60 flex-col items-center space-y-4 rounded-3xl bg-white p-8 text-center shadow-[0_4px_24px_rgba(50,27,22,0.07)] transition-shadow hover:shadow-xl">
            <div className="w-20 h-20 bg-pink-600 rounded-full flex items-center justify-center text-white shadow-md">
              <InstagramLogo className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Instagram</h3>
              <p className="text-sm text-gray-500 font-normal">@eligoleather</p>
            </div>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-800 text-xs font-semibold uppercase tracking-wider hover:underline"
            >
              Follow
            </a>
          </div>

          {/* Facebook Card */}
          <div className="flex min-h-60 flex-col items-center space-y-4 rounded-3xl bg-white p-8 text-center shadow-[0_4px_24px_rgba(50,27,22,0.07)] transition-shadow hover:shadow-xl">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
              <FacebookLogo className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Facebook</h3>
              <p className="text-sm text-gray-500 font-normal">Eligo Leather</p>
            </div>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-800 text-xs font-semibold uppercase tracking-wider hover:underline"
            >
              Follow
            </a>
          </div>

          {/* Twitter Card */}
          <div className="flex min-h-60 flex-col items-center space-y-4 rounded-3xl bg-white p-8 text-center shadow-[0_4px_24px_rgba(50,27,22,0.07)] transition-shadow hover:shadow-xl">
            <div className="w-20 h-20 bg-sky-500 rounded-full flex items-center justify-center text-white shadow-md">
              <TwitterLogo className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">X (Twitter)</h3>
              <p className="text-sm text-gray-500 font-normal">@eligoleather</p>
            </div>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-800 text-xs font-semibold uppercase tracking-wider hover:underline"
            >
              Follow
            </a>
          </div>
        </div>
      </div>

      {/* Have Questions? FAQ Banner Card */}
      <div className="flex flex-col items-center justify-between gap-8 rounded-3xl bg-stone-300 p-8 lg:flex-row lg:p-12">
        <div className="flex items-center gap-6">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-red-400/10 text-amber-800 lg:size-20">
            <Question className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-medium leading-tight text-black sm:text-3xl sm:leading-9">
              Have Questions?
            </h3>
            <p className="max-w-96 text-sm leading-6 text-black">
              Visit our FAQ page to find answers about shipping, returns, products, orders, warranty, and payments.
            </p>
          </div>
        </div>

        <Link
          href="/#faq-section"
          className="shrink-0 rounded-[10px] bg-amber-800 px-7 py-2.5 text-center font-['Manrope'] text-sm font-medium uppercase tracking-wide text-stone-100 transition-colors hover:bg-amber-900"
        >
          Explore FAQ
        </Link>
      </div>
    </section>
  )
}
