"use client"

import Link from "next/link"
import Image from "next/image"
import { Calendar } from "@phosphor-icons/react"

export interface FeaturedPost {
  slug: string
  title: string
  date: string
  excerpt: string
  image: string
}

const DEFAULT_FEATURED_POST: FeaturedPost = {
  slug: "timeless-black-leather-accessories",
  title: "Timeless Black Leather Accessories for Everyday Style",
  date: "Feb 4, 2026",
  excerpt:
    "Upgrade your daily essentials with a refined collection of black leather accessories designed for style, durability, and convenience. From a premium wallet and classic belt to a keychain, storage pouch, and cable organizer, each piece adds a polished look while keeping everyday items organized. The black leather finish with brass details creates a bold, elegant appearance suitable for both personal use and gifting.",
  image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1200",
}

export function BlogHero({ post = DEFAULT_FEATURED_POST }: { post?: FeaturedPost }) {
  return (
    <section className="mb-16 font-['Manrope']">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 sm:p-8 rounded-[20px] border border-gray-100 shadow-sm">
        {/* Featured Image (8 cols on desktop) */}
        <div className="lg:col-span-8 relative w-full h-[350px] sm:h-[480px] lg:h-[550px] rounded-[20px] overflow-hidden bg-zinc-100">
          <Image
            src={post.image}
            alt={post.title}
            fill
            priority
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Featured Post Text Content (4 cols on desktop) */}
        <div className="lg:col-span-4 flex flex-col justify-center space-y-4">
          <div className="flex items-center gap-2 text-amber-800 text-sm font-semibold">
            <Calendar className="w-4 h-4" />
            <span>{post.date}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black leading-[1.15] tracking-tight hover:text-amber-800 transition-colors">
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h2>

          <p className="text-gray-700 text-base sm:text-lg font-normal leading-relaxed">
            {post.excerpt}
          </p>

          <div className="pt-2">
            <Link
              href={`/blog/${post.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold rounded-[5px] transition-colors shadow-md"
            >
              Read Full Article &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
