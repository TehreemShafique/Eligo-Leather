"use client"

import Link from "next/link"
import Image from "next/image"
import { Calendar } from "@phosphor-icons/react"

export interface BlogPostItem {
  id: string | number
  slug: string
  title: string
  date: string
  excerpt: string
  image: string
}

export function BlogCard({ post }: { post: BlogPostItem }) {
  return (
    <article className="group bg-white rounded-[20px] border border-gray-100 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between font-['Manrope']">
      <div>
        {/* Post Cover Image */}
        <div className="relative h-72 sm:h-80 w-full bg-zinc-100 rounded-[20px] overflow-hidden mb-4">
          <Image
            src={post.image}
            alt={post.title}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Date & Metadata */}
        <div className="flex items-center gap-2 text-amber-800 text-sm font-normal mb-2">
          <Calendar className="w-4 h-4" />
          <span>{post.date}</span>
        </div>

        {/* Post Title */}
        <h3 className="text-xl font-semibold text-black leading-snug mb-3 group-hover:text-amber-800 transition-colors line-clamp-2">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>

        {/* Post Excerpt */}
        <p className="text-base text-gray-700 font-normal leading-relaxed line-clamp-3 mb-4">
          {post.excerpt}
        </p>
      </div>

      <div className="pt-2">
        <Link
          href={`/blog/${post.slug}`}
          className="text-sm font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-4 inline-flex items-center gap-1"
        >
          Read Article &rarr;
        </Link>
      </div>
    </article>
  )
}
